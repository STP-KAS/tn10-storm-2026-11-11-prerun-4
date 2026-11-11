> **Experimental. We are just trying this.** [Disclaimer](../DISCLAIMER.md) · This page does not start a machine.
>
> Lines here are locked for pre-run 2. This pre-run does not reopen them. Wednesday's plan is not edited from this page. Pre-run 1's pages are not edited from this page.

# Locked

Pre-run 2 starts from this page.

The two sections under **Carried from pre-run 1** are copied without change from [pre-run 1's locks/LOCKED.md](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun/blob/main/locks/LOCKED.md) at commit b39a506. In them, "this pre-run" and "this repo" mean pre-run 1. Every line there holds for pre-run 2 as well.

# Carried from pre-run 1

## Locked before pre-run 1

These came from the Wednesday review, through round 4, and this pre-run keeps them.

- The desk keeps every public node it used in HOLD-3. It does not drop one to free it for the bot.
- The bot sends only on a synced public node outside that set, one process, and only in the HOLD-4 minute. No free node means `NO SEND` and `no-free-node`. The bot has no local node.
- The HOLD-4 minute is the first whole UTC minute whose start is at least 3 minutes after the HOLD-3 file's On origin time. Both sides read that time from origin. An unsynced minute is still that minute. The run does not open a later one.
- Mini publishes HOLD-4 when the bot file is on origin, or `logs/BOT-HALT.md` is on origin, or the desk's HOLD-4 file has been on origin for 10 minutes. `TWO SENDERS` only when the bot file is on origin and is not `NO SEND`. Mini does not republish.
- Families 1–13 and families 14–16 use the same family-sender nodes. Fees stay 100, 200, and 150 sompi per gram. The sixteen are one build. The rate is per family, in one process. A single rate for the process is not a fee difference. A second builder is not the fix. If the funding coins are not one size, the file says so and does not call the fee the whole cause. A priority quote is not read. A fee estimate is not read.
- Mini is the only chain counter. Mini does not send. The bot stays out of HOLD-1, HOLD-2, HOLD-3, and RETURN.
- The abort line stays 2,500 coins and 18,000 usable tKAS. The desk node process is not stopped by this pre-run.
- This repo does not edit Tuesday's repo and does not edit Wednesday's repo.

## Locked during this pre-run

Nothing yet. When a fix works, append it here before the next pre-run is written.

One block per fix:

```
- UTC time.
- What failed.
- What was changed.
- Why that change stays.
```

The go files in this repo stay as they were at the paste. The next repo copies this page and bakes the new lines into its own pastes.

### Worked fixes appended on 11 Nov 2026, after pre-run 1 failed

These blocks are appended in the form above. The line `Nothing yet.` is the state before these blocks. Pre-run 2, [tn10-storm-2026-11-11-prerun-2](https://github.com/STP-KAS/tn10-storm-2026-11-11-prerun-2), starts from this page.

```
- 2026-11-11T07:21:32Z.
- What failed: the desk and Mini reset during pre-run 1, before hashes or sends. Nothing was armed for send after the reset.
- What was changed: pre-run 1 was marked failed in logs/FAILED.md and closed. It is not resumed. The next attempt is a new repo, tn10-storm-2026-11-11-prerun-2.
- Why that change stays: a failed pre-run's open and armed files are history, not live gates. A new attempt opens its own files in its own repo.
```

```
- 2026-11-11T07:16:33Z.
- What failed: the bot waiter from pre-run 1 kept polling origin after the desk and Mini had reset. A late HOLD-3 file could have made it send on a dead run.
- What was changed: the operator stopped the waiter. BOT-HALT was written. No second waiter was started.
- Why that change stays: a waiter does not outlive its run. When a run fails, its waiters are stopped and not reused. A new run gets a new paste.
```

```
- 2026-11-11T08:04:08Z.
- What failed: Mini rebooted during pre-run 1 and its TN10 kaspad was down.
- What was changed: the existing Mini TN10 kaspad was started with its existing start task and data directory. No wipe. It re-synced from its own data, finished IBD, and accepted live blocks.
- Why that change stays: before any new paste or arm, start the existing Mini TN10 kaspad if it is down. Do not wipe chain data. Re-sync first. When isSynced is true and DAA is moving, Mini notifies Build and TN10 ops. Mini does not publish a new MINI-ARMED until GO-MINI is pasted and PRE-RUN-OPEN is on origin.
```

```
- 2026-11-11T07:54:58Z.
- What failed: the desk rebooted during pre-run 1 and its private TN10 kaspad was down. Windows PowerShell 5.1 drops the start arguments and can open mainnet.
- What was changed: the existing desk private TN10 kaspad was started from its existing data, loopback only, with PowerShell 7 (pwsh). No wipe. KaspaPublicNode was not started. The desk devnet was left alone. IBD finished and the node accepted live blocks.
- Why that change stays: start the desk private TN10 node from existing data if it is down, with pwsh 7, never Windows PowerShell 5.1. Do not wipe. Do not start KaspaPublicNode. Leave the desk devnet alone. The pre-run does not stop the desk node process.
```

```
- 2026-11-11T09:59:00Z.
- What failed: pre-run 1 was gated on a wall clock and a waiter sat on that clock. The day's clock moved and the run died before hashes.
- What was changed: the operator set the next attempt as target-oriented, with no time frames.
- Why that change stays: the pre-run is target-bounded. It has no T0 after the start and no public clock. Order: hashes first (hashes/SIXTEEN.md, sixteen rows, with an On origin line), then covenant families, then gradual senders. The bot sends only in the HOLD-4 minute after desk HOLD-3 is on origin, or writes a legal NO SEND. Chat is not the start signal. The operator's paste is the arm.
```

```
- 2026-11-11T10:00:00Z.
- What failed: the desk hash tools publish only 8 or 32 families. The pre-run needs sixteen.
- What was changed: the old 8- and 32-family publisher is barred for the pre-run. A sixteen-family path is needed before any hash file is published. No hash value or covenant id is invented.
- Why that change stays: a hash file with the wrong family count is not proof. No sixteen-row file with an On origin line, no family submit.
```

# Pre-run 2

## Locked for pre-run 2

These lines are baked into this repo's own pastes. They come from the worked fixes above.

- Pre-run 1 is failed and closed. It is not resumed. Its `PRE-RUN-OPEN`, `MINI-ARMED`, `BOT-HALT`, and `FAILED` files are history in that repo, not gates here. This repo writes its own.
- A waiter does not outlive its run. If this repo's `logs/BOT-HALT.md` or `logs/FAILED.md` is on origin, every runner and waiter of this run stops and is not reused.
- Before any new paste or arm, Mini's existing TN10 kaspad is up from its own data, not wiped, and re-synced. When `isSynced` is true and DAA is moving, Mini notifies Build and TN10 ops. Mini does not publish a new `MINI-ARMED` until GO-MINI is pasted and this repo's `PRE-RUN-OPEN` is on origin.
- The desk's existing private TN10 kaspad is up from its own data, started with PowerShell 7 (`pwsh`), never Windows PowerShell 5.1. No wipe. `KaspaPublicNode` is not started. The desk devnet is left alone. This pre-run does not stop the desk node process.
- This pre-run is target-bounded. No T0 after the start, and no public clock. Hashes first: `hashes/SIXTEEN.md`, sixteen rows, with an On origin line. Then the covenant families. Then the senders, step by step. The bot sends only in the HOLD-4 minute after the desk's HOLD-3 file is on origin, or writes a legal `NO SEND`.
- Chat is not the start signal. The operator's paste is the arm.
- The old 8- or 32-family hash publisher is not used for this pre-run. A hash is never invented.
- The fee lines (100, 200, 150 sompi per gram), the abort line (2,500 coins and 18,000 usable tKAS), the HOLD-4 minute, and the node-set lines above are not loosened.
- This repo does not edit Tuesday's repo, Wednesday's repo, or pre-run 1's go files, and does not write `REVIEW_CLOSED`.

## Locked during pre-run 2

Nothing yet. When a fix works, append it here, one block per fix, in the form shown above: UTC time, what failed, what was changed, why that change stays.

```
- 2026-11-11T12:22:54Z.
- What failed: pre-run 1's sixteen-family hash step stopped with HASH_STOP build. Its genesis launch paths began launch::prerun1-, and the reference builder refuses any genesis launch path outside its allow-list ("launch path not on the storm allow-list").
- What was changed: pre-run 2's genesis launch paths begin launch::storm-2026-10-, and the hash tool refuses any other prefix before it reads the node. The desk check then built sixteen genesis transactions and sixteen rows.
- Why that change stays: a genesis launch path must start with launch::storm-2026-10-. Any other path does not build, and then there is no hash file and no send.
```

```
- 2026-11-11T15:23:08Z.
- What failed: HOLD-1 was met. In HOLD-2 the desk runner marked minutes dirty because families logged STALL marks, and the reason came out blank. The runner process was stopped mid-run to apply that scoring fix. Its children (builder broker, builder, coordinator, family sender, payment senders) died with it. The restarted runner found the family processes gone and wrote logs/FAILED.md. The run is not resumed.
- What was changed: nothing in this repo's run. The next repo carries three lines. (a) A runner is never restarted mid-run to apply a scoring fix. The run is left alone and the fix goes into a later repo. (b) If a later design must ever replace a runner, its children (builder, broker, coordinator, family sender, payment senders) are started detached, so they survive the parent. (c) A family STALL (no hop of that family landing for a while) is not dirt for HOLD scoring. GO-DESK's clean minute does not count it. A stall at the two-thirds rate is part of the congestion question, and it is logged per minute.
- Why that change stays: a scoring fix applied by restarting the runner killed a run that was sending cleanly. A stall is data about congestion and competition, not a sender fault.
```

The go files in this repo stay as they were at the paste. A next repo copies this page and bakes the new lines into its own pastes.

## Locked for pre-run 3

These lines are baked into this repo's own pastes. They come from pre-run 2's worked fixes above.

- Pre-run 2 is failed and closed. It is not resumed. Its `PRE-RUN-OPEN`, `MINI-ARMED`, `BOT-HALT`, and `FAILED` files are history in that repo, not gates here.
- Pre-run 2's genesis coins are spent. This repo publishes fresh `hashes/SIXTEEN.md` rows from the desk node with the sixteen-family publisher. Genesis launch paths begin `launch::storm-2026-10-`. A hash is never invented. The family submit uses the bundle that wrote this repo's file. Nothing rebuilds it after the publish.
- A runner is never restarted mid-run to apply a fix. The run is left alone and the fix goes into a later repo.
- The desk runner starts its children (builder broker, builder, coordinator, family sender, payment senders) detached, so they survive the parent.
- A family STALL is not dirt for HOLD scoring. It is logged per minute.
- The operator does not paste for this repo. His instruction to start everything is the arm. The agents start the runners after the gates are facts. The Mini runner refuses to publish `MINI-ARMED` unless its node is synced with DAA moving. That file on origin is Mini's synced notice to Build and TN10 ops.
- Mini's clone carries the git user name and email before its first push.
- The fee lines (100, 200, 150 sompi per gram, genesis 200), the abort line (2,500 coins and 18,000 usable tKAS), the HOLD-4 minute, the offers, and the node-set lines are not loosened.
- This repo does not edit Tuesday's repo, Wednesday's repo, or pre-run 1's or pre-run 2's go files, and does not write `REVIEW_CLOSED`.

## Locked during pre-run 3

Nothing yet. When a fix works, append it here, one block per fix, in the form shown above: UTC time, what failed, what was changed, why that change stays.

```
- 2026-11-11T15:40:21Z.
- What failed: the desk runner stopped with "readSub is not defined" on the first scored HOLD-1 minute and wrote logs/FAILED.md. The genesis, family-start, and submit-log reader section sat inside a { ... } block in an ES module, so readSub, landed, and subRows were not in scope for the scoring code. The dry start before the run only reached the gate check.
- What was changed: nothing in this repo's run. The next repo's runner has that block removed, passes a no-undef lint, and has passed an offline rehearsal on the desk through HOLD-1 scoring and a count-file render before its live run.
- Why that change stays: a runner is rehearsed offline through HOLD-1 scoring, with faked submit and payment logs and no live send, before any live run. A dry start that only reaches the gate check is not a rehearsal.
```

## Locked for pre-run 4

These lines are baked into this repo's own pastes. They come from pre-run 3's worked fixes above.

- Pre-run 3 is failed and closed. It is not resumed. Its `PRE-RUN-OPEN`, `MINI-ARMED`, and `FAILED` files are history in that repo, not gates here.
- Pre-run 3's genesis coins are spent. This repo publishes fresh `hashes/SIXTEEN.md` rows from the desk node with the sixteen-family publisher. Genesis launch paths begin `launch::storm-2026-10-`. A hash is never invented. The family submit uses the bundle that wrote this repo's file. Nothing rebuilds it after the publish.
- The desk runner passes a no-undef lint, and an offline rehearsal on the desk through HOLD-1 scoring and a count-file render, before its live run. The rehearsal fakes the submit and payment logs and sends nothing.
- A full mempool returns the payment coin to that sender's pool. It is logged as full and does not stop the sender.
- Every pre-run 2 and pre-run 3 line above stays: no runner restart mid-run, children started detached, a family stall is not dirt, the operator's start is the arm, Mini's clone has its git identity before its first push.
- The fee lines (100, 200, 150 sompi per gram, genesis 200), the abort line (2,500 coins and 18,000 usable tKAS), the HOLD-4 minute, the offers, and the node-set lines are not loosened.
- This repo does not edit Tuesday's repo, Wednesday's repo, or pre-run 1's, 2's, or 3's go files, and does not write `REVIEW_CLOSED`.

## Locked during pre-run 4

Nothing yet. When a fix works, append it here, one block per fix, in the form shown above: UTC time, what failed, what was changed, why that change stays.
