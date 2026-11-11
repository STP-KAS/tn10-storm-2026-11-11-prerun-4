> **Experimental. We are just trying this.** [Disclaimer](DISCLAIMER.md) · Kaspa Testnet-10 only; tKAS has no value.
>
> **This is a pre-run. Pre-run 4.** It is not the Wednesday run. It is not the Tuesday run. It is not pre-run 1, 2, or 3. A read does not start a runner.

# tn10-storm-2026-11-11-prerun-4

**Pre-run 4 of the Wednesday neuron.** The neuron stays [tn10-storm-2026-11-11](https://github.com/STP-KAS/tn10-storm-2026-11-11). This repo does not edit that repo, does not write `REVIEW_CLOSED`, and does not set or move a clock for it.

**Tuesday stays Tuesday.** [tn10-storm-2026-11-10](https://github.com/STP-KAS/tn10-storm-2026-11-10) is not edited from here. This pre-run does not send while a Tuesday or Wednesday runner is up.

**Pre-runs 1, 2, and 3 failed and are closed.** Pre-run 1 is [tn10-storm-2026-11-11-prerun](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun). Pre-run 2 is [tn10-storm-2026-11-11-prerun-2](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-2): HOLD-1 was met, then the runner was stopped mid-HOLD-2 to apply a scoring fix and its children died with it. Pre-run 3 is [tn10-storm-2026-11-11-prerun-3](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-3): its runner stopped on the first scored minute with a scoping error (`readSub is not defined`). Their open, armed, halt, and failed files are history. They are not gates for this repo. This repo starts from pre-run 3's [locks/LOCKED.md](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-3/blob/main/locks/LOCKED.md), copied here as [locks/LOCKED.md](locks/LOCKED.md).

**What pre-run 4 changes.** Fresh hashes, because pre-run 3's genesis coins are spent. The desk runner's scoring helpers are in scope (no-undef lint clean), and the runner passed an offline rehearsal on the desk through HOLD-1 scoring and a count-file render before this live run. A full mempool no longer drains a payment sender's coin pool. The locked lines stay: no runner restart mid-run, children started detached, a family stall is logged and is not dirt. The offers, fees, abort line, and node lines are unchanged.

## What this measures

This rehearsal looks at how covenants behave under congestion, and with other senders on the same Testnet-10 network. Some covenants use a basic transaction fee, and some use a priority fee. In part of the load, payment senders also pay an increased fee. Load is added in thirds: one-third, two-thirds, three-thirds, and a four-thirds observation minute if that last step can be held.

The figures in these repos are rehearsal submit counts from our desk sender log, and Mini's counter. They are not a measure of network inclusion, and they are not a number for Pulse. For a signed one-input, one-output payment, the inclusion ceiling noted in [tn-master](https://github.com/STP-KAS/tn-master) and [what-limits-tx-rate](https://github.com/STP-KAS/what-limits-tx-rate) is about 3,040–3,080 tx/s. HOLD-3, at 3,040, sits on that line. HOLD-4, at 4,053, sits above it for this payment shape. Earlier storms in those notes held higher submit rates with more senders. A count here is what the log said. It is not a broader claim.

## Why it is written down

The fee steps and the load steps are there so we can see what happens at each rate, including what breaks. The lock files keep those findings so a later pre-run can start from them. This is a testnet rehearsal. It is not a request to Kaspa core developers.

## Pre-runs in this rehearsal

The rehearsal's top-level what and why is in the [pre-run 2 README](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-2#what-this-measures). Each pre-run is its own repo. The lines below are taken from the count, method, failed, and lock files on origin in those repos. Pre-run 7 is in progress; this table does not describe a result for it.

| Pre-run | Repo | Status | One-line lesson |
|---|---|---|---|
| 1 | [tn10-storm-2026-11-11-prerun](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun) | Failed and closed | The desk and Mini reset; nothing was armed for send after that. |
| 2 | [tn10-storm-2026-11-11-prerun-2](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-2) | HOLD-1 MET (59,767 × 3), then failed | The runner was stopped mid-HOLD-2 to apply a scoring fix; its children died with it. |
| 3 | [tn10-storm-2026-11-11-prerun-3](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-3) | Failed | The desk runner stopped on a code bug (`readSub is not defined`). |
| 4 | [tn10-storm-2026-11-11-prerun-4](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-4) | HOLD-1 and HOLD-2 MET, then failed | The HOLD-3 repair started no senders. The operator published the failed file after git fetch errors. |
| 5 | [tn10-storm-2026-11-11-prerun-5](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-5) | HOLD-1 and HOLD-2 MET; HOLD-3 and RETURN not met | HOLD-3 sat at about 118,000 submit-OK a minute, the 2,000-coin pile cap. Restarted senders reloaded spent coins. The bot wrote a legal `NO SEND` (no free node). |
| 6 | [tn10-storm-2026-11-11-prerun-6](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-6) | HOLD-1 and HOLD-2 MET; HOLD-3 and RETURN not met | The 6,000-coin pile and the fair repair handoff worked (3,002 / 2,998 and 3,000 / 3,000). HOLD-3 sat at 132,439–144,595 a minute; with the larger pile, the likely limit was submit latency on the two public kaspads. The family sender latched off when its node read a mempool of 90,000 or more, so the families stopped and RETURN read not met even though the payments were on target. The bot wrote a legal `NO SEND` (no free node). |
| 7 | — | In progress | No result is written here. |

## Sum-up

This pre-run is target-oriented. There is no T0, no public clock, no hash clock, and no latest minute. Nodes live, hashes first, then the families, then the senders step by step. The offers are the same offers. The machines are the same machines. The result here is a rehearsal reading. It is not Wednesday's count and it is not a number for Pulse.

| Machine | Paste | First sentence |
|---|---|---|
| Desk | [GO-DESK.md](GO-DESK.md) | DESK. I send on pre-run 4. I do not count. This is not Wednesday. |
| Mini | [GO-MINI.md](GO-MINI.md) | MINI. I count pre-run 4. I do not send. This is not Wednesday. |
| Bot | [GO-BOT.md](GO-BOT.md) | GROKBOT. I send payments on the pre-run 4 HOLD-4 only. I do not count. This is not Wednesday. |

[GO.md](GO.md) is the map. It does not start a machine. For pre-run 4 the operator does not paste. On 2026-11-11 he said to start everything, with no pastes, and to execute until successful. That instruction is the arm. The agents on the desk, Mini, and the bot start their own runners once the gates are facts. A sentence in chat still does not write `PRE-RUN-OPEN`: the desk runner writes it after its gates.

Roles and start gates are in [PLAYBOOK.md](PLAYBOOK.md). A read of that page does not arm a machine.

## Start gates, in order

Nothing below is a time. Each gate is a fact read from a node or from origin.

| Order | Gate | Who |
|---:|---|---|
| 1 | Mini's existing TN10 node is up from its own data, no wipe, `isSynced` true, DAA moving. Mini has notified Build and TN10 ops. | Mini |
| 2 | The desk's existing private TN10 node is up from its own data, started with PowerShell 7, no wipe, synced, DAA moving. | Desk |
| 3 | No Tuesday, Wednesday, pre-run 1, 2, or 3 runner or waiter is in a process list. The lane is above the abort line. | Desk, bot |
| 4 | Hashes first. The desk pushes `hashes/SIXTEEN.md` with [tools/sixteen](tools/sixteen/README.md): sixteen rows and an On origin line. A sixteen-family path, not the old 8- or 32-family publisher. This file is not an arm and not a send, and it does not wait for the paste. | Desk |
| 5 | The operator's arm: his instruction to start everything. No paste. | Operator |
| 6 | The desk pushes `logs/PRE-RUN-OPEN.md` in this repo. | Desk |
| 7 | Mini pushes `logs/MINI-ARMED.md` in this repo. | Mini |
| 8 | Families, from the genesis bundle that wrote `hashes/SIXTEEN.md`, then payments: 1,013, 2,027, 3,040, the HOLD-4 minute at 4,053, then 1,013 again. | Desk; the bot in HOLD-4 only |

## What a decent result is

Decent is enough to stop opening another pre-run.

- `hashes/SIXTEEN.md` is on origin with sixteen rows and an On origin line before the first family submit.
- HOLD-1 met: three clean minutes of submit-OK within 10 percent of 1,013.
- The HOLD-4 minute has a desk file, a bot file or a legal `NO SEND`, and a Mini file with the matching sender mark.
- Cohort rows are in the files. No id, txid, key, seed, address, host, or port is in this repo.
- Wednesday's repo is untouched. Tuesday's repo is untouched. Pre-run 1's go files are untouched. The desk node process was not stopped.

Perfect is the same, with HOLD-2, HOLD-3, and RETURN each met or an honest `NOT MET` after one repair pass, and [logs/METHOD.md](logs/README.md) on origin.

A miss here stays in this repo. A next attempt is a new repo, and it starts from this repo's [locks/LOCKED.md](locks/LOCKED.md). This repo's pastes are not rewritten to match the result.

## What is already locked

[locks/LOCKED.md](locks/LOCKED.md) holds every line locked before and after pre-run 1, and the pre-run 4 section. A fix that works during this run is appended there.

## Targets

Targets: 1,013, then 2,027, then 3,040, then one observation minute at 4,053, then 1,013 again. Scored steps need three clean minutes, or they close `NOT MET` after one repair pass. HOLD-4 is the minute pinned in [plan/PLAN.md](plan/PLAN.md).

**Part of [tn-master](https://github.com/STP-KAS/tn-master).** The rule is [docs/NEURON.md](https://github.com/STP-KAS/tn-master/blob/main/docs/NEURON.md). This pre-run is its own row. It is not row 47.
