// Pre-run 4 payment process. One per kept public node. Key 16, fee 150 sompi per gram. Counts only.
// Args: --slot i --of N   (node i of the kept list in private/nodes.json; coins split across slots by outpoint)
// Rate: control/PAY-RATE is the desk total; this process sends its even share.
// Each paid coin's change output is re-used at once (spends a mempool parent; never an orphan).
import fs from "node:fs";
import { createRequire } from "node:module";
const KIT = process.env.STORM_KIT;
const { CFG, to, connect, P, phase, reason, massOf, sleep, END, STOPF } = await import("file:///" + KIT.replace(/\\/g, "/") + "/lib.mjs");
const { keyAddress } = await import("file:///" + KIT.replace(/\\/g, "/") + "/covenant.mjs");
const require = createRequire(import.meta.url);
const k = require(CFG.kaspa_sdk);
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const SLOT = Number(arg("slot")), OF = Number(arg("of"));
const nodes = JSON.parse(fs.readFileSync(P("private", "nodes.json"), "utf8"));
const NODE = nodes[SLOT].url;
const NN = nodes[SLOT].n;                  // local node number for the logs
const KEY = 16, FEE_RATE = 150n;
const lines = fs.readFileSync(CFG.keys_file, "utf8").trim().split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const pk = new k.PrivateKey(lines[KEY]);
const addr = keyAddress(KEY);
let rpc = await connect(NODE, 4);
const lrpc = await connect(CFG.main_node_url, 4);   // lane check on the desk node
phase(`PAY_START node=${NN} of=${OF} key=16 fee=150`);
const op = (e) => `${e.outpoint.transactionId}:${e.outpoint.index}`;
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const used = new Map();   // outpoint -> ms, so a reload does not hand back a coin already paid
let pool = [];
async function load() {
  const bag = await to(lrpc.getUtxosByAddresses({ addresses: [addr] }), 60000);
  const now = Date.now();
  for (const [o, t] of used) if (now - t > 120000) used.delete(o);
  pool = (bag.entries || []).filter((e) => !e.isCoinbase && BigInt(e.amount) > 1_000_000_000n && BigInt(e.amount) < 10_000_000_000_000n && hash(op(e)) % OF === SLOT && !used.has(op(e)));
}
await load();
phase(`PAY_POOL node=${NN} n=${pool.length}`);
const rateFile = P("control", "PAY-RATE");
let minute = new Date().toISOString().slice(0, 16);
let ok = 0, attempts = 0, rateRej = 0, full = 0, other = 0, share = 0;
function roll(now) {
  const m = new Date(now).toISOString().slice(0, 16);
  if (m === minute) return;
  fs.appendFileSync(P("logs", `pay-minute-${NN}.log`), `${minute}Z node=${NN} ok=${ok} attempts=${attempts} rate=${rateRej} full=${full} other=${other} share=${share}\n`);
  minute = m; ok = 0; attempts = 0; rateRej = 0; full = 0; other = 0;
}
const payStop = P("control", "PAY-STOP");            // all payment senders (lane, runner)
const myStop = () => P("control", `PAY-STOP-${NN}`);  // this sender only (a rate reject)
let recon = false, laneAt = 0, rateStopped = false, chain = true, fails = 0;
while (Date.now() < END && !fs.existsSync(STOPF) && !fs.existsSync(payStop) && !fs.existsSync(myStop())) {
  const now = Date.now();
  roll(now);
  if (now - laneAt > 30000) {
    laneAt = now;
    try {
      const bag = await to(lrpc.getUtxosByAddresses({ addresses: [keyAddress(0)] }), 30000);
      const coins = (bag.entries || []).filter((e) => !e.isCoinbase && BigInt(e.amount) > 300_000_000n);
      const usable = Math.round(coins.reduce((s, e) => s + Number(e.amount) - 3e8, 0) / 1e8);
      if (coins.length < 2500 || usable < 18000) { phase(`PAY_STOP node=${NN} reason=lane`); fs.writeFileSync(payStop, "lane\n"); break; }
    } catch { phase(`PAY_LANE node=${NN} unread`); }
  }
  let total = 0;
  try { total = Number(fs.readFileSync(rateFile, "utf8").trim()) || 0; } catch {}
  share = Math.floor(total / OF) + (SLOT < total % OF ? 1 : 0);
  if (!share) { await sleep(500); continue; }
  const slice = pool.splice(0, share);
  if (!slice.length) { await load(); if (!pool.length) { phase(`PAY_STOP node=${NN} reason=pool`); break; } continue; }
  const t0 = Date.now();
  await Promise.all(slice.map(async (coin) => {
    attempts++;
    try {
      const draft = k.createTransaction([coin], [new k.PaymentOutput(new k.Address(addr), BigInt(coin.amount) - 1_000_000n)], 0n, undefined, 1);
      const fee = BigInt(massOf(draft)) * FEE_RATE;
      if (BigInt(coin.amount) <= fee + 1_000_000_000n) { other++; return; }
      const outAmt = BigInt(coin.amount) - fee;
      const tx = k.createTransaction([coin], [new k.PaymentOutput(new k.Address(addr), outAmt)], 0n, undefined, 1);
      const signed = k.signTransaction(tx, [pk], true);
      const res = await to(rpc.submitTransaction({ transaction: signed, allowOrphan: false }), 8000, "submit");
      ok++; used.set(op(coin), Date.now());
      const id = String(res?.transactionId || signed.id || "");
      if (chain && /^[0-9a-f]{64}$/.test(id)) pool.push({ address: coin.address, outpoint: { transactionId: id, index: 0 }, amount: outAmt, scriptPublicKey: coin.scriptPublicKey, blockDaaScore: coin.blockDaaScore, isCoinbase: false });
    } catch (e) {
      const why = reason(e);
      if (why === "mempool_full") { full++; pool.push(coin); return; }   // not spent: the coin goes back; a full mempool does not stop this sender
      if (why === "rpc") pool.push(coin);                                   // not known to be spent
      else used.set(op(coin), Date.now());
      if (why === "rpc") other++;
      else if ((why === "fee" || why === "mass") && !rateStopped) { rateRej++; rateStopped = true; phase(`PAY_STOP node=${NN} reason=rate`); fs.writeFileSync(myStop(), "rate\n"); }
      else { other++; if (++fails > 200 && chain && ok === 0) { chain = false; phase(`PAY_CHAIN node=${NN} off`); } }
      if (why === "rpc" && !recon) { recon = true; try { rpc = await connect(NODE, 2); } catch { phase(`NODE_DROP node=${NN}`); } finally { recon = false; } }
    }
  }));
  const wait = 1000 - (Date.now() - t0);
  if (wait > 0) await sleep(wait);
}
roll(Date.now() + 60000);
phase(`PAY_EXIT node=${NN}`);
try { await rpc.disconnect(); } catch {}
try { await lrpc.disconnect(); } catch {}
process.exit(0);
