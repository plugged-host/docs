---
title: Moving servers
description: How users move their servers to another location or node, how admins move servers and lighten a busy node, and how failed or stalled copies are retried.
---

Users move their own servers to another location, or to another node of the same location, from
the server's **Transfer** page. Admins move a server to the best node of a location, lighten a busy
node by queueing moves of some of its servers, and see what every location can still take. Every
move is a regular Wings transfer: the server stops, Wings copies its files and backups to the new
node, and the server starts again there if it ran before. A failed copy is tried again on another
node of the same location.

## What it does

### The Transfer page

With no move under way, the page shows:

- how the last move ended, for 10 minutes: "Moved" with the new address, "Move failed" with the
  reason, or "Move cancelled";
- the current location with the server's address, its data, its backups (count and size) and
  "Offline for about": the data plus the backups, at 40 MiB/s, plus 45 seconds for the stop, the
  check and the start;
- **Pick a location**: one row per public location (admins see every location) with its flag, tier,
  the visitor's own ping (see [Creating servers](/servers/create-server/#location-ping)) and
  "Current" or "Another node here", "Locked" (a tier the owner has not unlocked) or "Full" (no
  node takes new servers). Picking the current location moves the server to another node there;
- **Move to** and the location's name, with a confirmation naming the location and the time offline.

When a move cannot start, the reason shows above the rows and the rows are greyed out:

| Reason | Means |
|---|---|
| Moving is turned off | Players Move Servers is off (admins are not blocked) |
| Already being moved | A move of this server is under way |
| Suspended | Suspended servers cannot be moved (admins are not blocked) |
| Installing, restoring | The server is installing or restoring a backup |
| A backup is running | A backup started in the last day has not finished |
| Moved recently | Hours Between Moves has not passed since the last move (admins are not blocked) |

While a move runs, the page shows From → To, the state with its percent, the steps (Prepare, Stop,
Copy, Verify, Start; backups travel inside the copy), the data copied, speed, time left and the
attempt from the second node on, and **Cancel move**. Under it, the move's Activity. Both views end
with **Earlier moves**: the last 6 finished moves.

Every other page of the server shows a strip above its header while the server moves and for 2
minutes after: the state, where to, a bar, and **Details** to the Transfer page.

### One attempt

An attempt takes the most eligible node of the location ([placement](/nodes/placement/)) that has
the role **Game**, is not the server's node and was not tried before. Then:

- **Ports**: the server keeps its port numbers when the new node has all of them free on one
  address. Else it gets what the egg configuration deploys, else ports inside the deployment port
  ranges (its own numbers where it can, created when missing), else any free ports. Egg variables
  that held an old port get the new one once the move is done, and the new ports keep the old ones'
  lock and notes ([allocations](/nodes/allocations/)).
- **Backups**: the server's own backups move with it and are deleted on the old node. Shared backups
  stay.
- The copy is a `tar.zst` archive.
- While Wings copies, the server is off and its pages are blocked, except the console and the
  Transfer page.

When no node can take the server, the move ends at once as failed, with the reason (every node full,
paused, ...).

### Progress

The panel reads progress from the old node's Wings: the bytes copied and in all. The bar goes from
queued (0%) through preparing, stopping and copying (6 to 90% by the bytes) to verifying on the new
node (92%) and starting (97%). Speed counts from the start of the attempt.

### Settling and retries

Every 15 seconds the panel looks at moves whose transfer is over:

- the server is on the new node: **completed**. The ports are written to the egg variables and a
  server that ran before is started again;
- it is still on the old node and the move was cancelled: **cancelled**;
- otherwise the copy failed: the next node is tried while fewer than **Nodes Tried per Move** were
  tried, then **failed**. A server that ran before is started again where it is.

A suspended server is never started again. Then queued moves (from Lighten Load) are started while
their old node has fewer than **Moves at Once per Node** running. A queued server that moved or
changed meanwhile is closed as cancelled.

The owner, and the subuser who asked for the move, get a [notification](/accounts/notifications/)
when a move completes or fails. For an admin's move, the owner is told only when it completes.

### Stalled moves

Wings only reports a copy's end, so a hanging copy would hold the server forever. On each run the
panel also asks the old node about every running copy:

1. **Stalled**: the copy's counters have not changed for **Minutes Without Progress**, or the old
   node answers but no longer lists the copy for that long. An old node that does not answer gets
   that time plus the copy's size at 5 MiB/s, since it may still be sending.
2. **Unfinalized**: every byte was sent and the new node has not confirmed the copy within **Minutes
   to Finish**.
3. The panel cancels the copy on the old node and gives Wings 2 minutes to report the failure. When
   it does not, the panel releases the server itself: the destination and the ports made there are
   cleared and the half copy on the new node is deleted. A late success report is refused, so the
   server keeps its files on the old node.
4. The attempt then counts as a failed try: the next node, or **failed**. The timeline names the
   reason ("the copy made no progress" or "the new node did not confirm the copy").

