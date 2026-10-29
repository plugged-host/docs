---
title: Limbo
description: Stop idle servers, then park them in an off-node backup until their owner restores them, and optionally delete them after a while.
---

Limbo frees nodes from servers nobody uses. A server nobody touched for a while is stopped, and
later parked: backed up off its node and removed from it, so the node's disk and room go to servers
people play on. The owner restores it from the server's page, for tokens if you like. Admins turn
limbo on and set the windows; users see a "Server hibernated" page instead of the console. Limbo
is the first [start gate](/starts/start-gates/).

## What it does

### The idle clock

Every server has a last-activity time: the newest action a person took on it, such as a power
action, a console command, a file change, an SFTP login or a changed setting. The panel's own
actions do not count, so a server that only runs schedules is idle. A new server starts its clock
when it is created.

### Who is touched

The `settle_limbo` task runs once a minute while limbo is on and looks at servers that are:

- not suspended, not busy (installing, restoring) and not being moved;
- not owned by an admin;
- not owned by an account with a membership, while Spare Members and memberships are on (Spare
  Members is off by default: members' idle servers are stopped, parked and deleted like
  everyone's);
- not a [devbox](/servers/devboxes/)'s own server;
- not parked already, and not failed to park in the last day;
- not kept awake: a [keep-awake pass](#keep-awake) for the server still runs.

| Idle for | Server | Limbo does |
|---|---|---|
| Stop After (2880 minutes, two days) | running | Stops it and tells the owner ("Server stopped while idle": when it will be parked, and what a keep-awake pass costs while one is sold) |
| Park After (4320 minutes, three days) | off | Parks it |

A node that does not answer is skipped. At most Servers per Minute servers are stopped per run, and
at most that many parks run at once. Any activity by a person makes a stopped server an ordinary
server again.

### Parking

1. A final backup is made with the server's backup configuration, and locked. It has to leave the
   node (see [Requirements](#requirements)). A server whose backups stay on its node, or whose
   backup configuration is in maintenance, is never parked.
2. Once the backup is done, Wings deletes the server from the node. Its allocations, subusers,
   databases and backups stay in the panel. The node's disk is freed and the server no longer counts
   toward the node's room for placement, moves and resizes. [Node failover](/nodes/failover/)
   leaves it alone, as nothing of it is on the node.
3. A park that cannot finish is cancelled and the server stays where it is: the backup was deleted,
   failed, or did not finish within 6 hours. The error is kept and the server is tried again after a
   day. After 3 failed parks in an hour and none that worked, parking pauses until the hour is over.

Starting the server while it is being parked cancels the park: the server stays and the backup
becomes an ordinary, unlocked backup.

### Restoring

A start of a parked server is held, and every page of the server shows the limbo page instead: when
it was parked, the restore cost next to the user's token balance, and **Restore server** behind
a confirmation. While the server is being parked the page offers **Keep server**, which cancels the
park.

A restore:

1. Costs tokens: Early Restore within Early Window hours of parking, Late Restore after. Admins pay
   nothing, and nobody pays while tokens are off. The tokens are spent in the same step that claims
   the server, so a restore cannot be paid twice.
2. Goes back to the server's own node, with its old address, when that node answers and has room.
   Otherwise the page asks for a location: one the owner may create servers in, with room. The
   server then gets new allocations there (made inside the deployment port ranges when none are
   free, see [allocations](/nodes/allocations/)) and a new address; its backups come along.
3. Creates the server on Wings without installing it, then restores the final backup into it. When
   that is done the server is an ordinary server again, its idle clock restarts and the backup is
   unlocked.

A restore that fails (Wings does not create the server within 15 minutes, or the backup does not
restore) removes the half-made copy, parks the server again, gives the tokens back and shows the
error on the page.

The server list shows Being Parked, Parked and Being Restored instead of the usage meters.

### Deleting parked servers

With Delete After (Days) above 0, a server parked for that many days, without a running keep-awake
pass, is deleted with its files. Its
backups, the final one included, go to the deleted servers' hold like any deleted server's, so the
owner can still download the newest one until the hold ends ([backups](/servers/backups/)). The
limbo page says when the server will be deleted, and a restore is refused once that time has
passed. A restore under way stops the clock. A suspended server is left alone: its
[suspension](/safety/suspension/)'s deletion time is the only one it has.

Deleting runs every minute, 20 servers at a time, even while limbo is off.

### Keep awake

A keep-awake pass ([server upgrades](/servers/server-upgrades/), 3 tokens for 7 days by default,
sold only while limbo is on) keeps the server from being stopped, parked or deleted as idle while
it runs. It is offered where limbo is felt:

- the "Server stopped while idle" notification names its price, with **Keep it awake**, which opens
  the server's Settings › Upgrades;
- the console of a server limbo stopped offers it while the server is off;
- a parked server's limbo page offers it too. There it keeps the server from being deleted, and
  from being parked again once it is restored.

### Activity

Server activity: `server:limbo.stop`, `server:limbo.parking`, `server:limbo.park`,
`server:limbo.restore` (with the node and cost), `server:limbo.restored`,
`server:limbo.restore-failed`. The token history shows "Server restored" and "Restore refunded".

## Requirements

- **A backup configuration that keeps backups off the node.** Limbo makes the final backup with
  the server's backup configuration: the server's own, else its node's, else its location's. Only
  these count as off the node:

  | Backup Disk | Counts when |
  |---|---|
  | S3 | always |
  | Proxmox Backup Server | always |
  | Restic | the Repository is not a local path (it does not start with `/`), for example `s3:` or `sftp:` |

  Local, Ddup-Bak, Btrfs, ZFS, Kopia and a Restic repository on a local path keep the backup on the
  node, which limbo is about to empty, so servers using them are never parked. This is the same rule
  [node failover](/nodes/failover/) uses.
- Tokens (Admin › Settings › Economy › Tokens) for paid restores and keep-awake passes. Without
  them restores are free and no pass is sold.
- Memberships for Spare Members.

## Setup

1. Create an off-node backup configuration: Admin › Backup Configurations › Create, Backup Disk
   **S3**, **Proxmox Backup Server**, or **Restic** with a repository that is not a local path.
   Use the configuration's test to check it from a node.
2. Give it to the servers: pick it as the Backup Configuration of the locations (or nodes) whose
   servers limbo may park. A server's own backup configuration (Admin › Servers) wins over its
   node's, and the node's over the location's.
3. Admin › Settings › Hosting › Recovery: set **Keep Deleted Servers' Backups (Days)** if you will
   use Delete After, so owners can still download a deleted server's last backup.
4. Admin › Settings › Hosting › Limbo: set **Stop After** and **Park After**, the restore prices,
   and turn on **Park Idle Servers**. Save.
5. Watch the first parks: a test server left idle should show `server:limbo.stop`, then
   `server:limbo.parking` and `server:limbo.park` in its activity.

## Settings

### Admin › Settings › Hosting › Limbo

| Setting | Default | What it does |
|---|---|---|
| Park Idle Servers | off | Turns limbo on |
| Stop After (Minutes) | 2880 | A running server nobody used for this long is stopped. 1 to 525600 |
| Park After (Minutes) | 4320 | A stopped server nobody used for this long is backed up and removed from its node. 1 to 525600 |
| Servers per Minute | 3 | How many servers are stopped, and how many are parked, each minute at most. 1 to 100 |
| Spare Members | off | On: servers of accounts with a membership are never stopped or parked. Off: they are stopped, parked and deleted like everyone's |
| Delete After (Days) | 0 | A server parked this long is deleted with its files. 0 never deletes. Up to 3650 |

### Restoring

| Setting | Default | What it does |
|---|---|---|
| Early Restore (Tokens) | 5 | What a restore costs soon after parking. 0 is free |
| Late Restore (Tokens) | 10 | What a restore costs after that. 0 is free |
| Early Window (Hours) | 72 | How long after parking the early price applies. 0 to 8760 |

## Permissions

Limbo adds no permissions. The limbo page and Restore server need `control.start` or
`control.restart` on the server.

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `settle_limbo` | every minute | Stops and parks idle servers, moves parks and restores along, deletes servers parked past Delete After |

Background tasks run only on the panel instance with `APP_PRIMARY=true`. Parks and restores under
way are finished even after limbo is turned off; nothing new is started then.

## Notes

:::caution
Delete After deletes a parked server's files for good. The owner keeps only the backups in the
deleted servers' hold, for as long as Admin › Settings › Hosting › Recovery keeps them.
:::

- A parked server still counts against its owner's allowance: it keeps its resources.
- Upgrading to 3.0.4 turns Spare Members off, whatever it was set to. Turn it on again if members'
  idle servers should keep running.
- Changing an account's CPU (burst cores, an [allowance cut](/servers/allowance-cuts/)) fails for
  its parked servers; the change applies when they are restored.
- Parked servers stay on their node in the panel, so deleting that node needs them moved or deleted
  first, like any other server.
- A restore to another location changes the server's address. Users have to update anything that
  pointed at the old one.
- [Abuse scans](/safety/abuse/), Lighten Load and system backup policies leave parked servers
  alone: there is nothing of them on a node.
