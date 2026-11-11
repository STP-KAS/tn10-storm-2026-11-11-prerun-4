// Pre-run 4 desk runner. One process. TESTNET-10 ONLY. Never restarted mid-run (locks/LOCKED.md).
// Children (broker, coordinator, family sender, payment senders) start detached through WMI, outside this process tree and job,
// so they survive the parent. The runner tracks them by pid.
//   --mode open : gates, then publish logs/PRE-RUN-OPEN.md once. Exits. Not a send.
//   --mode run  : gates (PRE-RUN-OPEN and MINI-ARMED on origin), genesis from the published bundle, families on kit16 +
//                 the patched builder (100/200 per hop), payments HOLD-1..3, the HOLD-4 minute, RETURN, METHOD.md.
// A missing gate is HELD and an exit. It never waits on a gate. It never rebuilds the bundle or republishes SIXTEEN.md.
// Env: STORM_CONFIG (this run's config), STORM_KIT (kit16). Args: --repo <clone> --git <git.exe> --bundle <published bundle> --six <tools dir>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const MODE = arg("mode"), REPO = arg("repo"), GIT = arg("git"), BUNDLE = arg("bundle"), SIX = arg("six");
const KIT = process.env.STORM_KIT;
const U = (d, f) => "file:///" + path.join(d, f).replace(/\\/g, "/");
const { CFG, P, sleep, connect, to } = await import(U(KIT, "lib.mjs"));
const { verify, shaOfId } = await import(U(SIX, "sixteen-format.mjs"));
const { familyRate, cohortOfFamily } = await import(U(SIX, "family-fees.mjs"));
const { keyAddress } = await import(U(KIT, "covenant.mjs"));
const HERE = path.dirname(fileURLToPath(import.meta.url));
const NODE = process.execPath;
const isoZ = (ms = Date.now()) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
const mkey = (ms) => new Date(ms).toISOString().slice(0, 16);
const clean = (s) => String(s).replace(/wss?:\/\/\S+/g, "<url>").replace(/https?:\/\/\S+/g, "<url>").replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, "<ip>").replace(/[0-9a-f]{64}/gi, "<h>").replace(/C:\\Users\\[^\\]+/gi, "C:\\Users\\Fermi").slice(0, 400);
const LOG = P("logs", "runner.log");
const log = (s) => { const l = isoZ() + " " + clean(s); fs.appendFileSync(LOG, l + "\n"); console.log(l); };
const phase = (s) => { fs.appendFileSync(P("logs", "phase.log"), isoZ() + " " + s + "\n"); log("PHASE " + s); };
const HELD = (why, extra = "") => { log("HELD " + why + (extra ? " " + extra : "")); console.log(JSON.stringify({ held: why })); process.exit(3); };
if (!["open", "run"].includes(MODE) || !REPO || !GIT || !BUNDLE || !SIX || !KIT) { console.log("args: --mode open|run --repo --git --bundle --six"); process.exit(2); }

// ---- one runner ------------------------------------------------------------------------------------------------
const LOCK = P("private", "runner.lock");
if (fs.existsSync(LOCK)) {
  const old = Number(fs.readFileSync(LOCK, "utf8").trim()); let alive = false;
  try { process.kill(old, 0); alive = true; } catch (e) { alive = e?.code === "EPERM"; }
  if (alive) HELD("second-runner");
}
fs.writeFileSync(LOCK, String(process.pid));
process.on("exit", () => { try { if (fs.readFileSync(LOCK, "utf8").trim() === String(process.pid)) fs.unlinkSync(LOCK); } catch {} });

function otherRunners() {
  const r = spawnSync("pwsh", ["-NoProfile", "-NonInteractive", "-Command", "Get-CimInstance Win32_Process | Where-Object { $_.Name -in 'node.exe','pwsh.exe','powershell.exe','kcc20.exe' } | ForEach-Object { \"$($_.ProcessId)`t$($_.CommandLine)\" }"], { encoding: "utf8", timeout: 30000 });
  if (r.status !== 0) return ["unread"];
  const bad = [];
  for (const line of (r.stdout || "").split(/\r?\n/)) {
    const [pid, cmd = ""] = line.split("\t");
    if (!pid || Number(pid) === process.pid || Number(pid) === process.ppid) continue;
    if (/serve\.mjs|desk-runner\.mjs|Get-CimInstance/i.test(cmd)) continue;
    if (/prerun-1111|tuesday-1110|tn10-storm-2026-11-1[01](?!-prerun-2)|night\.ps1|sender\.mjs|coordinator\.mjs|builder-broker\.mjs|pay2?\.mjs|kcc20|mini-runner|gate\.mjs|arm-run/i.test(cmd)) bad.push(pid);
  }
  return bad;
}

