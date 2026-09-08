#!/usr/bin/env node
/**
 * Pull opt-in data from the RENT_OPTIN KV namespace into local JSON files.
 *
 * Usage: pnpm kv:pull [founding|paid|emails|all]
 *
 * Modes:
 *   founding  payment records that carry an email (the "paid + updates" list)
 *   paid      every payment record, anonymous or not
 *   emails    every email-capture record
 *   all       all of the above in one file
 *
 * Output: site/.kv-data/<mode>-<date>.json (gitignored). The files contain
 * emails and wallet addresses: keep them local, never commit or paste into
 * shared docs.
 *
 * Requires `wrangler login` once (the script uses the wrangler CLI directly,
 * no API token needed).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(siteRoot, '.kv-data');
const BINDING = 'RENT_OPTIN';

const mode = process.argv[2] || 'founding';
if (!['founding', 'paid', 'emails', 'all'].includes(mode)) {
  console.error('Usage: pnpm kv:pull [founding|paid|emails|all]');
  process.exit(2);
}

function wr(args) {
  const r = spawnSync('pnpm', ['exec', 'wrangler', ...args], { cwd: siteRoot, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stderr.trim() || 'wrangler failed');
    process.exit(1);
  }
  return r.stdout;
}

function listKeys() {
  const keys = [];
  let cursor;
  do {
    const args = ['kv', 'key', 'list', '--remote', '--binding', BINDING];
    if (cursor) args.push('--cursor', cursor);
    const out = wr(args);
    const m = out.match(/\[[\s\S]*\]/);
    if (!m) break;
    keys.push(...JSON.parse(m[0]));
    const cm = out.match(/"cursor":"([^"]+)"/);
    cursor = cm ? cm[1] : null;
    if (!cm) break;
  } while (cursor);
  return keys.map((k) => k.name);
}

function getVal(name) {
  return wr(['kv', 'key', 'get', '--remote', '--binding', BINDING, '--text', name]).trim();
}

// Key taxonomy in RENT_OPTIN:
//   <txHash>          payment record   { payer, txHash, network, at, email? }
//   email:<…>:<ts>    email capture    { email, via, txHash, at, verify }
//   rl:<ip>:<bucket>  rate limiter     skip
const names = listKeys().filter((n) => n.startsWith('0x') || n.startsWith('email:') || n.startsWith('contact:'));

const paid = [];
const emails = [];
for (const name of names) {
  try {
    const val = JSON.parse(getVal(name));
    if (name.startsWith('0x')) paid.push(val);
    else emails.push({ key: name, ...val }); // contact:/* keys carry a key field for audit
  } catch (e) {
    console.error(`skip ${name}: ${e.message}`);
  }
}

const founding = paid.filter((p) => p.email);
const result = { pulledAt: new Date().toISOString(), counts: { paid: paid.length, emails: emails.length, founding: founding.length } };
if (mode === 'founding') result.founding = founding;
else if (mode === 'paid') result.paid = paid;
else if (mode === 'emails') result.emails = emails;
else { result.founding = founding; result.paid = paid; result.emails = emails; }

mkdirSync(OUT, { recursive: true });
const file = join(OUT, `${mode}-${new Date().toISOString().slice(0, 10)}.json`);
writeFileSync(file, JSON.stringify(result, null, 2));

const gi = join(siteRoot, '.gitignore');
if (!existsSync(gi) || !readFileSync(gi, 'utf8').includes('.kv-data/')) {
  appendFileSync(gi, '\n# local opt-in data pulls: emails + wallets, never commit\n.kv-data/\n');
}

console.log(`${mode}: ${result.counts.paid} paid, ${result.counts.founding} with email -> ${file}`);