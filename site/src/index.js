const CANONICAL_HOST = "rentresilience.org";

// Hosts that 301 to the canonical domain. rent.kylebrodeur.xyz and
// rentresilience.xyz deliberately keep serving content directly: they are
// registered Base app domains, and domain verification reads the metatag at
// the domain itself, not after a redirect.
const REDIRECT_HOSTS = new Set([
  "www.rentresilience.xyz",
  "www.rentresilience.org",
]);

// x402 opt-in spike configuration. See docs/x402-opt-in-spike.md.
const X402 = {
  network: "base-sepolia",
  asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
  priceAtomic: "10000", // 0.01 USDC (6 decimals)
  payTo: "0x79588BB628c741d073FD3bC47685328Cf8aD6802",
  facilitator: "https://www.x402.org/facilitator",
  description: "Rent Resilience early-access opt-in for agents",
};

function paymentRequirements(resource) {
  return {
    scheme: "exact",
    network: X402.network,
    asset: X402.asset,
    maxAmountRequired: X402.priceAtomic,
    payTo: X402.payTo,
    resource: resource,
    description: X402.description,
    mimeType: "application/json",
    maxTimeoutSeconds: 300,
  };
}

function paymentRequired(resource) {
  return json({
    x402Version: 1,
    accepts: [paymentRequirements(resource)],
    error: "Payment required to join the early-access list",
  }, 402);
}

async function facilitatorCall(path, paymentPayload, requirements) {
  const res = await fetch(X402.facilitator + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      x402Version: 1,
      paymentPayload: paymentPayload,
      paymentRequirements: requirements,
    }),
  });
  if (!res.ok) return { httpError: res.status };
  return res.json();
}

async function handleOptin(request, env, ctx) {
  const resourceUrl = new URL(request.url).origin + "/api/optin";
  const requirements = paymentRequirements(resourceUrl);

  const paymentHeader = request.headers.get("X-PAYMENT");
  if (!paymentHeader) {
    track(ctx, "optin_402_served", "anonymous-agent:" + (request.headers.get("user-agent") || "unknown").slice(0, 60), {
      $current_url: resourceUrl,
    });
    return paymentRequired(resourceUrl);
  }

  let paymentPayload;
  try {
    paymentPayload = JSON.parse(atob(paymentHeader));
  } catch {
    return json({ error: "X-PAYMENT header is not valid base64 JSON" }, 400);
  }

  const verified = await facilitatorCall("/verify", paymentPayload, requirements);
  if (verified.httpError || !verified.isValid) {
    track(ctx, "optin_verify_failed", "agent:" + ((paymentPayload.authorization && paymentPayload.authorization.from) || "unknown"), {
      reason: verified.invalidReason || ("http_" + verified.httpError),
    });
    return json({
      x402Version: 1,
      error: verified.invalidReason || "payment verification failed",
    }, 402);
  }

  const settled = await facilitatorCall("/settle", paymentPayload, requirements);
  const txHash = settled.transaction || settled.txHash || null;
  if (!settled.success || !txHash) {
    track(ctx, "optin_settle_failed", "agent:" + ((paymentPayload.authorization && paymentPayload.authorization.from) || "unknown"), {});
    return json({ error: "settlement failed; payment not recorded" }, 402);
  }

  const payer = (paymentPayload.authorization && paymentPayload.authorization.from) ||
    "unknown";
  const now = new Date().toISOString();
  const row = JSON.stringify({ payer: payer, txHash: txHash, network: X402.network, at: now });
  track(ctx, "optin_settled", "agent:" + payer, {
    txHash: txHash,
    network: X402.network,
    amount_usdc: 0.01,
  });

  // WHY: settlement is confirmed before this write; if KV fails we still hand the
  // payer the tx hash in the 200 body — the chain is the source of truth, KV is
  // convenience.
  try {
    await env.RENT_OPTIN.put(txHash, row);
  } catch {
    return json({ status: "paid-not-logged", txHash: txHash, network: X402.network, at: now }, 200);
  }

  return json({
    status: "joined",
    txHash: txHash,
    network: X402.network,
    payer: payer,
    at: now,
    note: "Early access recorded. No email, no keys — the tx hash is your receipt.",
  }, 200);
}

function json(body, status) {
  return new Response(JSON.stringify(body, null, 2), {
    status: status,
    headers: { "content-type": "application/json" },
  });
}

// Email/contact capture for the opt-in section. The /api/contact route was
// wired into the router without this handler, so signups 500'd until 2026-09-08.
async function handleContact(request, env, ctx) {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON body required" }, 400);
  }
  const email = ((body && body.email) || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid email is required." }, 400);
  }
  const row = JSON.stringify({
    email: email,
    via: (body && body.via) || "email-only",
    txHash: (body && body.txHash) || null,
    at: new Date().toISOString(),
  });
  const key = "email:" + (body && body.txHash ? body.txHash : email.toLowerCase()) + ":" + Date.now();
  try {
    await env.RENT_OPTIN.put(key, row);
  } catch {
    // KV failure shouldn't fail the signup response; the request is logged in analytics.
  }
  track(ctx, "email_signup", "email:" + email.toLowerCase(), {
    via: (body && body.via) || "email-only",
    has_tx: Boolean(body && body.txHash),
  });
  return json({ status: "noted" }, 200);
}

// PostHog server-side capture. Public write-only project token; wallet
// addresses travel as pseudonymous distinct_ids, never as names/emails.
const POSTHOG = {
  key: "phc_t6hMPtdC3JaYtbvtLdFfSd3haQoeN38VfycSWQBs84QH",
  host: "https://us.i.posthog.com",
};