// ---- git (full path, one commit per file, push retried once) --------------------------------------------------
const G = (a) => { const r = spawnSync(GIT, ["-C", REPO, ...a], { encoding: "utf8" }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };
function fetchO() { let f = G(["fetch", "origin", "main"]); if (f.code !== 0) f = G(["fetch", "origin", "main"]); return f.code === 0; }
const has = (rel) => G(["cat-file", "-e", `origin/main:${rel}`]).code === 0;
const show = (rel) => { let r = G(["show", `origin/main:${rel}`]); if (r.code !== 0 || !r.out.trim()) r = G(["show", `origin/main:${rel}`]); return r.code === 0 ? r.out : ""; };
function originMs(rel) { let r = G(["log", "-1", "--format=%cI", "origin/main", "--", rel]); if (!r.out.trim()) r = G(["log", "-1", "--format=%cI", "origin/main", "--", rel]); const ms = Date.parse(r.out.trim().split(/\r?\n/)[0]); return Number.isFinite(ms) ? ms : null; }
function publish(rel, body, msg) {
  if (!fetchO()) return { ok: false, why: "fetch" };
  if (has(rel)) return { ok: true, existed: true, ms: originMs(rel) };
  G(["checkout", "-q", "main"]);
  const ff = G(["merge", "--ff-only", "origin/main"]); if (ff.code !== 0) return { ok: false, why: "ff " + ff.out };
  const abs = path.join(REPO, rel); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, body);
  if (G(["add", "--", rel]).code !== 0) return { ok: false, why: "add" };
  const c = G(["commit", "-q", "-m", msg, "--", rel]); if (c.code !== 0) return { ok: false, why: "commit " + c.out };
  let p = G(["push", "origin", "HEAD:main"]);
  if (p.code !== 0) { const rb = G(["pull", "--rebase", "-q", "origin", "main"]); if (rb.code !== 0) { G(["rebase", "--abort"]); return { ok: false, why: "push " + p.out }; } p = G(["push", "origin", "HEAD:main"]); }
  if (p.code !== 0) return { ok: false, why: "push " + p.out };
  fetchO();
  return { ok: true, ms: originMs(rel) };
}

// ---- shared gates ----------------------------------------------------------------------------------------------
function sixteenGate() {
  if (!fetchO()) HELD("git-fetch");
  if (has("logs/FAILED.md")) HELD("failed-on-origin");
  const text = show("hashes/SIXTEEN.md");
  if (!text) HELD("no-sixteen-hash-path", "absent");
  const v = verify(text, { requireOrigin: true });
  if (!v.ok || v.fixture) HELD("no-sixteen-hash-path", "not-proof");
  const bundle = JSON.parse(fs.readFileSync(BUNDLE, "utf8"));
  if (!Array.isArray(bundle) || bundle.length !== 16) HELD("no-sixteen-hash-path", "bundle");
  const mism = bundle.filter((b) => v.rows.find((r) => r.family === b.family)?.sha !== shaOfId(b.g.covenantId)).length;
  if (mism) HELD("no-sixteen-hash-path", "bundle-not-the-published-one n=" + mism);
  return bundle;
}
function preflight() {
  const r = spawnSync(NODE, [path.join(HERE, "preflight.mjs"), "--bundle", BUNDLE, "--nodes", P("private", "candidates.json"), "--out", P("private", "nodes.json")], { encoding: "utf8", env: process.env, timeout: 240000 });
  const line = (r.stdout || "").trim().split(/\r?\n/).filter((l) => l.startsWith("{")).pop();
  let j = null; try { j = JSON.parse(line); } catch {}
  if (!j) HELD("desk-node-down", "preflight-unread");
  fs.writeFileSync(P("private", "preflight-last.json"), JSON.stringify(j));
  if (!(j.desk.testnet10 && j.desk.synced && j.desk.utxoindex && j.desk.daa_moving)) HELD("desk-node-down");
  if (!j.lane.above_abort) HELD("lane-held");
  if (j.bundle_coins.live !== 16) HELD("bundle-coin-gone", "n=" + j.bundle_coins.gone.length);
  log(`PREFLIGHT public checked=${j.public.length} pass=${j.public.filter((x) => x.pass).length} fail=${j.public.filter((x) => !x.pass).length} pass_nodes=${j.public.filter((x) => x.pass).map((x) => x.n).join(",")} pay_pile=${j.pay_pile}`);
  if (j.expected_first_miss_hold2) log(`PREFLIGHT kept ${j.kept} x 571 = ${j.kept * 571} under 1,824: HOLD-2 is the expected first miss. Offers left as they are.`);
  return j;
}

// =================================================================================================================
if (MODE === "open") {
  log("OPEN start pid=" + process.pid);
  const o = otherRunners(); if (o.length) HELD("other-runner", "n=" + o.length);
  sixteenGate();
  const pf = preflight();
  if (has("logs/PRE-RUN-OPEN.md")) { log("OPEN PRE-RUN-OPEN already on origin"); process.exit(0); }
  const z = isoZ();
  const r = publish("logs/PRE-RUN-OPEN.md", `PRE_RUN_OPEN ${z}\n`, "Open pre-run 4.");
  if (!r.ok) { log("GIT_FAIL " + r.why); process.exit(4); }
  log(`OPEN PRE-RUN-OPEN on origin at ${isoZ(r.ms)} (desk synced, ${pf.kept} public nodes kept, 16 bundle coins live)`);
  process.exit(0);
}

