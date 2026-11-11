MET

# HOLD-2, desk sender log, pre-run 4

> Counts only. The desk's sender log. It is not a chain count. Mini counts the chain.

Payment offer 2,027 tx/s at 150 sompi/gram, from 3 payment senders, one per kept public node. Families offer 1.2 hop/s, 16 families live, one family-sender process and one builder.

## Hop rate per cohort, as built

Floor (families 1–13): 100 sompi/gram per hop. Double (families 14–16): 200 sompi/gram per hop. The rate rides on each hop line to the one builder.

## Funding coins, as read from the desk node

The funding coins were not one size. Sizes seen, whole tKAS (coins): 33 (1,829), 32 (1,752), 34 (1,664), 31 (1,491), 35 (1,277), 36 (936), 30 (860), 37 (640), 38 (401), 39 (218), 29 (165), 28 (149), and 65 more sizes. The fee is not called the whole cause.

## Minutes

| Minute (UTC) | Pay submit-OK | Attempts | Rejects, rate | Rejects, full | Other | Floor OK / att / rate rej / full rej / waiting | Double OK / att / rate rej / full rej / waiting | Family stalls logged | Clean |
|---|---:|---:|---:|---:|---:|---|---|---:|---|
| 2026-11-11T16:56 | 117,528 | 117,528 | 0 | 0 | 0 | 8 / 918 / 0 / 0 / 13 | 14 / 215 / 0 / 0 / 3 | 10 | yes |
| 2026-11-11T16:57 | 117,528 | 117,528 | 0 | 0 | 0 | 13 / 921 / 0 / 0 / 13 | 12 / 216 / 0 / 0 / 3 | 4 | yes |
| 2026-11-11T16:58 | 117,528 | 117,528 | 0 | 0 | 0 | 6 / 923 / 0 / 0 / 13 | 11 / 216 / 0 / 0 / 3 | 5 | yes |

A family stall is a coordinator mark: no hop of that family landed for a while. The family was still attempting. It is logged, and it does not make the minute dirty.

Within 10 percent means 109,458 to 133,782 submit-OK in the minute.

## Public nodes (local numbers)

Kept: 1, 4, 5. The family sender is on node 1. Both cohorts share that node.

| Node | Synced every sample | Last DAA | Pay submit-OK | Pay rejects | Dropped sockets | Answer ms, median |
|---:|---|---:|---:|---:|---:|---:|
| 1 | yes | 620800925 | 119,652 | 0 | 0 | 49 |
| 4 | yes | 620800925 | 115,581 | 0 | 0 | 49 |
| 5 | yes | 620800925 | 117,351 | 0 | 0 | 46 |

## Hop submit to landing, per cohort

| Cohort | Landed of OK | Median ms | Slow tail (p95) ms |
|---|---:|---:|---:|
| floor | 16 of 27 | 20810 | 128211 |
| double | 35 of 37 | 12133 | 37125 |

Landing is the accepting block header time the desk's coordinator read. Waiting is submitted-OK not yet landed at the minute's end.
