---
title: Creating servers
description: How users create their own servers from your games, locations and plans, within their account's allowance.
---

Users create their own servers from the dashboard: they name the server, pick a game, a location
and a size (a plan, or their own CPU, memory and disk) and accept the game's EULA when it has one.
The panel picks a node, takes free ports, creates the server and starts it once it is installed.
What an account may create in total is its **allowance**. The feature is off until an admin turns it
on; until then only admins create servers, from Admin › Servers.

## What it does

### The create page

**Create server** above the server list opens it. One section each:

- **Details**: the Server Name (1 to 191 characters), filled with a random word. The dice draws
  another.
- **Game**: a card per game in the catalog, with its icon (a gamepad without one), name and
  description.
- **Server software**: only for a game with several software choices whose server has no setup of
  its own to ask it later (Minecraft asks in its setup instead, see [Minecraft](/games/minecraft/)).
- **Location**: a card per public location with its flag, the visitor's own ping, and its tier pill
  (Free, the first membership's name for `plus`, or Premium). A location that cannot take the
  server says **Full** (no node takes new servers) or **No capacity for the selected resources** (no
  node has room for the size picked). A locked location shows "Get" and the membership's name,
  linking to the membership page. Until the user picks a location themselves, the closest one
  that can take the server is selected.
- **Resources**: the public plans, then CPU (%), Memory and Disk Space inputs. A plan fills the
  inputs in. A plan that does not fit what is left says "Exceeds your remaining allowance". The
  locations are asked again for the chosen size half a second after it changes.
- **EULA**: for games whose egg has the `eula` feature, ticked by default.
- **Deploy server**: says why the server cannot be deployed yet (allowance or server limit, game,
  location, name, EULA). Ctrl/Cmd+S deploys too. The new server opens on its console.

### Plans

A plan is a server size users pick from: a name, a description, CPU (percent of one thread: 100
is one thread), memory and disk (MiB), a sort order and whether users see it. Users may also
type their own CPU, memory and disk instead, within their allowance. Deleting or changing a plan
changes no existing server: the plan only filled in the size it was created with.

### Games and software

The catalog in Admin › Settings › Hosting › Games lists what users can pick, in order. Each game is
an egg with an optional name, description and icon. A game can have **software choices**: each has
a value (written to the game's software variable, such as `purpur`), a label (`Purpur`), and
optionally its own startup command and image. A startup command or image may name one of the egg's
own commands or images (such as `Java 21`); otherwise it is used as written, and without one the
egg's first is used. The first choice is the default. A game without a variable or choices runs what
its egg sets up.

### Allowance

- Without noprofit.space, every account's limit is the games settings' **Allowance per Account**
  (CPU, memory, disk; 0 is no limit on that resource), plus what the account bought in the
  [Resource Store](/economy/credits-and-tokens/) and its [Discord tier](/discord/integration/) while
  it is in your Discord server. Both extras only add to a resource that has a limit.
- What is used is the sum of the servers the account owns. A new server must fit in what is left.
- **Servers per Account** caps how many servers an account owns (0 is no limit).
- A create and a resize of the same account never run at once, so two requests cannot spend the
  same room.
- When an account's limit goes down, its servers shrink by themselves: see
  [Allowance cuts](/servers/allowance-cuts/).

### What happens on create

1. The panel checks that creating is on, the account is not suspended, the name is valid and the
   account's [standing](/safety/standing/) allows creating (admins are never limited).
2. It checks the game, the EULA, the software choice, that the location is public and its tier is
   unlocked for the account, and that the size fits the allowance (each value at least 1).
3. It ranks the location's nodes as an admin deploy does ([placement](/nodes/placement/)), using only
   nodes with the role **Game**. On the first node with free ports it takes the ports the egg
   configuration deploys, else a port inside the deployment port ranges, created when the node has
   no free one. FiveM and Multi Theft Auto get two ports in a row, the second written to its
   variable ([allocations](/nodes/allocations/)). When no node fits, the error says why: every node
   paused, full, in maintenance, or no free ports.
4. The server is created with the software choice, the plan's limits and the games settings' limits
   for every new server, and starts after its install. A Minecraft server is created without its
   install and opens its setup instead, which installs and starts it.
5. With the EULA accepted, `eula.txt` (`eula=true`) is written into the server before its first
   start.

The ports a server is created with are locked: the user cannot remove them. The account's activity
log gets `server:create`.

### Location ping

The ping on the location cards is the visitor's own. The browser opens up to four nodes' Wings
addresses per location (over HTTPS), leaves out the first request (connection setup) and keeps the
fastest of the next three. A location's ping is its fastest node's. Nodes in maintenance are left
out, and a node that does not answer shows no ping. The Transfer page and the limbo page use the
same ping.

## Requirements

- At least one public location with nodes whose role is **Game** (Admin › Nodes › a node). Internal
  and limbo nodes are never picked for users.
- Ports: an egg configuration with a deployment (Admin › Egg Configurations), or the **Deployment
  Port Ranges** in Admin › Settings › Hosting › Placement. See [Allocations](/nodes/allocations/).
- The `eula` egg feature for games that need a EULA.
- For the ping: the nodes' Wings addresses reachable over HTTPS from users' browsers. Without
  that, the cards show no ping and nothing else changes.
- Stock Wings is enough for creating servers.

## Setup

1. Admin › Locations: mark the locations users may use as **Public**. Set a **Tier** (`plus` or
   `premium`) on a location that only members may use, or leave it empty for everyone.
2. Admin › Nodes: give the nodes users' servers go to the role **Game**.
3. Admin › Plans: create the sizes users pick from and mark them **Public**. Sort Order sets their
   order, lowest first.
4. Admin › Settings › Hosting › Games: under **Games**, click **Add Game**, pick an egg, and fill in
   the name, description and icon users see. For software choices, set the **Software Variable**
   and add each choice with **Add Software**.
5. In the same tab, set **Every New Server** (ports, databases, backups, schedules) and **Allowance
   per Account**.
6. Turn on **Players Create Servers** and save.

The save refuses an egg listed twice, two choices with the same value, choices without a software
variable, and an icon that is not a link.

## Settings

### Admin › Settings › Hosting › Games

| Setting | Default | What it does |
|---|---|---|
| Players Create Servers | off | Turns the create page on |
| Players Resize Servers | off | Owners change their servers' CPU, memory and disk within their allowance ([server settings](/servers/server-settings/)) |
| Players Delete Servers | off | Owners delete their own servers ([server settings](/servers/server-settings/)) |
| Servers per Account | 0 | Servers an account may own; 0 is no limit (0 to 1000) |
| Moving Servers | | See [Moving servers](/servers/moving-servers/) |

**Every New Server**: what each new server may have.

| Setting | Default | What it does |
|---|---|---|
| Allocations | 1 | Ports (1 to 100); never fewer than the ports its deployment takes |
| Databases | 0 | 0 to 100 |
| Backups | 0 | 0 to 100 |
| Schedules | 0 | 0 to 100 |

**Allowance per Account**: what all servers of an account may use together, without noprofit.space.

| Setting | Default | What it does |
|---|---|---|
| CPU (%) | 0 | Percent of one thread; 0 is no limit |
| Memory | 0 | MiB; 0 is no limit |
| Disk | 0 | MiB; 0 is no limit |

Lowering these shrinks the servers of accounts that are then over them
([allowance cuts](/servers/allowance-cuts/)).

**Games**: one entry per game.

| Field | What it does |
|---|---|
| Egg | The egg the game runs; each egg once |
| Name | What users see; empty uses the egg's name |
| Description | Shown on the game's card |
| Icon | A link (`https://…` or `/…`) to the card's picture; empty shows a gamepad |
| Software Variable | The egg variable the chosen software is written to, such as `MC_SOFTWARE` |
| Software › Value | Written to the variable, such as `purpur` |
| Software › Label | What users see, such as `Purpur` |
| Software › Startup Command | Empty uses the egg's default |
| Software › Image | Empty uses the egg's default |
| Software › Description | Shown under the choice on a server's Settings › Version |

### Admin › Plans

| Field | What it does |
|---|---|
| Name, Description | What users see |
| CPU (%) | Percent of one CPU thread: 100 is one thread, 200 two |
| Memory, Disk | MiB |
| Sort Order | Order on the create page, lowest first |
| Public | Users can pick the plan |

## Permissions

| Permission | Kind | Allows |
|---|---|---|
| `servers.deploy` | Account (API keys) | Creating servers within the account's allowance |
| `plans.read`, `plans.create`, `plans.update`, `plans.delete` | Admin role | Admin › Plans |

## Notes

- Location tiers: `plus` opens with the first membership (or the second), `premium` with the second
  only. Any other tier stays closed to users. See [Credits and tokens](/economy/credits-and-tokens/).
- A user cannot create while another create of the same account is still running; the second one
  is refused until the first finishes.
- Two creates that take the same port at the same moment: the loser picks again, up to three times.
- With noprofit.space connected, each account's allowance is its plan there, and an account without
  a plan cannot create servers; the Allowance per Account values are not used. See
  [noprofit.space](/accounts/noprofit/).
