---
title: Suspension details
description: What the panel records about a suspended server, what its owner sees, and how servers past their deletion time are deleted.
---

A suspended server is stopped by Wings and its owner and subusers are locked out of it. On top of
that, the panel records why the server was suspended, since when, by whom and until when, shows
this to the owner on the blocked server page, and deletes suspended servers whose deletion time has
passed. Admins set the reason and the deletion time when they suspend; the abuse checks set them by
themselves.

## What it does

### What is recorded

| Field | Holds |
|---|---|
| Suspended By | An admin, the abuse checks, or noprofit.space (the owner's account there was deleted) |
| Reason | Free text, up to 1000 characters, shown to the owner and subusers |
| Since | When the server was suspended |
| Admin | The admin who suspended it, when an admin did |
| Deleted On | When the purge deletes it unless it is unsuspended first; empty means never |

Unsuspending clears all of them. Servers suspended before these fields existed show the plain
"This server is suspended" text.

### Who suspends

- **Admins**: Admin › Servers › a server › Management › Suspend (or the quick action) asks for a
  **Reason** and **Delete the Server**: Never, or after 1, 3, 7 or 30 days. The reason and deletion
  time of a server that is already suspended can be changed the same way. Bulk suspend from the
  server list sets no reason.
- **The abuse checks** ([abuse protection](/safety/abuse/)): with a deletion time from Admin ›
  Settings › Security › Abuse › **Delete After (Hours)**.
- **noprofit.space**, when it is connected and the owner's account there was deleted (see Notes).

An automatic suspension never overwrites a suspension that is already there, so a manual
suspension keeps its own reason and deletion time.

### What the owner sees

The server's pages are blocked. The block says:

- who suspended it and when ("This server was suspended by an administrator on …", or "by the
  automated abuse checks");
- the reason, when there is one;
- with a deletion time: "This server will be deleted in 3 days (date and time), unless the
  suspension is lifted before then.", then "We don't suspend servers by mistake, and your server
  won't be deleted before this date." The time left is rounded down (minutes under an hour, hours
  under two days, then days) and counts down while the page is open. The date is in the viewer's
  language and time zone. Without a deletion time, nothing is said about deletion;
- where to get help: a **Get help** button to the first link that is set of neo's **Human Support
  Link** and Discord's **Invite Link**. With neither set, it says to contact the panel's
  administrators.

### What admins see

A **Suspension** card on the server's Overview in Admin › Servers: suspended by, the admin, since
when, the reason and the deletion date ("Not scheduled" without one). The activity log's
`server:update` entry carries the suspension, its reason and its deletion time.

### The purge

The `purge_suspended_servers` task deletes up to 20 suspended servers whose deletion time has
passed, oldest first, through the regular server delete. It is not forced: a server whose node
cannot delete it is tried again on the next run. The server's backups stay. A deleted server's
newest system backup is held like any deleted server's, but a server that was suspended is never
offered for download ([Backups](/servers/backups/)). When an abuse suspension's server is deleted,
the abuse alert webhook is told.

This deletion time is the only clock a suspended server runs on, so it is never deleted before the
time its owner is shown: [limbo](/starts/limbo/)'s Delete After (Days) skips suspended servers, and
a server suspended without a deletion time stays until it is unsuspended.

## Requirements

Nothing outside the panel. Stock Wings is enough.

## Setup

1. Optional: set a help link for the **Get help** button: Admin › Settings › AI › neo › **Human
   Support Link**, or Admin › Settings › Accounts › Discord › **Invite Link**. The first one set
   is used.
2. Optional: set how long abuse-suspended servers are kept in Admin › Settings › Security › Abuse ›
   **Delete After (Hours)**.

## Settings

| Setting | Default | What it does |
|---|---|---|
| Security › Abuse › Delete After (Hours) | 24 | Hours after an abuse suspension until the server is deleted, unless it is unsuspended or a finding on it is dismissed first. 0 never deletes |
| AI › neo › Human Support Link | empty | First choice for the Get help button |
| Accounts › Discord › Invite Link | empty | Second choice for the Get help button |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `purge_suspended_servers` | Every 5 minutes | Deletes up to 20 suspended servers whose deletion time has passed |

## Notes

:::caution
A deletion time deletes the server with its files once it passes. Choose **Never** when you only
want to stop a server until you have looked at it.
:::

- Unsuspending a server before its deletion time cancels the deletion.
- With noprofit.space connected: when the account sync finds that a user's noprofit.space account
  was deleted, it suspends the panel user and all of their servers, with a deletion time from the
  noprofit.space settings, and deletes the user and their servers (with their backups) once that
  time has passed. If the account comes back first, those suspensions are lifted. A server an admin
  had suspended before keeps its own reason and deletion time, and is deleted with the user. See
  [noprofit.space](/accounts/noprofit/).
