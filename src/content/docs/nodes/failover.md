---
title: Node failover
description: How a down node's servers are restored on the other nodes of its location from their newest off-node backup, by hand, automatically or as a drill.
---

When a node is down, its servers can be restored on the other nodes of its location from their
newest backup on storage those nodes reach. An admin starts it from the node's **Failover** tab, or
the panel starts it on its own after an outage (or only reports the outage). A **drill** does the
same for one server of a node that is up, to check the setup; a **preview** shows what a failover
would do without doing anything. Admins run it; server owners get a notification with the new
address.

## What it does

### Failover, drill and preview

Admin › Nodes › a node › Failover lists the node's last 10 failovers with each server's status, new
node, the backup used and when the old copy was removed. It refreshes every 15 seconds while a
failover runs.

| Button | Does |
|---|---|
| Preview | Lists each server of the node with the node a failover would put it on and the backup it would restore, or why it would fail. Changes nothing |
| Fail Over | Starts a failover of every server on the node |
| Drill | Restores one server on another node of the location. The server is stopped on this node first and stays on the new node afterwards |
| Cancel Failover | Stops a running failover. Servers not moved yet stay on this node; servers being moved or restored finish on their new node |
| Try Again | Under a failed server: puts it back into its failover ([below](#try-again)) |

The preview picks like the failover: another node of the location with the same role that answers,
is not paused and has the memory and disk left, least loaded first, counting the servers placed
before it. The failover itself adds placement's randomness and checks the ports when it moves a
server, so it may choose another node of the same location. Servers parked in limbo and devboxes
are left out of both.

### How a server moves

Each failover moves **Servers Restored at Once** servers at a time. A server goes through these
states:

| State | What happens |
|---|---|
| Queued | Waiting for its turn |
| Moving | The newest successful off-node backup is picked. A node that still answers (a drill, a failover by hand) stops the server first. The best node of the location takes the server: the same ports when they are free there, else others ([Allocations](/nodes/allocations/)), with port variables and locks following. The server's off-node backups move with it. That node's Wings creates the server without running its install script |
| Restoring | The backup is restored there, into an emptied server directory. The server stays stopped |
| Restored | Done. The owner gets a "Server recovered" notification with the new address and the time of the backup |
| Failed | The error says why: no backup, no node with room, Wings could not restore, or a timeout (10 minutes to create, 6 hours to restore). A server that failed before it moved is still on the old node |
| Cancelled | Cancelled before it moved, or deleted meanwhile |
| Would Move | Only in a report: where a failover would put the server. Nothing moved |

Files changed after the backup are lost. A server that got other ports has a new address; its owner
sees it on the server's page as usual.

### After the node is back

When the old node answers again, the panel removes each restored server's old copy there (the
[Wings fork](/nodes/wings/) unloads the server and deletes its files and container) and fills in
**Old Copy Removed**. A server that was moved back to the old node in the meantime is left alone.

A node that rebooted does not start the old copies: Wings loads its servers from the panel, which
lists them on their new node. A node that only lost its network may keep running them until the
cleanup.

### Try Again

**Try Again** on a failed server puts it back into its failover, which runs again until it is done:

- A server already on its new node (it failed while restoring) goes back to Moving, and its backup
  is restored again. The backup must still exist.
- A server still on the old node starts over as Queued, with a new backup and node picked.

It is refused for a deleted server, a server that is on a third node now, or when another failover
of the node is running.

### Automatic failover

With **Node Failover** set to automatic, the panel starts a failover for a node that has been
unreachable for **Automatic Failover After (Minutes)** checks in a row (one check a minute), when:

- no other failover is running (one at a time, the longest-gone node first);
- at least half of the other nodes answer (when many nodes look down at once, the panel's own
  network is the likelier cause);
- the node was not failed over since it last answered.

Only "unreachable" counts. A node whose machine answers but whose Wings is not listening is not
failed over ([Node telemetry](/nodes/telemetry/)).

### Reporting a down node

The mode **By hand, and report a down node to the admins without restoring** detects a down node the
same way but moves nothing. Once per outage it adds a "Down, Reported" entry to the node's Failover
tab, with every server as Would Move and its planned node (the preview at that moment), writes
`node:failover.notify` to the admin activity log and logs a warning. A report does not count as a
failover: switching to automatic later still fails the node over during the same outage. Failovers
by hand, drills and Try Again work as in the manual mode.

## Requirements

- **Backups off the node.** Only a backup another node can restore counts:
  - **S3**;
  - **Proxmox Backup Server**;
  - **Restic** with a repository that is not a path on the node, such as
    `sftp:backup@backup.example.com:/srv/restic` or `s3:https://s3.example.com/restic`. A
    repository that starts with `/` stays on the node and does not count.

  Backups on Local, Ddup-Bak, Btrfs, ZFS or Kopia are never used. Any finished,
  successful backup of the server's files on such storage counts, the owner's own backups included.
  A server without one fails over with "no finished backup on storage other nodes reach" and stays
  where it is.
- **Another node in the location** with the same role that answers, is not paused, has room for the
  server (memory and disk) and has free ports.
- **The [Wings fork](/nodes/wings/) on the old node** to remove the old copies afterwards. With stock
  Wings the restore works, but the old copy stays: the failover row says "the node runs Wings without
  the fork: remove the server's files there by hand".

## Setup

1. Admin › Backup Configurations: create a configuration whose storage is off the nodes: S3 (an
   endpoint such as `https://s3.example.com`, a bucket and a key), Proxmox Backup Server, or Restic
   with a remote repository.
2. Admin › Locations › each location: set that configuration as the location's backup
   configuration (or set it on each node).
3. Admin › System Backup Policies: create a policy of kind Server on that configuration, with the
   schedule `0 */30 * * * *` (every 30 minutes; cron with seconds, UTC) and a retention that keeps
   about a day of copies, for example the newest 48. Add its locations or nodes on the policy's tabs.
   These are the same copies users download from the [Backups page](/servers/backups/).
4. Wait for a backup of a test server, then open Admin › Nodes › its node › Failover and press
   **Preview**: each server should show a new node and a backup date.
5. Press **Drill** on the test server (drills work in every mode but Off, including the default By
   hand). It shows Moving, Restoring, then Restored; the server is on
   the other node with the backup's files and starts. On a Wings fork node, Old Copy Removed gets a
   time.
6. Admin › Settings › Hosting › Recovery: choose the **Node Failover** mode.

## Settings

### Admin › Settings › Hosting › Recovery

| Setting | Default | What it does |
|---|---|---|
| Node Failover | By hand | **Off**: never, not even by hand (Fail Over, Drill and Try Again are disabled; Preview still works). **By hand, from the node's Failover tab**. **By hand, and report a down node to the admins without restoring**. **Automatically, and by hand** |
| Automatic Failover After (Minutes) | 10 | How long a node must be unreachable before an automatic failover starts, or the node is reported (3 to 1440) |
| Servers Restored at Once | 3 | How many servers of one failover are moved and restored at the same time (1 to 20) |

The tab's **Keep Deleted Servers' Backups (Days)** belongs to the [Backups page](/servers/backups/).

## Permissions

| Permission | Gives |
|---|---|
| `nodes.read` | Seeing the Failover tab and the preview |
| `nodes.failover` | Fail Over, Drill, Cancel Failover and Try Again |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `settle_failovers` | Every 15 seconds | Starts automatic failovers and reports, moves each server along, removes old copies once their node is back |
| `sample_nodes` | Every minute, at second 30 | Counts the checks a node missed ([Node telemetry](/nodes/telemetry/)) |

They run only on the panel instance with `APP_PRIMARY=true`.

## Notes

:::caution
A failover loses every change made after the server's backup. Fail a node over by hand only when it
is down for good or for long, and keep the system backup policy frequent.
:::

- The admin activity log records `node:failover`, `node:failover.cancel`, `node:failover.resume`
  and `node:failover.notify`. Each server's activity gets `server:failover` or
  `server:failover.failed`.
- A failed failover tells the owner ("Server node issue") at most once a day per server, and only
  when the server had already left its node ([Notifications](/accounts/notifications/)).
- A failover's or a drill's restore sends no "installation completed" notification.
- Failover only talks to the nodes and the backup storage. It works the same with or without
  [noprofit.space](/accounts/noprofit/).
