---
title: Start queue
description: Make starts on a busy node take turns, with members first, a longest wait and an offer to move to a quieter node.
---

When a node is busy, starts on it take turns instead of piling more load onto it at once. A user
whose start has to wait sees a queue page with their place in line, why the node is busy, and how
long the wait can last at most; the start goes out by itself when its turn comes. Admins turn the
queue on and set the line. It is the third [start gate](/starts/start-gates/).

## What it does

### Who waits

A start, and a restart unless Queue Restarts is off, waits when all of these hold:

- the queue is on;
- the user is not an admin and not in one of the Exempt Roles;
- the server is not suspended and not busy (installing, restoring, moving);
- the server's last start was not let go less than Free Pass minutes ago;
- Shortest Wait is above 0, or others already wait on the server's node, or the node's newest sample
  (from the last 5 minutes) has memory or CPU use over the line.

With Shortest Wait above 0 (the default) every start shows the queue page for at least that long,
even on a quiet node. Set it to 0 to queue only on busy nodes.

The **line** is Line (%), lowered on a small node by the offset in Admin › Settings › Hosting ›
Placement, the same way as the deployment pause ([placement](/nodes/placement/)). A node without a
fresh sample, or one that does not answer, holds nobody back.

Pressing Start again while waiting keeps the place; a restart pressed then replaces the start.

### The order

Members go first: the second membership, then the first, then everyone else, each by arrival. A
membership bought or given while waiting moves the start up at once. With memberships off, everyone
waits by arrival. See [memberships](/economy/credits-and-tokens/).

### Release

The `release_start_queue` task looks at every line every 10 seconds:

| When | It does |
|---|---|
| The queue was turned off | Lets every waiting start go |
| A start waited Longest Wait seconds | Lets it go, whatever the node looks like |
| The front of the line waited less than Shortest Wait | Nothing |
| The node let a start go less than Seconds Between Starts ago | Nothing |
| The node, asked right then, is under the line | Lets the front of its line go |

A released start goes straight to Wings, past the gates after the queue. A server that was
suspended or got busy while waiting is not started. The queue page notices the release within 5
seconds and opens the console.

Moving the server takes it out of the line; the move starts it on its new node.

### The queue page

Users see, top to bottom:

- "Getting your server ready": whether a start or a restart waits (a restart keeps the server
  running until its turn), the place in line ("You are next" at the front, "Priority" for members),
  how long it has waited, and "Starts within N seconds at the latest".
- Why it waits: memory or CPU over the line, with both readings as meters, or "The node has room
  again".
- The waiting rooms' ads, when [ads](/economy/ads/) are on.
- For users without a membership, while memberships are on: an offer for the first membership and
  its price ("ahead of everyone without it"), leading to the membership page. Members see what they
  have instead. While Admin › Settings › Ads › Promotions › Offers Where a Limit Is Felt is on, one
  line under the offer, and under a first-membership member's note, says the second membership goes
  first in this line, with a link to the membership page; members of the second see none
  ([ads](/economy/ads/#offers-where-a-limit-is-felt)).
- **Move to a quieter node**, when Offer a Move is on (see below).
- "Cancel and go back": leaves the line and returns to the console. The server stays off.

The server's sidebar is hidden while the page is open.

### Moving off a busy node

With Offer a Move on, the queue page offers to move the server to the quietest other node of its
location: one that takes new servers, has room for the server and is under its line now. It is
offered when all of these hold:

- moving servers is on (Admin › Settings › Hosting › Games › Players Move Servers) and the user
  has the `settings.transfer` permission on the server;
- the account has a membership, while Only for Members is on;
- the server's disk limit is under Largest Server (servers with unlimited disk never get it);
- the server is not cooling down from an earlier move.

Taking it, after a confirmation, checks all of this again, moves the server (to that node first,
then the location's other nodes) and opens the Transfer page. The move takes the server out of the
line and starts it on its new node, with a new address. A server too large for the offer gets a line
saying waiting is faster. See [moving servers](/servers/moving-servers/).

### Activity

The server's activity log shows `server:queue.join`, `server:queue.release` (with the reason
`room`, `timeout` or `off` and the seconds waited) and `server:queue.leave`.

## Requirements

- [Node telemetry](/nodes/telemetry/): the queue judges a node by its samples. Without a sample
  from the last 5 minutes a node never holds starts back for being busy (Shortest Wait still
  applies).
- Memberships (Admin › Settings › Economy › Memberships) for priority in the line and for the move
  offer while Only for Members is on.

## Setup

1. Admin › Settings › Hosting › Start Queue: turn on **Queue Starts on Busy Nodes**.
2. Set **Line (%)**, the memory or CPU use above which a node holds starts back.
3. Choose **Shortest Wait**: 0 queues only on busy nodes, above 0 shows every start the queue page
   for that long.
4. Optional: put staff roles in **Exempt Roles**.
5. Save.

## Settings

### Admin › Settings › Hosting › Start Queue

| Setting | Default | What it does |
|---|---|---|
| Queue Starts on Busy Nodes | off | Turns the queue on |
| Queue Restarts | on | A restart waits too; the server keeps running until its turn |
| Line (%) | 85 | Memory or CPU use above which a node holds starts back, 1 to 100. Lower on a small node |
| Shortest Wait (Seconds) | 10 | Every start waits at least this long, even on a quiet node. 0 queues busy nodes only. Up to 300 |
| Longest Wait (Seconds) | 600 | After this a start goes out however busy the node is, 30 to 86400 |
| Seconds Between Starts | 20 | A node lets one start go, then waits this long before it is measured for the next, 0 to 3600 |
| Free Pass (Minutes) | 10 | After a start was let go, the server's next start within this time does not wait, 0 to 1440 |
| Exempt Roles | none | Members of these roles never wait, like admins. Up to 100 roles |

### Moving Off a Busy Node

| Setting | Default | What it does |
|---|---|---|
| Offer a Move | on | The queue page offers a move to the quietest other node of the location |
| Only for Members | on | Only accounts with a membership see the offer |
| Largest Server (MiB) | 3072 | Only servers with a disk limit under this get the offer. 0 offers it at any size, up to 1048576 |

## Permissions

The queue adds no permissions. The queue page needs `control.start` or `control.restart` on the
server; taking the move also needs `settings.transfer`.

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `release_start_queue` | every 10 seconds | Lets the front of each line go once its node has room, and every start that waited Longest Wait |

Background tasks run only on the panel instance with `APP_PRIMARY=true`.

## Notes

- Longest Wait is the ceiling: a queue without one would be an outage with a progress bar. Keep it
  short enough that users do not give up.
- With Only for Members on and memberships off, nobody gets the move offer.
- A node is asked again right before a release, so a burst of starts on a node that just went quiet
  still goes out one per Seconds Between Starts.
