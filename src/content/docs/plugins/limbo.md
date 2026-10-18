---
title: Limbo
description: Idle-server hibernation that stops servers nobody uses, parks them on a limbo node and lets owners restore them for tokens.
sidebar:
  order: 7
---

plugged-host-limbo frees node capacity held by servers nobody uses. A server with no activity
for two days is stopped; one that stays idle is moved to a dedicated limbo node and suspended
there. Its owner gets it back with one button on a restore page, for a few tokens. The plugin
ships switched off (`LIMBO_ENABLED=false`): it does nothing until you turn it on.

## What it does

- **Idle clock.** A server's last activity is the newest entry in its activity log, whoever
  caused it: the owner, a subuser or an admin (console commands, file changes, SFTP, power
  actions), and system events too (a crash, a scheduled backup, a transfer, limbo's own stop).
  A server with no entries counts from its creation. Opening the console logs nothing, so it
  does not count.
- **Stop.** Once a server has been idle for `LIMBO_STOP_HOURS` (48), the sweep stops it and logs
  "stopped for being idle" on the server. Nothing has moved yet: the owner can start it again as
  usual, which clears the marker.
- **Park.** A server limbo stopped that stays idle for `LIMBO_TRANSFER_HOURS` (72) is moved to
  the limbo node with Pelican's own transfer, then suspended there once the transfer has landed.
  The stop itself is logged on the server and resets the idle clock, so with the defaults a
  server is moved about 72 hours after it was stopped.
- **Restore.** The owner of a parked server who opens its Console lands on a restore page instead,
  showing when it was hibernated, the cost and their token balance, with one **Restore server**
  button. A start from the server list goes there too. Restoring charges the tokens, unsuspends the
  server and moves it back; the page shows the move and opens the Console when it has arrived.
- **Way home.** A restore goes to the server's old node on its old ports when they are all still
  free (same address as before), else to free ports on the old node, else to a node with exactly
  the same tags (same location and tier). When none has room, the owner picks one of their own
  locations with room, and the address changes.
- **Reconcile.** A transfer finishes in the background, so every sweep first settles moves Wings
  has reported on: landed on the limbo node means parked; a failed move hands the server back
  unsuspended on its own node and retries after 24 hours; a failed restore refunds the tokens
  and parks the server again. This runs even while limbo is switched off, so a move in flight
  when you switch it off still lands or is undone.
- **Smaller moves.** Before a move, the files the storage agent leaves out of its copies
  (caches, logs, `node_modules`, virtualenvs, ...) are deleted from the server, because a Wings
  transfer cannot skip them. Folders named `alpine`, `libraries` and `src`, and everything under
  them, are kept, and a folder holding source code is never deleted. The deleted files do not
  come back on restore.
- **Safety limits.** At most `LIMBO_MAX_PER_RUN` (3) moves to the limbo node at once (and stops
  per sweep). No new moves while the limbo node's disk is used past `LIMBO_MAX_DISK_PERCENT`
  (85). When the last three moves to the limbo node all failed, none start for an hour after the
  latest failure, then one at a time until one lands.
- **Client API.** `GET /api/client/limbo` (the caller's servers in limbo),
  `GET /api/client/limbo/{server}` and `POST /api/client/limbo/{server}/restore` (owner only).

What the sweep leaves alone: system servers (devboxes), servers with an unlimited disk (`0`),
servers that are installing, suspended, transferring or restoring a backup, servers on a node in
maintenance mode, servers already on a limbo node, and servers Wings does not report as offline.
It only moves a server it stopped itself.

A server's way through limbo:

| State | Meaning |
|---|---|
| `stopped` | Stopped for being idle, still on its own node. Starting it clears the marker. |
| `hibernating` | On its way to the limbo node. |
| `limbo` | Parked on the limbo node and suspended. Only the owner's restore brings it back. |
| `restoring` | On its way back after the owner paid. |
| `restored` | Back on a live node. The idle clock starts over. |
| `failed` | The move to the limbo node failed; the server is untouched on its own node and is tried again after 24 hours. |

### How it uses storage

- The limbo node is looked up through plugged-host-storage: the first node, by id, with the
  `LIMBO_NODE_TAG` tag.
- The files deleted before a move are the storage agent's own exclude list.
- The limbo node is usually the storage box running Wings. When the node's FQDN is the host of
  the storage agent's address, the agent mirrors parked servers as hard links to their volume
  instead of keeping a second copy, and removes Wings volumes a move away left behind on it. See
  [Storage box](/storage/storage-box/#if-the-box-is-also-a-wings-node).
- Failover never moves a server to a limbo node, and leaves parked (suspended) servers where
  they are.
- `LIMBO_MAX_DISK_PERCENT` stops parking before the disk is so full that the storage agent stops
  copying (its own floor is 10% free).

### Moving the limbo node

Each parked server remembers the node it was parked on. To move limbo, tag the new node and
remove the tag from the old one: new servers are parked on the new node, and the ones on the old
node stay parked there with their restore page and their way home. A node that has parked servers
counts as a limbo node until they are gone: no server there is hibernated again and no restore
goes to it. `plugged-host:limbo-sweep --status` names the limbo node and every node servers are
parked on, with their disk use.

## Requirements

- `plugged_host.requires`: `plugged-host-core`, `plugged-host-servers`.
- `plugged_host.optional`:
  - `plugged-host-storage`: finds the limbo node and supplies the exclude list. Without it
    there is no limbo node, so nothing is ever parked.
  - `plugged-host-economy`: charges and refunds the restore cost. Without it no restore can
    succeed, even at a cost of 0.
  - `plugged-host-ads`: shows the restore page as an ad interstitial.
- A Wings node for parked servers, tagged `limbo` (or your `LIMBO_NODE_TAG`), with enough disk
  and enough free allocations: each parked server needs as many free ports on one IP as it has
  allocations.

## Setup

1. Run the plugin's migrations: `sudo -u www-data php artisan migrate` (in `/var/www/pelican`).
   Until the `server_limbo_states` table exists, limbo does nothing.
2. Set up the limbo node. On the storage box, follow
   [If the box is also a Wings node](/storage/storage-box/#if-the-box-is-also-a-wings-node).
3. In Admin › Nodes, give it the tag `limbo`, and none of the tags in the servers plugin's
   deployment tags (`UCS_DEPLOYMENT_TAGS`, see [Servers](/plugins/servers/)) and no country code,
   so new servers are never created on it.
4. Create allocations on it: a range of ports on one IP, enough for every server you expect to
   park.
5. Preview: `sudo -u www-data php artisan plugged-host:limbo-sweep --status`. It names the limbo
   node and lists the servers it would stop and move, without touching them.
6. Turn it on: Admin › Plugins › plugged.host Limbo › Settings › **Enable hibernation**.

## Settings

Admin › Plugins › plugged.host Limbo › Settings.

### General

| Setting | Default | What it does |
|---|---|---|
| Enable hibernation `LIMBO_ENABLED` | `false` | The master switch. While off, the sweep only settles moves already in flight. |

### Hibernation schedule

| Setting | Default | What it does |
|---|---|---|
| Stop after (hours) `LIMBO_STOP_HOURS` | `48` | Hours without activity before a server is stopped (1 to 8760). |
| Transfer after (hours) `LIMBO_TRANSFER_HOURS` | `72` | Hours without activity before a server limbo stopped is moved to the limbo node (1 to 8760). Counted from the stop, which is itself activity. |
| Limbo node tag `LIMBO_NODE_TAG` | `limbo` | The tag that marks the limbo node. Not a country code, and not one of the deployment tags. |
| Max transfers at once `LIMBO_MAX_PER_RUN` | `3` | Servers on their way to the limbo node at the same time, and the most servers one sweep stops (1 to 1000). |
| Limbo node disk limit (%) `LIMBO_MAX_DISK_PERCENT` | `85` | No new moves while the limbo node's disk is used past this, from core's node telemetry (0 to 99; 0 turns the check off). |

### Restore cost

| Setting | Default | What it does |
|---|---|---|
| Early restore cost (tokens) `LIMBO_COST_EARLY` | `5` | Tokens for a restore within the cost window after the server was parked. |
| Late restore cost (tokens) `LIMBO_COST_LATE` | `10` | Tokens for a restore after the window. |
| Cost window (hours) `LIMBO_COST_WINDOW_HOURS` | `72` | Hours after parking during which the early cost applies (1 to 8760). |

### Only in .env

| Setting | Default | What it does |
|---|---|---|
| `LIMBO_PRUNE` | `true` | Delete the storage exclude list from a server before moving it. `false` moves everything. |

## Commands

| Command | What it does |
|---|---|
| `plugged-host:limbo-sweep` | "Stop and hibernate idle servers, and hand hibernated ones to the limbo node." Settles finished moves first. `--status` (or `--dry-run`) names the limbo node and the nodes servers are parked on, and lists what it would do without doing it. |

On the scheduler: `plugged-host:limbo-sweep` every minute. While limbo is switched off it only
settles moves in flight.

## Notes

- Owners are not notified when their server is stopped or parked. Both are logged in the
  server's activity log ("stopped for being idle", "moved into hibernation"), and the restore is
  logged with its cost.
- Only the owner can restore. Subusers and admins keep the normal Console of a parked server.
- Servers parked on the storage box's own node have one copy only: their volume on that box. The
  [backup server](/storage/backup-server/) leaves them out, and failover leaves suspended servers
  where they are, so losing that disk loses them.
- Files deleted before a move are gone for good, as with a failover restore. Turn
  `LIMBO_PRUNE` off if your servers keep data in folders named like caches or logs.
- Run migration 021 (it adds the parked-on node to each server's record) before you move the
  tag to another node. Without it, limbo only knows the tagged node.
- There are no doctor checks for limbo. Use `plugged-host:limbo-sweep --status`.