// =================================================================================================================
// MODE run
log("RUN start pid=" + process.pid);
const kids = new Map();   // name -> child
let stopping = false;
function startKid(name, args) {
  const q = (x) => `"${x}"`;
  const env = `set "STORM_CONFIG=${process.env.STORM_CONFIG}" && set "STORM_KIT=${KIT}" && set "STORM_BUILDER_DIRECT=" && `;
  const cmd = `cmd.exe /d /s /c "${env}${q(NODE)} ${args.map(q).join(" ")} >> ${q(P("out", name + ".out"))} 2>> ${q(P("out", name + ".err"))}"`;
  const ps = `$si = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ ShowWindow = [uint16]0 }; $r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $env:KID_CMD; CurrentDirectory = $env:KID_CWD; ProcessStartupInformation = $si }; "$($r.ReturnValue) $($r.ProcessId)"`;
  const r = spawnSync("pwsh", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", timeout: 60000, env: { ...process.env, KID_CMD: cmd, KID_CWD: KIT } });
  const [rv, pid] = (r.stdout || "").trim().split(/\s+/).map(Number);
  if (rv !== 0 || !pid) throw new Error("detached start failed for " + name + " rv=" + rv);
  kids.set(name, { pid, kill: () => spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { timeout: 20000 }) });
  log(`KID ${name} detached`);
}
setInterval(() => { for (const [name, c] of kids) { try { process.kill(c.pid, 0); } catch { kids.delete(name); if (!stopping) phase(`PROC_EXIT proc=${name.replace(/-[a-z0-9.]+$/i, "")} code=gone`); } } }, 5000);
async function stopAll(why) {
  stopping = true; phase("RUN_STOP reason=" + why);
  fs.writeFileSync(P("control", "STOP"), why + "\n"); fs.writeFileSync(P("control", "PAY-STOP"), why + "\n");
  const end = Date.now() + 30000; while (Date.now() < end && [...kids.keys()].some((k) => k !== "broker")) await sleep(1000);
  for (const [, c] of kids) { try { c.kill(); } catch {} }
  await sleep(2000);
  spawnSync("pwsh", ["-NoProfile", "-Command", `Get-Process kcc20 -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*prerun-4-sixteen*' -or $_.Path -like '*prerun-2-sixteen\builder*' } | Stop-Process -Force`], { timeout: 20000 });
}
async function fail(why) {
  log("FAILED " + why);
  await stopAll("failed");
  const r = publish("logs/FAILED.md", `FAILED ${isoZ()}\n\nThe pre-run 4 desk run stopped before RETURN: ${why}. The run is not resumed. A next attempt is a new repo.\n`, "Pre-run 4 failed before RETURN.");
  log(r.ok ? "FAILED.md on origin" : "GIT_FAIL " + r.why);
  process.exit(5);
}
process.on("uncaughtException", (e) => { fail("runner error " + clean(e?.message || e)).catch(() => process.exit(6)); });
process.on("unhandledRejection", (e) => { fail("runner error " + clean(e?.message || e)).catch(() => process.exit(6)); });

{ const o = otherRunners(); if (o.length) HELD("other-runner", "n=" + o.length); }
const bundle = sixteenGate();
if (!/PRE_RUN_OPEN/.test(show("logs/PRE-RUN-OPEN.md"))) HELD("no-open-file");
if (!/MINI_ARMED/.test(show("logs/MINI-ARMED.md"))) HELD("mini-armed-absent");
{
for (const f of fs.readdirSync(P("state"))) if (/^family-\d+\.json$/.test(f)) HELD("state-present", "a run already started here; not resumed");
for (const f of ["STOP", "PAY-STOP", "PAY-RATE"]) try { fs.unlinkSync(P("control", f)); } catch {}
preflight();
}
const kept = JSON.parse(fs.readFileSync(P("private", "nodes.json"), "utf8"));
if (!kept.length) HELD("no-public-node");
log("NODES frozen kept=" + kept.map((x) => x.n).join(","));
const famNode = kept.find((x) => x.n === 1) || kept[0];   // n=1 is boson in the local list
log("FAMILY_NODE local=" + famNode.n);

let liveFams;
// schedule for the family sender: f16, 1.2 hop/s, from now
const cfgPath = process.env.STORM_CONFIG;
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8").replace(/^\uFEFF/, ""));
cfg.schedule = [{ step: "f16", from: isoZ(Date.now() + 5000), to: cfg.end_utc, families: 16, rate: 1.2 }];
cfg.sec_from_utc = cfg.family_check_utc = isoZ();
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

// broker (one builder: the patched exe in the config)
startKid("broker", [path.join(KIT, "builder-broker.mjs")]);
await sleep(4000);
if (!/builder-broker on/.test(fs.readFileSync(P("out", "broker.out"), "utf8"))) await fail("builder broker did not start");

