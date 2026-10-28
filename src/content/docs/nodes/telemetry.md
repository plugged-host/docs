---
title: Node telemetry
description: How the panel checks every node once a minute, what it keeps, and the node and location fields placement reads.
---

The panel checks every node once a minute and keeps what it saw for a week. One sampler serves
everything that needs to know how a node is doing: the node's Statistics tab, the
[status page](/status/status-page/), [placement and the deployment pause](/nodes/placement/), the
[start queue](/starts/start-queue/) and [node failover](/nodes/failover/). Nodes and locations also
carry a few fields of their own that placement and the status page read. The telemetry views are
for admins; users only see what the status page shows.

## What it does

### The sample

Once a minute the panel asks each node's Wings, 16 nodes at a time, with 5 seconds to answer:

| Asked | Gives |
|---|---|
| System stats | CPU use (all threads, 0 to 100), threads, memory and disk used and total; the time the answer took is the response time |
| Server states | How many servers are running (starting, running and stopping all count) |
| System load (Wings fork only) | The 1-minute load average; a stock Wings node answers 404 and the load stays empty |

When Wings does not answer, a TCP connect to its port tells two failures apart:

- **Wings not listening**: the machine is up but nothing listens on the port. Wings is stopped,
  crashed or still starting.
- **Unreachable**: no answer at all. The machine or its network is gone.

[Node failover](/nodes/failover/) only counts the second kind. A refused port breaks a run of
outages, since the machine is up then.

### Pressure

**Pressure** is the higher of CPU and memory use in percent, averaged over the answered samples of
the last 5 minutes. The deployment pause and placement compare against it, so one busy minute does
not move servers around.

### Where it shows

- Admin › Nodes › a node › Statistics: under the live graphs, the **Health and History** card shows
  the state now (Answering, Wings not listening, Unreachable), response time, Pressure (5 min),
  Load (1 min), Servers Running, Missed Checks in a Row, Last Answered and Last Check, with charts
  of CPU, memory, disk, response time and running servers for 1 hour, 24 hours or 7 days. It
  refreshes every minute.
- Admin › Nodes › a node › Overview: the role, the tags, the SRV target and a **Deployment Paused**
  badge, with the reason when the panel paused the node itself.

Samples are kept for 7 days. A node's samples are deleted with the node.

### Node fields

Edited on Admin › Nodes › a node › General:

| Field | What it does |
|---|---|
| Role | **Game** takes users' servers. **Internal** is for admins only (tests, builds, a node being set up) and is never picked for users. **Limbo** keeps the servers parked on it until they are restored and takes nothing new ([Limbo](/starts/limbo/)) |
| Tags | Short labels for grouping nodes, such as `nvme` or `ddos-protected`. Saved in lower case, sorted, without duplicates. At most 32 tags of 1 to 64 letters, digits, `-`, `_` or `.` |
| SRV Target | The host name that [server subdomains](/servers/subdomains/)' SRV records point to. Empty uses the node's address |
| CPU | The processor the [status page](/status/status-page/) names for the node, such as `Xeon E5-2651 v3` (up to 64 characters). Empty names none |
| Memory Type | The memory the status page names, such as `DDR4` (up to 32 characters). Empty names none |
| Deployment Paused | A paused node takes no new servers; its servers keep running. The panel also sets and clears this itself from the telemetry ([Placement](/nodes/placement/)). A node you pause by hand stays paused |

CPU and Memory Type are typed by an admin: stock Wings reports neither.

### Location fields

Edited on Admin › Locations › a location:

| Field | What it does |
|---|---|
| Tier | The membership a user needs to put servers here. `plus` opens it to users with the first or the second membership, `premium` to users with the second membership only. Empty: every user. Any other value keeps users out ([Credits and tokens](/economy/credits-and-tokens/)) |
| Sort Order | Order in the location picker, lowest first |
| Public | Users can pick public locations for their servers. Admins can always use every location |

## Requirements

- Nothing for the sample itself: it works with stock Wings.
- The load average needs the [Wings fork](/nodes/wings/). Without it the Load figure stays empty
  and everything else works.

## Permissions

| Permission | Gives |
|---|---|
| `nodes.read` | The node's Statistics tab with its telemetry, and the Overview |
| `nodes.update` | Editing a node's role, tags, SRV target, CPU, memory type and Deployment Paused |
| `locations.update` | Editing a location's tier, sort order and public switch |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `sample_nodes` | Every minute, at second 30 | Samples every node, then runs the [deployment pause](/nodes/placement/) |
| `prune_node_telemetry` | Daily at 04:15 | Deletes samples older than 7 days |

Background tasks run only on the panel instance with `APP_PRIMARY=true`. Admin › Overview › Health
shows when each one last ran, and its **Node Telemetry** card lists nodes whose newest sample is
missing or older than 150 seconds ([Troubleshooting](/panel/troubleshooting/)).

## Notes

- Without a sample in the last 5 minutes a node counts as idle for placement; a node that stopped
  answering counts as full.
- To check the sampler, stop Wings on a test node: within two minutes the card says "Wings not
  listening" and Missed Checks in a Row counts up. Start Wings again and it says "Answering".
- Telemetry only talks to the nodes. It works the same with or without
  [noprofit.space](/accounts/noprofit/).
