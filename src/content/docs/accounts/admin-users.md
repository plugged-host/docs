---
title: Admin › Users
description: What the panel adds to the user admin: deleting a user together with their servers, and the Discord column and search.
---

Admin › Users is the panel's list of accounts. On top of Calagopus's user admin, the panel lets an
admin delete a user together with the servers they own, and shows each user's linked Discord
account in a column you can search. Only admins see this page.

## What it does

### Deleting a user with their servers

A user who owns servers cannot be deleted on their own: the panel answers "user has servers, cannot
delete". The delete confirmation (Admin › Users › a user › Delete) has two switches for that:

- **Delete their servers too**: deletes every server the user owns, with its files, before the
  user. Shown to admins who may delete servers.
- **Do you want to execute this deletion forcefully?** (shown when the first is on): deletes the
  servers from the panel even when their node cannot be reached, like a server's own force delete.

If a server cannot be deleted (without the force switch), the delete stops there with that server's name. The
servers deleted before it stay deleted, and the user stays. Their backups are handled as for any
deleted server ([Backups](/servers/backups/)).

The admin activity log's `user:delete` entry lists the servers deleted with the user.

### Discord column and search

Admin › Users, and a role's Users tab, have a **Discord** column: the name of the user's linked
Discord account. Hovering it shows the Discord id; clicking copies the id. The search also finds
users by their Discord id (exact) or by part of their Discord name.

The Discord account is the one the user linked in Account › OAuth Links through the provider chosen
for Discord ([Discord integration](/discord/integration/)), with the name the member check last saw.

## Requirements

- For the Discord column: a Discord OAuth provider set up as described on
  [Discord integration](/discord/integration/). Without it the column stays empty.

## Permissions

| Permission | Gives |
|---|---|
| `users.read` | Admin › Users, with the Discord column and search |
| `users.delete` | Deleting a user |
| `servers.delete` | Also needed for **Delete their servers too** |

## Notes

:::danger
**Delete their servers too** deletes the servers' files on the nodes and cannot be undone. With the
force switch, a server whose node is down is removed from the panel while its files stay on that
node.
:::

- With [noprofit.space](/accounts/noprofit/) connected, users are created by signing in through it
  (Admin › Users has no Create button), and a linked user's username and email are managed there
  and shown disabled; everything else stays editable. The Discord column then shows the Discord
  account linked on noprofit.space.