// genesis from the published bundle
phase("GENESIS_SUBMIT from=published-bundle");
const gs = spawnSync(NODE, [path.join(SIX, "submit-sixteen.mjs"), "--bundle", BUNDLE, "--repo", REPO, "--git", GIT], { cwd: KIT, encoding: "utf8", env: process.env, timeout: 30 * 60000 });
fs.appendFileSync(P("out", "submit-sixteen.out"), clean(gs.stdout || "") + "\n" + clean(gs.stderr || "") + "\n");
const gj = (() => { try { return JSON.parse((gs.stdout || "").trim().split(/\r?\n/).filter((l) => l.startsWith("{")).pop()); } catch { return null; } })();
if (!gj || gj.held) { log("HELD at genesis " + clean(JSON.stringify(gj))); await stopAll("genesis-held"); process.exit(3); }
liveFams = fs.readdirSync(P("state")).filter((f) => /^family-\d+\.json$/.test(f)).map((f) => Number(f.match(/\d+/)[0])).sort((a, b) => a - b);
log(`GENESIS submitted=${gj.submitted} live=${liveFams.length}`);
if (!liveFams.length) await fail("no genesis landed");

// families: coordinator + one family sender on the family node
startKid("coord", [path.join(KIT, "coordinator.mjs"), "--takeover"]);
await sleep(3000);
startKid("fam", [path.join(KIT, "sender.mjs"), "--label", "fam", "--source", "self", "--node", famNode.url, "--key", "0"]);
phase("FAMILIES_START families=" + liveFams.length + " offer=1.2 node=" + famNode.n);

// submit-row reader
const SUB = P("private", "submit-fam.jsonl");
let subOff = 0; const subRows = [];
function readSub() {
  if (!fs.existsSync(SUB)) return;
  const st = fs.statSync(SUB); if (st.size <= subOff) return;
  const fd = fs.openSync(SUB, "r"); const buf = Buffer.alloc(st.size - subOff); fs.readSync(fd, buf, 0, buf.length, subOff); fs.closeSync(fd);
  const text = buf.toString("utf8"); const cut = text.lastIndexOf("\n"); if (cut < 0) return; subOff += Buffer.byteLength(text.slice(0, cut + 1));
  for (const l of text.slice(0, cut).split("\n")) { try { const r = JSON.parse(l); subRows.push({ ts: Date.parse(r.ts), family: r.family, rate: r.rate, fee: r.fee, txid: r.txid, result: r.result, reason: r.reason }); } catch {} }
}
const HOPS = P("private", "hops.jsonl");
function landed() {   // txid -> accept ms
  const m = new Map(); if (!fs.existsSync(HOPS)) return m;
  for (const l of fs.readFileSync(HOPS, "utf8").split("\n")) { try { const r = JSON.parse(l); if (r.accept_header_utc) m.set(r.txid, { ms: Date.parse(r.accept_header_utc), family: r.family }); } catch {} }
  return m;
}

// fee split as built: every submit row carries its family's rate
{
  const end = Date.now() + 180000; let seen = false;
  while (Date.now() < end) { readSub(); if (subRows.some((r) => r.family <= 13 && r.result === "ok") && subRows.some((r) => r.family >= 14 && r.result === "ok")) { seen = true; break; } await sleep(3000); }
  const ph = fs.readFileSync(P("logs", "phase.log"), "utf8");
  if (!/FEE_SPLIT sender=fam floor=1-13:100 double=14-16:200/.test(ph)) await fail("family sender did not log the 100/200 fee split");
  const bad = subRows.filter((r) => r.result === "ok" && r.rate !== familyRate(r.family));
  if (bad.length) await fail("a hop went out at a rate other than its family's");
  if (!seen) log("FEE_SPLIT both cohorts not yet ok within 3 min; continuing, minutes will show it");
  else log("FEE_SPLIT verified on submit rows: floor 100, double 200");
}
// every family attempting
{
  const end = Date.now() + 180000;
  while (Date.now() < end) { readSub(); const f = new Set(subRows.map((r) => r.family)); if (liveFams.every((n) => f.has(n))) break; await sleep(5000); }
  const f = new Set(subRows.map((r) => r.family)); log("FAMILIES attempting=" + liveFams.filter((n) => f.has(n)).length + "/" + liveFams.length);
}

