---
title: Allocations
description: How servers get their ports, the deployment port ranges, second ports, ports that follow a moved server, and locked allocations.
---

An allocation is an address and port on a node that a server listens on. The panel makes
allocations by itself when a server needs a port and the node has no free one, inside the
deployment port ranges you set. Games that need a second port get two in a row, egg variables that
hold a port follow the server when it moves, and the allocations a server is created with are
locked so its users cannot remove them. Admins set the ranges and lock or unlock allocations;
users see the result on the server's Network page.

## What it does

### Allocations made when needed

| Who asks | Gets |
|---|---|
| A user's [create](/servers/create-server/), when the egg configuration has no allocation deployment | One port, or two in a row for an egg with a [second port](#second-port) |
| A [move](/servers/moving-servers/), a [failover](/nodes/failover/) or a [limbo](/starts/limbo/) restore, when the server's own port numbers are not all free on one address and the egg configuration does not deploy | As many ports as the server has, its own numbers where it can |
| A user's Add on the Network page, when the egg configuration has no allocation settings | One port |
| The Bedrock (Geyser) port ([Minecraft](/games/minecraft/)) | One port, noted "Bedrock (Geyser)" |
| A devbox's SSH port ([Devboxes](/servers/devboxes/)) | One port |

**The address.** A new allocation gets the address and alias most of the node's allocations
already use. On a node without any it gets `0.0.0.0` (every address of the node) with the node's
host name as alias: its SFTP host, else the host of its Wings URL. A port a user adds uses the
address of the server's primary allocation.

**A free port** is one no server has an allocation on (on that address, or on any address that
overlaps it: `0.0.0.0` overlaps every one), that nothing on the node already listens on, and that no
other pick has reserved. A node that does not answer the listening check gives no new ports, and a
create tries the next node.

| Pick | Takes |
|---|---|
| One port for a new server | A random free allocation inside the ranges, else a new one at a random port of the first range with room |
| Several ports in a row for a new server | The lowest run of free ports in a row that needs the fewest new allocations, ranges in order; else any free ones |
| A move or restore | For each of its ports (primary first) the same number, when an allocation there is free or one can be made inside the ranges; else a free allocation inside the ranges; else a new one |
| A user's added port | The first free one above the primary's port, else the first of the ranges |

Existing allocations are used before new ones are made, so a node keeps the allocations you made by
hand. When the ranges are full, a create says "not enough free allocations", a user's Add says
"every port this node may use is taken", and a move falls back to any free allocation of the node
before it tries another node.

Two creates or moves at the same time never get the same port: picks for one node take turns, and a
picked port stays reserved for 2 minutes while the server claims it.

**Egg configurations come first.** An egg configuration with an allocation deployment (Admin › Egg
Configurations) keeps its own ranges, variables and "user self assign" setting for a user's Add.
The deployment port ranges are for everything without one.

### Second port

A FiveM or RedM egg (egg feature `cfx`) gets its second port in `TXHOST_TXA_PORT` (txAdmin). Any
other egg that declares `TXHOST_TXA_PORT` or `SERVER_WEBPORT` (Multi Theft Auto's resource server)
gets it in that variable. The server is created with two ports in a row, and the second one goes
into the variable. An egg configuration whose deployment writes a variable itself wins.

### Ports that follow the server

When a server moves to other port numbers (a user's move, Lighten Load, a queued move, a failover,
a limbo restore), every egg variable whose name contains `PORT` and whose value is one of its old
ports gets the matching new port: the primary's for the primary, the second's for the second, in
the order of the Network page. An egg configuration's own variables win. A move writes them when it
is done; failover and limbo restores write them with the new node.

A transfer an admin starts by hand from Admin › Servers, with allocations of their choosing, changes
no variable.

### Locked allocations

- Every allocation a server is created with is locked (an admin's create, a user's, a devbox's),
  and so is an allocation an admin adds on Admin › Servers › a server › Allocations. A port a user
  adds is not.
- A locked allocation shows a lock beside its port on the Network page ("Locked: only an admin can
  remove it.") and on the admin page.
- Users cannot remove it: its Remove item is off, a bulk removal skips it, and the API refuses
  with "this allocation is locked, only an admin can remove it".
- Admins remove it on Admin › Servers › a server › Allocations, and lock or unlock it from the row's
  menu (**Lock** / **Unlock**). The admin activity log records the change.
- A move, failover or limbo restore gives the new allocations the lock and notes of the ones they
  replace.

### Network addresses

The server's Network page shows each allocation's host name (its alias, else its IP) and, dimmed in
brackets, the IP address users reach it on: what the shown host resolves to, else what the node's
host name resolves to, else the allocation's IP when it is not `0.0.0.0`. Nothing is added when that
is the shown text itself. For example: `play.example.com (192.0.2.10)`. Lookups take at most 5
seconds and are remembered for 5 minutes. Streamer mode hides the IP like the address.

### Defaults when you add allocations by hand

The "Create allocations" dialog on a node's Allocations tab, and the allocations made when a node is
paired, default to the IP `0.0.0.0` with the node's name as alias: its SRV target, else the host of
its public URL, else of its URL. Users then see a name that keeps working when the node's address
changes. Both stay editable.

## Setup

1. Open Admin › Settings › Hosting › Placement.
2. Under **Ports**, set **Deployment Port Ranges**: ranges and single ports from 1024 up, comma
   separated, earlier ones used first. For example `25565, 27015-27030, 30000-50000`.
3. Save. New allocations the panel makes come from these ranges; existing allocations stay.

## Settings

### Admin › Settings › Hosting › Placement › Ports

| Setting | Default | What it does |
|---|---|---|
| Deployment Port Ranges | `30000-50000,25000-30000` | Ports the panel makes new allocations on when a node has no free one: for a new server, a move, a restore or a port a user adds |

The ranges only decide where the panel makes allocations by itself. You can still create any
allocation by hand on a node's Allocations tab.

## Permissions

| Permission | Gives |
|---|---|
| `servers.allocations` | Adding, removing, locking and unlocking a server's allocations in Admin › Servers |
| `nodes.allocations` | Creating and deleting a node's allocations by hand |
| `settings.update` | Changing the deployment port ranges |

## Notes

- A saved value that can no longer be read counts as the default.
- Ports below 1024 are refused: they are left to the node's own services.
- Allocations only talk to the nodes and the database. They work the same with or without
  [noprofit.space](/accounts/noprofit/).
