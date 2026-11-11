// preflight.mjs: pre-run 4 desk preflight. Read-only. Never prints an id, key, address, host, port, or balance detail.
//   STORM_CONFIG=<run config> STORM_KIT=<kit16> node preflight.mjs --bundle <published bundle> --nodes <candidates.json> --out <private nodes.json>
// Checks: desk node testnet-10, synced, DAA moving; the family lane (key 0) above 2,500 coins and 18,000 usable tKAS;
// the payment pile (key 16) count; every bundle funding coin still unspent; each candidate public node: version,
// synced, DAA within a few blocks of the desk, UTXO index, answer time. Kept nodes go to --out by local number.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const kit = (f) => pathToFileURL(path.join(process.env.STORM_KIT, f)).href;
const { CFG, to, connect, sleep } = await import(kit("lib.mjs"));
const { keyAddress } = await import(kit("covenant.mjs"));
const say = (o) => console.log(JSON.stringify(o));
const norm = (s) => String(s).replace(/^0x/i, "").toLowerCase();
const out = { ok: 0 };
const rpc = await connect(CFG.main_node_url, 3);
const si = await to(rpc.getServerInfo(), 8000);
const d1 = BigInt((await to(rpc.getBlockDagInfo(), 8000)).virtualDaaScore);
await sleep(3000);
const d2 = BigInt((await to(rpc.getBlockDagInfo(), 8000)).virtualDaaScore);
out.desk = { testnet10: si.networkId === "testnet-10" ? 1 : 0, synced: si.isSynced ? 1 : 0, utxoindex: si.hasUtxoIndex ? 1 : 0, daa_moving: d2 > d1 ? 1 : 0, version: si.serverVersion };
const lane = (await to(rpc.getUtxosByAddresses({ addresses: [keyAddress(0)] }), 90000)).entries || [];
const laneCoins = lane.filter((e) => !e.isCoinbase && BigInt(e.amount) > 300_000_000n);
out.lane = { coins: laneCoins.length, usable_tkas: Math.round(laneCoins.reduce((s, e) => s + Number(e.amount) - 3e8, 0) / 1e8) };
out.lane.above_abort = out.lane.coins >= 2500 && out.lane.usable_tkas >= 18000 ? 1 : 0;
const pile = (await to(rpc.getUtxosByAddresses({ addresses: [keyAddress(16)] }), 90000)).entries || [];
out.pay_pile = pile.filter((e) => !e.isCoinbase && BigInt(e.amount) > 1_000_000_000n && BigInt(e.amount) < 10_000_000_000_000n).length;
if (arg("bundle")) {
  const bundle = JSON.parse(fs.readFileSync(arg("bundle"), "utf8"));
  let live = 0; const gone = [];
  for (const row of bundle) {
    const op = row.g.tx.inputs[0].previousOutpoint;
    const bag = row.key === 0 ? lane : ((await to(rpc.getUtxosByAddresses({ addresses: [keyAddress(Number(row.key))] }), 30000)).entries || []);
    if (bag.some((e) => norm(e.outpoint.transactionId) === norm(op.transactionId) && Number(e.outpoint.index) === Number(op.index))) live++; else gone.push(row.family);
  }
  out.bundle_coins = { live, gone };
}
if (arg("nodes")) {
  const cands = JSON.parse(fs.readFileSync(arg("nodes"), "utf8"));
  const kept = [];
  out.public = [];
  for (let i = 0; i < cands.length; i++) {
    const r = { n: i + 1 };
    try {
      const t0 = Date.now();
      const c = await connect(cands[i], 1);
      const s = await to(c.getServerInfo(), 6000);
      const dag = await to(c.getBlockDagInfo(), 6000);
      r.ms = Date.now() - t0; r.synced = s.isSynced ? 1 : 0; r.utxoindex = s.hasUtxoIndex ? 1 : 0; r.version = s.serverVersion;
      const dk = Number((await to(rpc.getBlockDagInfo(), 6000)).virtualDaaScore);   // desk DAA read right after, so elapsed time is not a gap
      r.daa_gap = Math.abs(Number(dag.virtualDaaScore) - dk);
      r.pass = r.synced && r.utxoindex && r.daa_gap <= 100 && r.ms < 8000 && s.networkId === "testnet-10" ? 1 : 0;
      try { await c.disconnect(); } catch {}
    } catch { r.pass = 0; r.why = "no_answer"; }
    out.public.push(r);
    if (r.pass) kept.push({ n: r.n, url: cands[i] });
  }
  out.kept = kept.length;
  out.expected_first_miss_hold2 = kept.length * 571 < 1824 ? 1 : 0;
  if (arg("out")) fs.writeFileSync(arg("out"), JSON.stringify(kept));
}
try { await rpc.disconnect(); } catch {}
out.ok = out.desk.testnet10 && out.desk.synced && out.desk.daa_moving && out.lane.above_abort && (!out.bundle_coins || out.bundle_coins.live === 16) ? 1 : 0;
say(out);
process.exit(out.ok ? 0 : 3);