// node marks, sampled each minute: desk + kept public nodes
const rpcs = new Map();
async function rpcOf(url) { if (!rpcs.has(url)) rpcs.set(url, await connect(url, 3)); return rpcs.get(url); }
const marks = {};   // minute -> { n -> {synced, daa, ms} }
async function sampleNodes() {
  const key = mkey(Date.now()); const row = (marks[key] ||= {});
  const all = [{ n: 0, url: CFG.main_node_url }, ...kept];
  await Promise.all(all.map(async (x) => {
    const t0 = Date.now();
    try { const c = await rpcOf(x.url); const si = await to(c.getServerInfo(), 8000); const d = await to(c.getBlockDagInfo(), 8000); (row[x.n] ||= []).push({ synced: si.isSynced ? 1 : 0, daa: Number(d.virtualDaaScore), ms: Date.now() - t0 }); }
    catch { rpcs.delete(x.url); (row[x.n] ||= []).push({ synced: 0, daa: 0, ms: Date.now() - t0, fail: 1 }); }
  }));
}
setInterval(() => { sampleNodes().catch(() => {}); }, 20000); await sampleNodes();
setInterval(async () => {
  try {
    const c = await rpcOf(CFG.main_node_url);
    const bag = await to(c.getUtxosByAddresses({ addresses: [keyAddress(0)] }), 60000);
    const coins = (bag.entries || []).filter((e) => !e.isCoinbase && BigInt(e.amount) > 300_000_000n);
    const usable = Math.round(coins.reduce((a, e) => a + Number(e.amount) - 3e8, 0) / 1e8);
    if (!stopping && (coins.length < 2500 || usable < 18000)) { phase("LANE_HELD"); await fail("the family lane reached the abort line"); }
  } catch { log("LANE unread"); }
}, 60000);
// FAILED on origin stops the run
setInterval(() => { try { if (fetchO() && has("logs/FAILED.md")) { stopAll("failed-on-origin").then(() => process.exit(0)); } } catch {} }, 60000);

// payments
const N = kept.length;
function startPay() { for (let i = 0; i < N; i++) if (!kids.has("pay-" + kept[i].n)) startKid("pay-" + kept[i].n, [path.join(HERE, "pay2.mjs"), "--slot", String(i), "--of", String(N)]); }
const setRate = (r) => { fs.writeFileSync(P("control", "PAY-RATE"), String(r) + "\n"); phase("PAY_RATE total=" + r + " senders=" + N); };

