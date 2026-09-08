#!/usr/bin/env node
// Read email signups (and optionally paid opt-ins) from the production KV
// namespace via wrangler. Read-only. Each key fetch is one KV read against the
// free-tier budget of 100k reads/day, so no cap issues at signup volumes.
//
// Usage:
//   node scripts/emails.mjs              table of email signups
//   node scripts/emails.mjs --csv        CSV to stdout (redirect to a file)
//   node scripts/emails.mjs --json       raw rows
//   node scripts/emails.mjs --paid       include paid opt-ins (tx:* keys)
//   node scripts/emails.mjs --limit 50   cap key fetches (default 500)

import { execFileSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const asCsv = args.has("--csv");
const includePaid = args.has("--paid");
const limitIdx = process.argv.indexOf("--limit");
const limit = limitIdx > -1 ? parseInt(process.argv[limitIdx + 1], 10) || 500 : 500;

function wrangler(sub, params) {
  const out = execFileSync("npx", ["wrangler", ...sub, ...params], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(out);
}

function listAll() {
  // wrangler's list returns at most 1,000 keys per call and doesn't expose the
  // next cursor; past 1,000 signups, read via the Cloudflare dashboard or the
  // REST API. Fine for a long while at signup volumes.
  return wrangler(["kv", "key"], ["list", "--binding", "RENT_OPTIN", "--remote"]);
}

const keys = listAll()
  .map((k) => (typeof k === "string" ? k : k.name))
  .filter((k) => k.startsWith("email:") || (includePaid && k.startsWith("tx:")))
  .slice(0, limit);

const rows = [];
for (const key of keys) {
  const val = wrangler(["kv", "key"], ["get", key, "--binding", "RENT_OPTIN", "--remote"]);
  try {
    const row = JSON.parse(val);
    rows.push({ key, ...row });
  } catch {
    rows.push({ key, raw: val });
  }
}
rows.sort((a, b) => (a.at || "").localeCompare(b.at || ""));

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
} else if (asCsv) {
  console.log("at,email,txHash,via,network,key");
  for (const r of rows) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    console.log([r.at, r.email || r.payer || "", r.txHash || "", r.via || (r.key.startsWith("tx:") ? "x402" : ""), r.network || "", r.key].map(esc).join(","));
  }
} else {
  if (rows.length === 0) {
    console.log("No signups yet.");
    process.exit(0);
  }
  for (const r of rows) {
    const who = r.email || r.payer || "?";
    const paid = r.txHash ? ` paid:${r.txHash.slice(0, 10)}…` : "";
    console.log(`${(r.at || "?").slice(0, 16)}  ${who.padEnd(34)} ${(r.via || "").padEnd(12)}${paid}`);
  }
  console.log(`\n${rows.length} rows${rows.length >= limit ? ` (capped at ${limit}; use --limit)` : ""}`);
}