---
title: Placement and the deployment pause
description: Which node a new server goes to, and how the panel stops sending servers to a busy, full or unreachable node.
---

When a server is deployed to a location, the panel picks one of its nodes by how full it is on paper
and how busy its machine really is. A node that is too busy, too full on disk or not answering is
**paused**: it takes no new servers until it recovers, and the panel reopens it by itself. Both read
the [node telemetry](/nodes/telemetry/). Admins set the lines; users only notice that a location
can be full.

## What it does

### Picking a node

A server deployed to a location (an admin's deploy, a user's create, a move, a restore) goes to
one of the location's nodes that:

- has deployment enabled, is not in maintenance and is not paused;
- has room for the server's memory and disk (a node limit of 0 is no limit);
- for a user's server, has the role **Game**.

Among those:

- The order is by the fullest of allocated memory, allocated disk and pressure (the higher of CPU
  and memory use, averaged over 5 minutes), emptiest node first.
- With randomness, each node's chance is weighted by what is left of the same three, so a node whose
  machine is busy gets fewer servers even when little is allocated on it.
- A node without a sample in the last 5 minutes counts as idle. A node that stopped answering counts
  as full.
- Suspended servers count half towards a node's allocated memory and disk.

### The deployment pause

After every sample (once a minute) the panel pauses and reopens nodes by itself. A paused node takes
no new servers, from admins either; its servers keep running.

| When | Does |
|---|---|
| Memory use is over the line | Pauses, reason memory |
| CPU use is over the line (memory is not) | Pauses, reason CPU |
| The node missed **Missed Checks** samples in a row | Pauses, reason not answering |
| Disk use is over the **Disk Line** (memory and CPU are not) | Pauses, reason disk |
| A memory or CPU pause, now under the line and its 5-minute average too | Reopens |
| A not-answering or disk pause, and the node answers under that line | Reopens |
| No sample in the last 3 minutes | Changes nothing |

The **line** is **Line (%)** (85 by default). On a small node it is lower by **Lower Line by
(Points)** (10): a node with less memory than **Memory Under (GiB)** (34) or fewer threads than
**Threads Under** (9) is paused at 75%. Waiting for the 5-minute average before reopening keeps a
node from flapping.

### The disk guard

**Disk Line (%)** (85) keeps a node whose disk is fuller than that from taking new servers, moves or
restores: creates, users' and admins' moves, Lighten Load, the start queue's moves, failover and
limbo restores all pick their node through the pause.

- It works with **Pause Busy Nodes** off too. 0 turns it off.
- A node whose sample has no disk numbers is never paused for its disk, and an unreachable node is
  left to the not-answering pause.
- Resizing a server picks no node, so the guard does not apply to it.

### Pauses by hand and by the panel

- The reason is shown on the node's Overview: "Deployment Paused (memory)", "(CPU)", "(not
  answering)" or "(disk)".
- A node you pause by hand (Deployment Paused on its General tab) has no reason, and the panel never
  reopens it.
- Unpausing a node the panel paused clears the reason; the panel pauses it again on the next sample
  if it is still over the line.
- Turning **Pause Busy Nodes** off reopens the nodes the panel paused for load and leaves the rest
  alone.
- Every pause and reopen is written to the panel's log with the node's name.

### A full location

Nothing falls back to a full node. When every node of a location is paused, a deploy there fails
with "every node in the selected location(s) is too busy for new servers right now", and the
user's create page shows the location as full.

## Setup

Placement works out of the box with the defaults. To tune it:

1. Open Admin › Settings › Hosting › Placement.
2. Set **Line (%)** to the memory or CPU use at which a node should stop taking servers.
3. Set **Disk Line (%)** to the disk use at which a node should stop taking servers, moves and
   restores, or 0 to turn the disk guard off.
4. Under **Small Nodes**, set what counts as a small node and how much lower its line is.
5. Save. Within two minutes a node over a line shows "Deployment Paused (reason)" on its Overview.

## Settings

### Admin › Settings › Hosting › Placement

| Setting | Default | What it does |
|---|---|---|
| Pause Busy Nodes | on | The panel pauses and reopens nodes by memory, CPU and answering |
| Line (%) | 85 | Memory or CPU use above which a node is paused (10 to 100) |
| Missed Checks | 3 | Checks in a row a node may miss before it is paused (1 to 60) |
| Disk Line (%) | 85 | Disk use above which a node takes no new servers, moves or restores (0 to 100, 0 is off); works with Pause Busy Nodes off |
| Lower Line by (Points) | 10 | How much lower the line is on a small node (0 to 50) |
| Memory Under (GiB) | 34 | A node with less memory is small (0 to 4096, 0 is never small) |
| Threads Under | 9 | A node with fewer threads is small (0 to 1024, 0 is never small) |
| Deployment Port Ranges | `30000-50000,25000-30000` | Where the panel makes allocations by itself ([Allocations](/nodes/allocations/)) |

## Permissions

| Permission | Gives |
|---|---|
| `settings.update` | Changing the placement settings |
| `nodes.update` | Pausing and unpausing a node by hand |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `sample_nodes` | Every minute, at second 30 | Samples every node, then pauses and reopens nodes |

It runs only on the panel instance with `APP_PRIMARY=true`.

## Notes

- A paused node is paused for admins' deploys too. To put a server on a paused node, create it on
  that node directly or unpause the node.
- The deployment pause is separate from the native "Deployment Enabled" switch, which the panel
  never changes.
- The [start queue](/starts/start-queue/) uses its own line for starts, lowered on small nodes by
  the same offset.
- Placement only talks to the nodes. It works the same with or without
  [noprofit.space](/accounts/noprofit/).