function payRows(minute) {
  const out = [];
  for (const x of kept) {
    const f = P("logs", `pay-minute-${x.n}.log`); if (!fs.existsSync(f)) continue;
    for (const l of fs.readFileSync(f, "utf8").split(/\r?\n/)) if (l.startsWith(minute + "Z ")) { const o = { n: x.n }; for (const kv of l.split(" ").slice(1)) { const [a, b] = kv.split("="); o[a] = Number(b); } out.push(o); }
  }
  return out;
}
// GO-DESK clean minute: no sender-off, pool-low, node-drop, or proc-exit, every family still attempting. A STALL is logged per minute, not a dirt.
const DIRTY = /SENDER_OFF|POOL_LOW|NODE_DROP|PROC_EXIT|PAY_STOP|PAY_EXIT|FAMILY_DROP/;
const phaseLines = (minute) => fs.readFileSync(P("logs", "phase.log"), "utf8").split(/\r?\n/).filter((l) => l.startsWith(minute));
function phaseIn(minute) { return phaseLines(minute).filter((l) => DIRTY.test(l)).map((l) => l.slice(21).split(" ")[0]).filter(Boolean); }
const results = [];   // per minute evaluated, all steps
function evalMinute(step, target, minute) {
  readSub();
  const t0 = Date.parse(minute + ":00Z"), t1 = t0 + 60000;
  const pr = payRows(minute);
  const ok = pr.reduce((s, r) => s + (r.ok || 0), 0), att = pr.reduce((s, r) => s + (r.attempts || 0), 0);
  const rrate = pr.reduce((s, r) => s + (r.rate || 0), 0), rfull = pr.reduce((s, r) => s + (r.full || 0), 0), roth = pr.reduce((s, r) => s + (r.other || 0), 0);
  const L = landed();
  const coh = {};
  for (const c of ["floor", "double"]) {
    const rows = subRows.filter((r) => r.ts >= t0 && r.ts < t1 && cohortOfFamily(r.family) === c);
    const okRows = subRows.filter((r) => r.ts < t1 && r.result === "ok" && cohortOfFamily(r.family) === c);
    coh[c] = { ok: rows.filter((r) => r.result === "ok").length, attempts: rows.length, rej_rate: rows.filter((r) => r.result !== "ok" && (r.reason === "fee" || r.reason === "mass")).length, rej_full: rows.filter((r) => r.result !== "ok" && r.reason === "mempool_full").length, waiting: okRows.filter((r) => !(L.get(r.txid)?.ms < t1)).length, rate: [...new Set(rows.map((r) => r.rate))].join("/") };
  }
  const famAtt = new Set(subRows.filter((r) => r.ts >= t0 && r.ts < t1).map((r) => r.family));
  const why = [];
  if (Math.abs(ok - target * 60) > target * 6) why.push("ok-off");
  if (pr.length < N) why.push("proc-row-missing");
  const m = marks[minute] || {};
  for (const x of kept) { const s = m[x.n] || []; if (!s.length || s.some((q) => !q.synced)) why.push("node-" + x.n + "-unsynced"); else if (s.length > 1 && s[s.length - 1].daa <= s[0].daa) why.push("node-" + x.n + "-daa-still"); }
  for (const p of new Set(phaseIn(minute))) why.push(p.toLowerCase());
  const missing = liveFams.filter((n) => !famAtt.has(n)); if (missing.length) why.push("families-not-attempting=" + missing.length);
  const stalls = phaseLines(minute).filter((l) => /STALL family/.test(l)).length;
  const r = { step, minute, ok, att, rrate, rfull, roth, coh, stalls, clean: why.length ? 0 : 1, why: why.join(";") || "-", pr };
  results.push(r); log(`MINUTE ${step} ${minute} ok=${ok} att=${att} clean=${r.clean} ${r.why}`);
  return r;
}
async function waitMinuteClosed(minute) { const t = Date.parse(minute + ":00Z") + 60000 + 12000; while (Date.now() < t) await sleep(1000); }
const fixes = [];
async function scored(step, target) {
  setRate(target); startPay();
  let first = Math.ceil((Date.now() + 30000) / 60000) * 60000;   // skip the ramp minute
  let cleanN = 0, n = 0, repaired = false;
  const mins = [], all = [];
  for (let t = first; ; t += 60000) {
    const minute = mkey(t); await waitMinuteClosed(minute);
    const r = evalMinute(step, target, minute); mins.push(r); all.push(r); n++; cleanN += r.clean;
    if (cleanN >= 3) return { head: "MET", mins: all, repaired };
    if (n >= 6 && !repaired) {
      repaired = true; const z = isoZ();
      const dirt = [...new Set(mins.flatMap((x) => x.why.split(";")))].filter((w) => w !== "-").join(", ");
      for (const x of kept) try { fs.unlinkSync(P("control", `PAY-STOP-${x.n}`)); } catch {}
      for (const [name, c] of kids) if (name.startsWith("pay-")) { try { c.kill(); } catch {} }
      await sleep(3000); startPay();
      fixes.push({ z, step, what: dirt || "minutes not clean", change: "restarted the payment senders (one try for this reason)", why: "fewer than three clean minutes in six" });
      const fx = "# Fixes\n\n" + fixes.map((f) => `- ${f.z} ${f.step}: failed: ${f.what}. Changed: ${f.change}. Why: ${f.why}.`).join("\n") + "\n";
      const pr = publishOver("logs/FIXES.md", fx, `Log the ${step} repair.`); log(pr.ok ? "FIXES on origin" : "GIT_FAIL " + pr.why);
      first = t + 60000; n = 0; cleanN = 0; mins.length = 0; t = Math.ceil((Date.now() + 30000) / 60000) * 60000 - 60000; continue;
    }
    if (n >= 6 && repaired) return { head: "NOT MET", mins: all, repaired };
  }
}
function publishOver(rel, body, msg) {   // FIXES.md grows; one commit per update
  if (!fetchO()) return { ok: false, why: "fetch" };
  G(["checkout", "-q", "main"]); const ff = G(["merge", "--ff-only", "origin/main"]); if (ff.code !== 0) return { ok: false, why: "ff" };
  fs.mkdirSync(path.join(REPO, path.dirname(rel)), { recursive: true }); fs.writeFileSync(path.join(REPO, rel), body);
  G(["add", "--", rel]); const c = G(["commit", "-q", "-m", msg, "--", rel]); if (c.code !== 0) return { ok: false, why: "commit" };
  let p = G(["push", "origin", "HEAD:main"]); if (p.code !== 0) { G(["pull", "--rebase", "-q", "origin", "main"]); p = G(["push", "origin", "HEAD:main"]); }
  return p.code === 0 ? { ok: true } : { ok: false, why: "push " + p.out };
}

