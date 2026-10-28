---
title: Backups page and deleted servers
description: The account's Backups page with the newest backup of every server, and how a deleted server's last system backup is kept for its owner.
---

Account › Backups lists the newest backup of each of the user's servers, and of the servers they
deleted in the last days, each with a download. The copies are the panel's own backups: regular
backups, and the **system backups** a system backup policy takes. When a server is deleted, its
newest system backup stays downloadable for a few days, in case the deletion was a mistake. Users
see the page; admins set up the system backups and the hold.

## What it does

### The page

The heading "Server backups", then **Your servers**: one row per server the user owns (not
suspended), newest server first. A row shows the server's name, its game, node and `#id` (a click
copies the ID), and the state of its newest finished, successful backup, system or not:

| State | Status line | Actions |
|---|---|---|
| A backup exists | "Backup ready", its size and age | Download, Manage, Backups |
| No backup yet | "Waiting for the first copy from the node" | Manage, Backups |

With no live server, the section says "No active servers found on this account."

**Deleted servers** follows while the user has one held: the servers they, an admin or the
suspension purge deleted, most recently deleted first, with "Deleted …", "Kept until …", the size
and **Download**. A deleted server's line shows the node that took the copy, without the game.

- **Download** asks for a link as the server's own backup download does: a presigned S3 link, or a
  link to the node that holds the backup (that node must be up). The button reads "Starting…",
  then "Downloading, see your browser", and ignores clicks for 30 seconds so a second click does not
  start a second download.
- The server's Backups page has an **Off-site Backups** button (for the owner) that opens this page
  with that server's row highlighted.
- The page is the owner's: subusers do not see other people's servers here.
- Users also see the system backups on the server's System Backups page, read-only.

### Deleted servers

Every server deletion (by its owner, by an admin, by the [suspension purge](/safety/suspension/))
records the server with its successful system backups. A server with no system backup is not
recorded. Then the `purge_deleted_servers` task:

1. removes the recorded server's older system backups at once, keeping the newest;
2. removes the newest one when the hold ends, and closes the record.

Exceptions:

- An owner who deletes their server keeps its system backups for the hold; its other backups go with
  it ([Server settings](/servers/server-settings/#danger-zone)).
- An admin who ticks "delete backups" when deleting removes everything at once. Otherwise the
  server's other backups stay detached (Admin › Nodes › a node › Backups), and the hold still ends
  for the system ones.
- A server that was suspended when it was deleted is recorded, so its copies are removed in time,
  but it is not offered for download.

## Requirements

- A backup configuration whose storage is off the nodes (S3, or restic with a remote repository),
  so a copy survives its node.
- A system backup policy that takes the copies. Without one, the page lists the servers' regular
  backups only, and deleted servers are not held.

## Setup

1. Admin › Backup Configurations: create a configuration that stores backups off the nodes, for
   example S3 (`https://s3.example.com`, a bucket, a key) or restic with an SFTP repository
   (`sftp:backup@storage.example.com:/srv/restic`). Make it the default of every location (or node).
2. Admin › System Backup Policies: create a policy on that configuration that runs every 30 minutes,
   with a retention that keeps about a day of copies (for example the newest 48), on its locations
   or nodes.
3. Admin › Settings › Hosting › Recovery: set **Keep Deleted Servers' Backups (Days)**.

See the [Calagopus documentation](https://calagopus.com/docs/) for backup configurations and system
backup policies themselves.

## Settings

### Admin › Settings › Hosting › Recovery

| Setting | Default | What it does |
|---|---|---|
| Keep Deleted Servers' Backups (Days) | 7 | How long a deleted server's newest system backup stays downloadable (0 to 90). 0 records nothing, and an owner's delete removes the system backups too |

## Permissions

API keys need these account permissions for the page:

| Permission | Allows |
|---|---|
| `backups.read` | Listing the account's servers and their newest backup |
| `backups.download` | Downloading those backups |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `purge_deleted_servers` | Every 10 minutes | Removes held servers' older system backups, and the newest one when the hold ends |

## Notes

- A download is logged as `account:backup.download` on the account.
- A copy on a node that is down cannot be downloaded until the node is back. S3 copies do not
  depend on any node.
- The page works the same with or without noprofit.space.
