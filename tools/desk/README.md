> **Experimental. We are just trying this.** [Disclaimer](../../DISCLAIMER.md) · Kaspa Testnet-10 only. No key, id, address, host, or port in these files.

# Desk runner, pre-run 4

- `preflight.mjs`: read-only. Desk node synced, UTXO index, DAA moving; family lane against the abort line; payment pile count; every bundle funding coin live; each public node checked (version, synced, DAA gap, UTXO index, answer time). Writes the kept list to the private run folder. Prints counts only.
- `desk-runner.mjs --mode open`: gates, then `logs/PRE-RUN-OPEN.md` once. Not a send.
- `desk-runner.mjs --mode run`: gates (`PRE-RUN-OPEN` and `MINI-ARMED` on origin), the sixteen genesis transactions from the published bundle (`tools/sixteen/submit-sixteen.mjs`), the families on kit16 and the patched builder (100/200 per hop), then the payment offers, the HOLD-4 minute, RETURN, and `logs/METHOD.md`. A missing gate is `HELD` and an exit, never a wait.
- `pay2.mjs`: one payment sender per kept public node, fee 150, the offer split evenly, change re-used at once.

The runner starts its children detached (WMI), outside its own process tree, so they survive the parent. It is never restarted mid-run. A family STALL is logged per minute and is not dirt.