The clocks live in the panel's memory, so a panel restart starts them again, which only gives a copy
more time.

### Cancelling

**Cancel move** cancels a queued move at once. A running move is cancelled through Wings and ends as
cancelled when Wings has stopped. A user cannot cancel a move an admin started ("an admin is moving
this server"). A cancel that Wings does not confirm within 2 minutes is released the same way as a
stalled copy.

### An admin's move

Admin › Servers › a server › Management › **Transfer** starts with **Destination**:

- **Best other node of** its location and **Best node of** another location run the same move as a
  user's: the most eligible node, ports kept where free, backups along, retried on another node,
  the timeline and history. Admins skip Players Move Servers, the cooldown, the suspension check and
  the tier lock; a move or a backup under way still blocks it. Only an admin can cancel it.
  **Start the Server When It Arrives** starts it on the new node even when it was off.
- **A node chosen by hand** is the regular transfer form (node, ports, backups, archive format,
  compression). Such a transfer has no retries and is not watched for stalls; its own Cancel button
  ends it.

### Restoring from limbo

Restoring a server parked on a limbo node queues a move to the game nodes of its location, its home
node first, its old ports back on the home node when they are free. Only an admin can cancel it, and
it skips Players Move Servers and the cooldown. See [Limbo](/starts/limbo/). Lighten Load never
moves a server in limbo.

### Lighten Load

Admin › Nodes › a node › Servers › **Lighten Load** queues moves of up to 100 of the node's servers
to the other nodes of its location with the same role:

| Servers | Picks |
|---|---|
| Stopped servers | Servers Wings reports as off; nobody is disconnected, they stay off |
| Running servers using the most memory | Running servers, biggest memory first; each is stopped, moved and started again |

Servers that are moving, installing or restoring are left out. Each server gets a new address.

### Capacity

Admin › Overview › **Capacity** shows, per location: open nodes (deployment on, not in maintenance,
not paused) of all its nodes, free memory and disk (counting nodes with a limit only), and the
average 5-minute load of its answering nodes ([node telemetry](/nodes/telemetry/)). Under it, the
moves under way, then the last finished ones (50 in all): server, from and to, status, nodes tried,
and who started it.

## Requirements

- Two or more nodes with the role **Game**, best in two locations.
- Stock Wings is enough; moves use Wings' own transfers.
- Subdomains follow a moved server by themselves ([Subdomains](/servers/subdomains/)). Anything else
  that points at the old address has to be updated by the owner.

## Setup

1. Admin › Settings › Hosting › Games › Moving Servers: turn on **Players Move Servers**.
2. Adjust Hours Between Moves and the retry settings if the defaults do not suit you, and save.
3. Give subusers `settings.transfer` where they should move servers; owners have it already.

## Settings

### Admin › Settings › Hosting › Games › Moving Servers

| Setting | Default | What it does |
|---|---|---|
| Players Move Servers | off | Shows the Transfer page (and the strip) to owners and subusers with `settings.transfer` |
| Hours Between Moves | 24 | Wait after a finished move before the next one (0 to 720; 0 is no wait). Admins never wait |
| Nodes Tried per Move | 2 | A failed copy is tried on the next node until this many nodes were tried (1 to 5) |
| Moves at Once per Node | 2 | Queued moves (from Lighten Load) that leave one node at the same time (1 to 10) |
| Minutes Without Progress | 10 | A copy with no progress, or unknown to the old node, for this long is cancelled and counts as a failed try (2 to 120) |
| Minutes to Finish | 20 | A fully sent copy the new node has not confirmed after this long is cancelled the same way (5 to 240) |

## Permissions

| Permission | Kind | Allows |
|---|---|---|
| `settings.transfer` | Server (subusers) | The Transfer page: moving the server and cancelling its move |
| `servers.transfer` | Admin role | Moving servers from Admin › Servers, and cancelling transfers |
| `nodes.transfers` | Admin role | Lighten Load |
| `nodes.read` | Admin role | Admin › Overview › Capacity |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `settle_transfers` | Every 15 seconds | Settles finished copies, retries failed ones, cancels stalled ones and starts queued moves |

## Notes

- The server's activity log gets `server:transfer.request` (with the location), then one entry per
  step, each tagged with the move: `server:transfer.attempt`, `.attempt-failed`, `.verified`,
  `.port-variable`, `.complete`, `.restart`, `.restart-failed`, `.cancel`, `.cancelled` and `.fail`.
  The Transfer page shows the last 40 as the move's timeline.
- Wings does not report when it stops the server or starts copying, so those steps show on the
  progress card only, not in the timeline.
- Lighten Load logs `node:lighten`, and an admin's move logs `server:transfer` in the admin activity
  log.
- A move's address changes: the host name follows the node, and direct connections need the new
  address.
- Locations with a tier stay locked for users until their membership unlocks the tier, with or
  without noprofit.space.