function track(ctx, event, distinctId, props) {
  if (!ctx) return;
  try {
    ctx.waitUntil(
      fetch(POSTHOG.host + "/capture/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          api_key: POSTHOG.key,
          event: event,
          distinct_id: distinctId,
          properties: Object.assign({ source: "worker", $lib: "rent-worker" }, props),
        }),
      }).catch(function () {})
    );
  } catch {
    // analytics must never break the payment flow
  }
}

// Human flow: wallet-app scan sends a plain EIP-681 USDC transfer on Base
// mainnet, and /api/confirm verifies Receipt → Transfer log → amount before
// logging the opt-in. Agents keep the strict 402 handshake on /api/optin.
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// Wallet-app (QR) flow runs on MAINNET: consumer wallet apps don't list testnet
// tokens, and a plain USDC transfer needs no facilitator. One cent, real receipt.
const MAINNET = {
  chainId: 8453,
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  rpc: "https://mainnet.base.org",
};

async function handleConfirm(request, env, ctx) {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON body required" }, 400);
  }
  const txHash = (body && body.txHash) || null;
  const payer = (body && body.payer) || null;
  if (!txHash && !payer) return json({ error: "txHash or payer is required" }, 400);
  const qrId = "qr:" + (payer || txHash).toLowerCase();

  const existing = txHash ? await env.RENT_OPTIN.get(txHash) : null;
  if (existing) return json({ status: "already-logged", txHash: txHash }, 200);

  async function rpc(method, params) {
    const res = await fetch(MAINNET.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params }),
    });
    if (!res.ok) return null;
    return (await res.json()).result;
  }

  function logMatches(log, wantPayer) {
    if (log.address.toLowerCase() !== MAINNET.asset) return false;
    if (parseInt(log.data, 16) < parseInt(X402.priceAtomic, 10)) return false;
    const toAddr = "0x" + log.topics[2].slice(26).toLowerCase();
    if (toAddr !== X402.payTo.toLowerCase()) return false;
    if (wantPayer) {
      const fromAddr = "0x" + log.topics[1].slice(26).toLowerCase();
      if (fromAddr !== wantPayer.toLowerCase()) return false;
    }
    return true;
  }

  // Preferred path: exact tx. Public RPCs refuse full-history log scans, so the
  // payer-only fallback windows the scan to recent blocks.
  let matched = null;
  if (txHash) {
    const receipt = await rpc("eth_getTransactionReceipt", [txHash]);
    if (receipt && receipt.status === "0x1" && Array.isArray(receipt.logs)) {
      for (const log of receipt.logs) {
        if (logMatches(log, payer)) { matched = log; break; }
      }
    }
  } else {
    const latestHex = await rpc("eth_blockNumber", []);
    if (latestHex) {
      const fromHex = "0x" + (parseInt(latestHex, 16) - 50000).toString(16);
      const logs = await rpc("eth_getLogs", [{
        address: MAINNET.asset,
        topics: [TRANSFER_TOPIC, "0x" + "0".repeat(64 - 42) + payer.slice(2).toLowerCase(),
          "0x000000000000000000000000" + X402.payTo.slice(2).toLowerCase()],
        fromBlock: fromHex,
        toBlock: "latest",
      }]) || [];
      for (const log of logs) {
        if (logMatches(log, payer)) { matched = log; break; }
      }
    }
  }

  if (!matched) {
    track(ctx, "qr_confirm_result", qrId, { result: "not-found-yet" });
    return json({
      status: "not-found-yet",
      hint: txHash
        ? "Tx receipt didn't show a 0.01+ USDC transfer to the opt-in address. Base finality is seconds; try again or check the tx on basescan.org."
        : "No recent 0.01+ USDC transfer from that payer address was found on Base mainnet.",
    }, 404);
  }

  track(ctx, "qr_confirm_result", qrId, {
    result: "joined",
    txHash: matched.transactionHash,
    amount_usdc: 0.01,
  });

  const now = new Date().toISOString();
  const row = JSON.stringify({
    payer: payer || "0x" + matched.topics[1].slice(26),
    txHash: matched.transactionHash,
    network: "base",
    at: now,
    via: "qr-eip681",
  });
  try {
    await env.RENT_OPTIN.put(matched.transactionHash, row);
  } catch {
    return json({
      status: "verified-not-logged", txHash: matched.transactionHash, at: now,
    }, 200);
  }
  return json({
    status: "joined",
    txHash: matched.transactionHash,
    network: "base",
    at: now,
    note: "Early access recorded. No email, no keys — the tx hash is your receipt.",
  }, 200);
}

// Docs subdomain proxies the GitHub Pages build. Serving through the Worker
// maps root-absolute asset paths onto the Pages subpath, which shiso emits.
const DOCS_ORIGIN = "https://kylebrodeur.github.io/rent-resilience";

async function handleDocs(request) {
  const url = new URL(request.url);
  const upstream = DOCS_ORIGIN + url.pathname + url.search;
  const res = await fetch(upstream, { headers: { accept: request.headers.get("accept") || "*/*" } });
  const headers = new Headers(res.headers);
  headers.delete("x-frame-options");
  return new Response(res.body, { status: res.status, headers: headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === "docs.rentresilience.org") {
      return handleDocs(request);
    }
    if (REDIRECT_HOSTS.has(url.hostname)) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === "/api/optin") {
      return handleOptin(request, env, ctx);
    }
    if (url.pathname === "/api/confirm") {
      return handleConfirm(request, env, ctx);
    }
    if (url.pathname === "/api/contact") {
      return handleContact(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
};