// lane coin sizes, read from the node at file time
async function coinSizes() {
  try {
    const c = await rpcOf(CFG.main_node_url);
    const bag = await to(c.getUtxosByAddresses({ addresses: [keyAddress(0)] }), 60000);
    const m = new Map();
    for (const e of bag.entries || []) { if (e.isCoinbase || BigInt(e.amount) <= 300_000_000n) continue; const t = Math.round(Number(e.amount) / 1e8); m.set(t, (m.get(t) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  } catch { return null; }
}
const fmt = (n) => Number(n).toLocaleString("en-US");
const med = (a) => { if (!a.length) return "-"; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const p95 = (a) => { if (!a.length) return "-"; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]; };
async function renderDesk(step, target, head, mins, extra = []) {
  readSub(); const L = landed(); const sizes = await coinSizes();
  const t0 = Math.min(...mins.map((r) => Date.parse(r.minute + ":00Z"))), t1 = Math.max(...mins.map((r) => Date.parse(r.minute + ":00Z"))) + 60000;
  const rates = { floor: new Set(), double: new Set() };
  for (const r of subRows) if (r.ts >= t0 && r.ts < t1) rates[cohortOfFamily(r.family)].add(r.rate);
  const lines = [head, "", `# ${step}, desk sender log, pre-run 4`, "", "> Counts only. The desk's sender log. It is not a chain count. Mini counts the chain.", ""];
  for (const e of extra) lines.push(e);
  if (extra.length) lines.push("");
  lines.push(`Payment offer ${fmt(target)} tx/s at 150 sompi/gram, from ${N} payment senders, one per kept public node. Families offer 1.2 hop/s, ${liveFams.length} families live, one family-sender process and one builder.`, "");
  lines.push("## Hop rate per cohort, as built", "", `Floor (families 1–13): ${[...rates.floor].join("/") || "no rows"} sompi/gram per hop. Double (families 14–16): ${[...rates.double].join("/") || "no rows"} sompi/gram per hop. The rate rides on each hop line to the one builder.`, "");
  if (rates.floor.size === 1 && rates.double.size === 1 && [...rates.floor][0] === [...rates.double][0]) lines.push("Both cohorts went out at one rate in these minutes. The fee is not called the cause.", "");
  lines.push("## Funding coins, as read from the desk node", "");
  if (!sizes) lines.push("The coin sizes were not read. No size is given.", "");
  else if (sizes.length === 1) lines.push(`The funding coins were one size: ${fmt(sizes[0][0])} tKAS (${fmt(sizes[0][1])} coins).`, "");
  else lines.push(`The funding coins were not one size. Sizes seen, whole tKAS (coins): ${sizes.slice(0, 12).map(([t, c]) => `${fmt(t)} (${fmt(c)})`).join(", ")}${sizes.length > 12 ? `, and ${sizes.length - 12} more sizes` : ""}. The fee is not called the whole cause.`, "");
  lines.push("## Minutes", "", "| Minute (UTC) | Pay submit-OK | Attempts | Rejects, rate | Rejects, full | Other | Floor OK / att / rate rej / full rej / waiting | Double OK / att / rate rej / full rej / waiting | Family stalls logged | Clean |", "|---|---:|---:|---:|---:|---:|---|---|---:|---|");
  for (const r of mins) lines.push(`| ${r.minute} | ${fmt(r.ok)} | ${fmt(r.att)} | ${r.rrate} | ${r.rfull} | ${r.roth} | ${r.coh.floor.ok} / ${r.coh.floor.attempts} / ${r.coh.floor.rej_rate} / ${r.coh.floor.rej_full} / ${r.coh.floor.waiting} | ${r.coh.double.ok} / ${r.coh.double.attempts} / ${r.coh.double.rej_rate} / ${r.coh.double.rej_full} / ${r.coh.double.waiting} | ${r.stalls ?? 0} | ${r.clean ? "yes" : "no: " + r.why} |`);
  lines.push("", "A family stall is a coordinator mark: no hop of that family landed for a while. The family was still attempting. It is logged, and it does not make the minute dirty.");
  lines.push("", `Within 10 percent means ${fmt(Math.round(target * 60 * 0.9))} to ${fmt(Math.round(target * 60 * 1.1))} submit-OK in the minute.`, "");
  lines.push("## Public nodes (local numbers)", "", `Kept: ${kept.map((x) => x.n).join(", ")}. The family sender is on node ${famNode.n}. Both cohorts share that node.`, "", "| Node | Synced every sample | Last DAA | Pay submit-OK | Pay rejects | Dropped sockets | Answer ms, median |", "|---:|---|---:|---:|---:|---:|---:|");
  const ph = fs.readFileSync(P("logs", "phase.log"), "utf8").split(/\r?\n/);
  for (const x of kept) {
    const s = mins.flatMap((r) => (marks[r.minute] || {})[x.n] || []);
    const pr = mins.flatMap((r) => r.pr.filter((q) => q.n === x.n));
    const drops = ph.filter((l) => { const ms = Date.parse(l.slice(0, 20)); return ms >= t0 && ms < t1 && new RegExp(`NODE_DROP node=${x.n}\\b`).test(l); }).length;
    lines.push(`| ${x.n} | ${s.length && s.every((q) => q.synced) ? "yes" : "no"} | ${s.length ? s[s.length - 1].daa : "-"} | ${fmt(pr.reduce((a, q) => a + (q.ok || 0), 0))} | ${pr.reduce((a, q) => a + (q.rate || 0) + (q.full || 0) + (q.other || 0), 0)} | ${drops} | ${med(s.map((q) => q.ms))} |`);
  }
  lines.push("", "## Hop submit to landing, per cohort", "", "| Cohort | Landed of OK | Median ms | Slow tail (p95) ms |", "|---|---:|---:|---:|");
  for (const c of ["floor", "double"]) {
    const ok = subRows.filter((r) => r.ts >= t0 && r.ts < t1 && r.result === "ok" && cohortOfFamily(r.family) === c);
    const dd = ok.filter((r) => L.get(r.txid)).map((r) => L.get(r.txid).ms - r.ts);
    lines.push(`| ${c} | ${dd.length} of ${ok.length} | ${med(dd)} | ${p95(dd)} |`);
  }
  lines.push("", "Landing is the accepting block header time the desk's coordinator read. Waiting is submitted-OK not yet landed at the minute's end.", "");
  return lines.join("\n");
}
const onOrigin = {};
async function closeStep(step, target, head, mins, extra) {
  const body = await renderDesk(step, target, head, mins, extra);
  const r = publish(`counts/desk/${step}.md`, body, `Desk ${step}: ${head}.`);
  if (!r.ok) { log("GIT_FAIL " + r.why); await fail(`could not push counts/desk/${step}.md`); }
  onOrigin[step] = r.ms; log(`PUBLISHED counts/desk/${step}.md ${head} on origin ${isoZ(r.ms)}`);
  return r.ms;
}

const summary = {};
const FROM = "HOLD-1";
const STEPS = [["HOLD-1", 1013], ["HOLD-2", 2027], ["HOLD-3", 3040]];
for (const [step] of STEPS.slice(0, Math.max(0, STEPS.findIndex(([x]) => x === FROM)))) {
  fetchO(); const t = show(`counts/desk/${step}.md`); if (!t) HELD("resume-step-missing", step);
  summary[step] = { head: /^NOT MET/.test(t.trim()) ? "NOT MET" : "MET", mins: [] }; onOrigin[step] = originMs(`counts/desk/${step}.md`);
  log(`RESUME ${step} already on origin: ${summary[step].head}`);
}
for (const [step, target] of STEPS.filter(([x]) => !summary[x])) {
  phase(`STEP ${step} offer=${target}`);
  const s = await scored(step, target);
  summary[step] = s; await closeStep(step, target, s.head, s.mins);
}
// HOLD-4: the pinned minute
const h3 = onOrigin["HOLD-3"]; const pin = Math.ceil((h3 + 180000) / 60000) * 60000; const pinKey = mkey(pin);
log("HOLD4 pinned minute " + pinKey + "Z");
while (Date.now() < pin - 45000) await sleep(1000);
setRate(4053); startPay(); phase("STEP HOLD-4 offer=4053");
await waitMinuteClosed(pinKey);
const h4 = evalMinute("HOLD-4", 4053, pinKey);
const synced4 = kept.every((x) => ((marks[pinKey] || {})[x.n] || []).every((q) => q.synced) && ((marks[pinKey] || {})[x.n] || []).length);
await closeStep("HOLD-4", 4053, "OBSERVATION", [h4], [`The pinned minute is the first whole UTC minute whose start is at least 3 minutes after HOLD-3's On origin time. The rate in that minute is the reading.`].concat(synced4 ? [] : ["The path was not synced in this minute."]));
summary["HOLD-4"] = { head: "OBSERVATION", mins: [h4] };
// RETURN
phase("STEP RETURN offer=1013");
const ret = await scored("RETURN", 1013); summary.RETURN = ret;
await closeStep("RETURN", 1013, ret.head, ret.mins);
await stopAll("return-closed");

// METHOD.md
{
  readSub(); const L = landed();
  const landedBy = { floor: 0, double: 0 }; for (const [, v] of L) landedBy[cohortOfFamily(v.family)]++;
  const decent = summary["HOLD-1"].head === "MET";
  const sizes = await coinSizes();
  const m = ["# Method, pre-run 4", "", "> Counts only. Desk side. Mini's files are the chain count.", "",
    `Accepted hops per cohort, as the desk's coordinator read them: floor (families 1–13) ${fmt(landedBy.floor)}, double (families 14–16) ${fmt(landedBy.double)}.`, "",
    "Payment submit-OK per target (desk sender log; Mini's files carry what the chain accepted):", "",
    ...["HOLD-1", "HOLD-2", "HOLD-3", "HOLD-4", "RETURN"].map((s) => `- ${s}: ${summary[s].head}, ${summary[s].mins.map((r) => fmt(r.ok)).join(" / ")} submit-OK per minute read.`), "",
    decent ? "Decent on the desk side: HOLD-1 met. The HOLD-4 bot file and Mini's matching mark decide the rest of decent." : "Short of decent: HOLD-1 was not met.", "",
    "Hop rates were 100 sompi/gram for families 1–13 and 200 for families 14–16, per hop, in one builder. " + (sizes && sizes.length > 1 ? "The funding coins were not one size, so the fee is not called the whole cause." : "") + ` Both cohorts shared one node set (family node ${famNode.n}).`, "",
    "## Misses", "", ...Object.entries(summary).filter(([, s]) => s.head === "NOT MET").map(([k]) => `- ${k} NOT MET.`), Object.values(summary).some((s) => s.head === "NOT MET") ? "" : "- none", "",
    "## Fixes", "", ...(fixes.length ? fixes.map((f) => `- ${f.z} ${f.step}: ${f.change}.`) : ["- none"]), "",
    "## On origin", "", ...Object.entries(onOrigin).map(([k, v]) => `- counts/desk/${k}.md: ${isoZ(v)}`), ""];
  const r = publish("logs/METHOD.md", m.join("\n"), "Pre-run 4 method.");
  log(r.ok ? "PUBLISHED logs/METHOD.md" : "GIT_FAIL " + r.why);
}
log("RUN end");
process.exit(0);
