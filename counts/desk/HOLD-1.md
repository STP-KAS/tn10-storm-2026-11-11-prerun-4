MET

# HOLD-1, desk sender log, pre-run 4

> Counts only. The desk's sender log. It is not a chain count. Mini counts the chain.

Payment offer 1,013 tx/s at 150 sompi/gram, from 3 payment senders, one per kept public node. Families offer 1.2 hop/s, 16 families live, one family-sender process and one builder.

## Hop rate per cohort, as built

Floor (families 1–13): 100 sompi/gram per hop. Double (families 14–16): 200 sompi/gram per hop. The rate rides on each hop line to the one builder.

## Funding coins, as read from the desk node

The funding coins were not one size. Sizes seen, whole tKAS (coins): 33 (1,823), 32 (1,747), 34 (1,683), 31 (1,494), 35 (1,281), 36 (938), 30 (848), 37 (648), 38 (402), 39 (217), 29 (155), 28 (145), and 66 more sizes. The fee is not called the whole cause.

## Minutes

| Minute (UTC) | Pay submit-OK | Attempts | Rejects, rate | Rejects, full | Other | Floor OK / att / rate rej / full rej / waiting | Double OK / att / rate rej / full rej / waiting | Family stalls logged | Clean |
|---|---:|---:|---:|---:|---:|---|---|---:|---|
| 2026-11-11T16:52 | 59,767 | 59,767 | 0 | 0 | 0 | 539 / 1107 / 0 / 0 / 20 | 148 / 261 / 0 / 0 / 3 | 0 | yes |
| 2026-11-11T16:53 | 59,767 | 59,767 | 0 | 0 | 0 | 493 / 1089 / 0 / 0 / 13 | 139 / 265 / 0 / 0 / 3 | 0 | yes |
| 2026-11-11T16:54 | 59,767 | 59,767 | 0 | 0 | 0 | 469 / 1078 / 0 / 0 / 13 | 121 / 251 / 0 / 0 / 3 | 0 | yes |

A family stall is a coordinator mark: no hop of that family landed for a while. The family was still attempting. It is logged, and it does not make the minute dirty.

Within 10 percent means 54,702 to 66,858 submit-OK in the minute.

## Public nodes (local numbers)

Kept: 1, 4, 5. The family sender is on node 1. Both cohorts share that node.

| Node | Synced every sample | Last DAA | Pay submit-OK | Pay rejects | Dropped sockets | Answer ms, median |
|---:|---|---:|---:|---:|---:|---:|
| 1 | yes | 620798865 | 59,826 | 0 | 0 | 49 |
| 4 | yes | 620798865 | 59,826 | 0 | 0 | 50 |
| 5 | yes | 620798865 | 59,649 | 0 | 0 | 46 |

## Hop submit to landing, per cohort

| Cohort | Landed of OK | Median ms | Slow tail (p95) ms |
|---|---:|---:|---:|
| floor | 1501 of 1501 | 1168 | 2645 |
| double | 408 of 408 | 1032 | 2344 |

Landing is the accepting block header time the desk's coordinator read. Waiting is submitted-OK not yet landed at the minute's end.
