---
title: Queue
description: The start queue that sends every server start through a short wait, one at a time per node and only while the node is under its load line, with Plus priority and a move to a quieter node (plugged-host-queue).
sidebar:
  order: 8
---

plugged-host-queue puts every server start on a short waiting page and sends it for the user:
after a minimum wait, one start at a time per node, and only while the node is under its load
line. It never waits longer than a hard cap. Users with Plus go ahead of everyone without it,
and PlusPlus goes to the front. The waiting page can also offer to move the server to a quieter
node. Starts are queued, not server creation: placing new servers on nodes is
[Servers](/plugins/servers/)' job.

## What it does

- **Catches Start and Restart** from the console and the server list, and neo's power tool,
  through core's start chain. The chain asks three gates in order:
  [Limbo](/plugins/limbo/)'s restore, then this queue, then the [Ads](/plugins/ads/) start gate.
  The first gate that takes a start owns it. The queue takes every start of a user who isn't
  exempt and has no pass; the node is not measured on the click, only at release. Nothing
  reaches Wings until it is released. The client API, schedules and Wings' own crash restarts
  are not intercepted.
- **The waiting page** in the server panel (not in the sidebar). It shows the user's place in
  line, how long they have waited and the latest time the start will go out. It explains which
  resource is over the line, shows the Plus offer or the user's priority, and offers the
  quieter-node move. It has a **Cancel and go back** button. While a start waits, anyone who
  opens a page of that server is sent to the waiting page. Only users who may start or restart
  the server can cancel.
- **Ads on the waiting page.** With [Ads](/plugins/ads/) enabled, the page registers as an ad
  interstitial and carries the same ad stack as the ad-funded start room: the leaderboard, the
  rest of the banner pool, the native unit and the waiting-room scripts. Which of them appear
  follows the Ads plugin's **Start Gate — Waiting Room Ads** switches. Ads decides who sees them,
  so PlusPlus and exempt roles see none. The ad-funded start room itself (the start gate)
  belongs to the Ads plugin.
- **Line order.** Priority first (2 = PlusPlus, 1 = Plus, 0 = everyone else), then arrival time,
  per node. Buying Plus while waiting moves the user up, never past someone at the same level
  who arrived first.
- **Release.** An entry is released, and its power action sent as the user, when either:
  - it has waited the **maximum wait**, whatever the node looks like; or
  - it has waited the **minimum wait**, the node is under the line on every resource in **What
    counts as busy**, no other start was released on that node within the **gap between
    releases**, and nobody is ahead of it on that node.
- **Every start waits a little, even on a quiet node.** With the defaults, a start waits about
  10 seconds (the minimum wait), and starts on one node go out at most one per 20 seconds (the
  gap between releases). Set `START_QUEUE_MIN_WAIT` to `0` to release starts on a quiet node at
  once (the user passes through the waiting page and lands on the console), lower
  `START_QUEUE_RELEASE_INTERVAL` to reduce the spacing, or turn the queue off.
- **Works with the tab closed.** The scheduler sweeps every line once a minute and sends the
  start for the user. The page only makes it faster (it polls every few seconds).
- **No second wait.** After a release, the next starts of that server by that user skip both
  this queue and the Ads start gate for **Skip both waits for** minutes.
- **Move to a quieter node.** The server's owner can move the server instead of waiting. This is
  offered on the waiting page, always the user's choice and never automatic. With
  [Servers](/plugins/servers/) installed, the move runs through its transfer system: live
  progress on the Transfer page, retries on the next candidate, and the server starts on its own
  when it arrives. The queue entry is cancelled, not released.
- **Activity log**: `server:queue.enqueue`, `server:queue.release` and `server:queue.timeout`.
- **Client API**: `GET /api/client/servers/{server}/queue` returns `waiting`, `position`,
  `wait_remaining` and `node_slot_free`.

### Who never waits

- Root admins.
- Members of the Ads plugin's exempt roles (`ADS_EXEMPT_ROLES`), while **Exempt roles skip the
  queue** is on.
- A user with an open pass for that server (the minutes after a release).

PlusPlus removes ads, but it doesn't skip the queue. It puts the user at the front instead.

### What counts as busy

The queue measures each node live from Wings (memory used / total, CPU %, disk used / total)
against **Busy threshold** (`START_QUEUE_THRESHOLD_PERCENT`, 85% by default). It checks only the
resources listed in **What counts as busy** (memory and CPU by default). Disk is allowed but not
recommended: a full disk doesn't empty itself while someone waits, so that line would never
move.

The same threshold is the line for [Servers](/plugins/servers/)' deployment pauses (10 points
lower on small nodes). That holds even when this plugin is disabled. A value outside 1-100, set
by hand in `.env`, counts as 85 in both places.

A node that doesn't answer counts as not busy, so its starts go out after the minimum wait.

### The quieter-node offer

The offer only shows when all of these are true:

- **Offer the move** is on, and the user is the server's owner.
- The owner has Plus or PlusPlus (unless **Plus required** is off).
- The server's disk limit is below **Hide the offer at or above** and is not unlimited.
- The server has a primary allocation and can be transferred right now. With Servers installed,
  its transfer rules apply too, including the cooldown between moves.

Candidate nodes are viable public nodes that are not over the line themselves, not over the
disk placement line, and not under a deployment pause. They are ranked by their busiest
resource. With **Same location only** on, only nodes in the same location (and tier) count,
and a node with no location tag gets no offer.

## Requirements

- `plugged_host.requires`: `plugged-host-core`, `plugged-host-servers`.
- `plugged_host.optional`: `plugged-host-economy` (Plus and PlusPlus priority; without it nobody
  has priority and the Plus offer is hidden), `plugged-host-ads` (ads on the waiting page, and
  the exempt-role list).
- The scheduler, for the per-minute sweep. See
  [Queue worker and scheduler](/panel/queue-and-scheduler/).
- The `start_queue_entries` table (run the migrations). `start_queue_priorities` holds the
  priority passes the queue used to sell; nothing new is written to it.

## Setup

1. Run the migrations:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan migrate --force
   ```

2. Review Admin › Plugins › plugged.host Queue › Settings. The defaults work as they are.
3. Check the line:

   ```bash
   sudo -u www-data php artisan plugged-host:queue-sweep --status
   ```

## Settings

Admin › Plugins › plugged.host Queue › Settings. Every value is stored in the panel's `.env`.
Labels that name Plus start with your panel's name (`APP_NAME`).

### Start queue

| Setting | Default | What it does |
|---|---|---|
| Queue starts, `START_QUEUE_ENABLED` | `true` | On: every start of a user who isn't exempt and has no pass goes through the waiting page. Off: starts go straight through, and the next sweep releases everyone still waiting (they asked for a start, so they get it). |
| Queue restarts too, `START_QUEUE_INCLUDE_RESTART` | `true` | Restart is held as well. The server keeps running while the user waits; the restart is sent on release. |
| Exempt roles skip the queue, `START_QUEUE_EXEMPT_ROLES_SKIP` | `true` | Members of the Ads plugin's exempt roles skip the queue. Root admins always skip. |
| What counts as busy, `START_QUEUE_PRESSURE_DIMENSIONS` | `memory,cpu` | Comma-separated: `memory`, `cpu`, `disk`. Unknown words are dropped on save; an empty list means `memory,cpu`. |
| Busy threshold, `START_QUEUE_THRESHOLD_PERCENT` | `85` | A node above this (%) on any listed resource releases nobody until it is back under, except entries at the maximum wait. Also the deployment-pause line in Servers. 1-100. |

`START_QUEUE_PACED_ON_UNAVAILABLE` (the old **Pace nodes that cannot be read** switch) is no
longer read. A leftover line in `.env` does nothing and can be deleted.

### Timing

| Setting | Default | What it does |
|---|---|---|
| Minimum wait, `START_QUEUE_MIN_WAIT` | `10` | Seconds every queued start waits at least before it can be released, even on a quiet node. 0-300. |
| Maximum wait, `START_QUEUE_MAX_WAIT` | `600` | Seconds after which the start goes out whatever the node looks like. 10-3600, and always above the minimum (raised on save). |
| Gap between releases, `START_QUEUE_RELEASE_INTERVAL` | `20` | Seconds between two releases on the same node, so a line of starts never lands on a node all at once. Entries at the maximum wait ignore it. `0` turns it off. |
| Drop silent entries after, `START_QUEUE_STALE_AFTER` | `180` | Seconds without the waiting page open after which an entry is dropped, but only if its start no longer means anything: the server is gone, the action was a restart, or the server is already running. Other silent entries still get their start. `0` turns it off. |
| Skip both waits for (minutes), `START_QUEUE_PASS_MINUTES` | `10` | After a release, this user's next starts of that server skip the queue and the Ads start gate (the gate pass is at least 1 minute). 0-1440. |

### Moving off a busy node

| Setting | Default | What it does |
|---|---|---|
| Offer the move, `START_QUEUE_TRANSFER_ENABLED` | `true` | Shows the quieter-node offer on the waiting page. Independent of the Servers plugin's `TRANSFERS_ENABLED`. |
| Plus required, `START_QUEUE_TRANSFER_REQUIRE_PRIORITY` | `true` | Only owners with Plus or PlusPlus get the offer. Off: anyone waiting can move. |
| Hide the offer at or above, `START_QUEUE_TRANSFER_MAX_DISK` | `3072` | Disk limit in MiB at or above which the offer is hidden. `0` means no size limit. Servers with unlimited disk never get the offer. |
| Same location only, `START_QUEUE_TRANSFER_SAME_LOCATION` | `true` | Only nodes in the server's current location. Off: any viable node, which can be another continent. |

The disk placement line, `NODES_STORAGE_PERCENT`, lives in the [Servers](/plugins/servers/)
settings. The quieter-node offer reads it from there.

## Commands

All run as `sudo -u www-data php artisan <command>` from `/var/www/pelican`.

| Command | What it does |
|---|---|
| `plugged-host:queue-sweep` | Releases every entry whose node has room or whose maximum wait is over, then drops abandoned silent entries. This is what the scheduler runs. |
| `plugged-host:queue-sweep --status` | Prints the settings and one row per waiting entry with its place, wait, and why it is still held: `min wait`, `node hot (memory)`, `spacing`, `not first` or `ready`. Changes nothing. |
| `plugged-host:queue-sweep --release` | Releases every waiting entry now, whatever the nodes look like. Use it for a bad measurement or before node maintenance. Entries are released (started), not cancelled. |
| `plugged-host:queue-refund-priority-passes [--dry-run]` | One-off from the move to Plus: closes old priority passes still running and refunds their tokens. On a new panel it finds nothing. |

On the scheduler: `plugged-host:queue-sweep` every minute, never two at once.

## Notes

- Because the queue comes before the Ads start gate and opens the gate's pass on release, the
  ad-funded start room rarely shows while the queue is on. With
  **Queue restarts too** off, restarts go to the start gate instead. Users still see ads on the
  queue's waiting page.
- There is no admin screen for the line. `--status` is the way to see it.
- A released entry sends the power action as the user and checks their permission again first.
  If the node refuses, the user lands on the console and can press Start again.
- The waiting page text says "This node is busy right now" even when the wait is only the
  minimum wait.
