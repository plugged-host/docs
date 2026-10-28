---
title: FiveM
description: The FiveM and RedM pages users get (frameworks, players, server.cfg as a form, artifacts, GTAV Enhanced), the FiveM egg and image, and how to set them up.
---

FiveM and RedM servers get their own pages in the server's sidebar: **Frameworks** (txAdmin's
recipes, installed in one click), **Players** (who is on the server now), **Server
Configuration** (the `server.cfg` txAdmin runs, as a form), **Artifacts** (the FXServer build and
how it updates) and **GTAV Enhanced** (the switch to FiveM for GTAV Enhanced). Server owners use the
pages; admins import the FiveM egg, add it to the games catalog and choose the image and whether
Enhanced is offered.

## What it does

### Which servers

A server is a FiveM server when its egg has the `cfx` feature (see [Eggs](/nodes/eggs/)). Other
servers do not show the pages. RedM uses the same egg: a server whose `server.cfg` sets
`gamename rdr3` is a RedM server. It gets RedM's game builds and recipes, and no Enhanced edition.

### How the build reaches the server

The panel never downloads FXServer. The FiveM image does: its `fivem-runtime` runs at install and
at every start, and keeps the server's `alpine/` folder on the build two egg variables ask for:

| Variable | Values | Set by |
|---|---|---|
| `FIVEM_VERSION` | `recommended` or `latest` (every start installs that channel's current build), or a build number (stays on it) | The Artifacts page |
| `FIVEM_EDITION` | `legacy` or `enhanced` | The GTAV Enhanced page |

Changing the build or the edition sets the variable, moves the server onto the image from
Admin › Settings › Hosting › FiveM when it is not on it yet, and restarts the server when it runs
and the user may restart it (`control.restart`). Otherwise the change applies at the next start.
Following a channel never restarts the server.

### Server Configuration

A form over the `server.cfg` txAdmin starts (the one txAdmin's config names, else `server.cfg` in
the server's root). Before txAdmin has set the server up there is none, and the page says so and
links to Frameworks. The sections:

- **Identity**: hostname, project name and description, max players (1 to 2048), locale, server
  icon and tags.
- **Network & build**: the `endpoint_add_tcp` and `endpoint_add_udp` lines (shown only; the
  server's allocations decide them), OneSync (managed by txAdmin) and the enforced game build.
- **Database**: `mysql_connection_string`, as a URI or as `key=value` pairs, with a picker that
  fills it from the server's own MySQL databases (needs `databases.read`).
- **License & API keys**: `sv_licenseKey`, `steam_webApiKey` and `sv_tebexSecret`.
- **Resources** (`ensure` lines; a disabled one is commented out, not removed), **Group
  memberships** (`add_principal`) and **Access control** (`add_ace`), as rows.

**Save changes** rewrites only what changed: a setting keeps its line, comment and quoting, a new
one goes before the first line that loads resources, and an emptied one is removed. Every other line
stays as it was. When the file changed since the form loaded (txAdmin, the file editor or another
tab), the save is refused: reload and change it again. **Edit as text** opens the whole file (needs
`files.read-content` and `files.update`). FXServer reads the file when it starts, so the header has
a restart button (needs `control.restart`; it goes through the [start gates](/starts/start-gates/)).
The activity log records the names of the changed settings, never their values.

### Frameworks

The page (titled **Framework installer**) lists txAdmin's own recipe index, the "Popular recipes"
txAdmin's setup shows, for the server's game (FiveM or RedM), with each recipe's name, version,
author and description. The list is cached for 10 minutes, and the last good copy for a day.

**Install** asks what txAdmin's deployer asks: a server name, the Cfx license key (filled in from
the current `server.cfg` when the user has `fivem.config`) and, for a recipe that needs one, a
database: a new one from the server's database slots, or one of the server's MySQL databases. One
install per server runs at a time, in the background:

1. **Prepare**: a new folder `txData/<Name>_<XXXXXX>.base` (txAdmin's naming), the new database if
   asked for, and txAdmin's recipe variables (server name, license, 48 slots, the server's port,
   the database's details).
2. **Tasks**: the recipe's steps in order, while the server keeps running. The node does the
   downloads and file work; the panel edits small text files and runs the recipe's SQL as the
   database's own user. Each step has the recipe's timeout, 60 seconds to 30 minutes.
3. **Config**: the variables in the new `server.cfg` are filled in.
4. **Restart**: the server stops (killed after a minute), txAdmin is pointed at the new folder, the
   server moves onto the FiveM image when one is set, and it starts again.

The page shows each step with a progress bar. A finished install says where the new and the
previous files are, and how to register a txAdmin admin when txAdmin has none yet.

Nothing is lost: the folder txAdmin ran before is not touched. A failed install removes the new
folder and the database it created, and txAdmin keeps running the previous folder. An install that
has not moved for 40 minutes (its panel restarted under it) counts as failed.

### Players

The panel asks FXServer's own HTTP endpoints on the game port (`/dynamic.json` and
`/players.json`, the ones the server browser reads), at the primary allocation's alias, else its
IP, else the node's address. The page refreshes every 12 seconds and on **Refresh**: online or
offline with the player count, a search by name, server id (`#12`) or identifier, and each
player's ping (amber from 150 ms). FXServer leaves identifiers out unless
`sv_exposePlayerIdentifiersInHttpEndpoint` is set. A server that does not answer shows as "not
answering".

### Artifacts

What Cfx offers comes from Cfx's changelog API and download page, cached for 10 minutes, with the
last good answer kept for a day so a bad minute at Cfx shows the last list instead of an empty page.

The page shows what is installed and since when, the build the next start installs when it
differs, and the update switch: **Follow Recommended**, **Follow Latest** or **Stay on this
build**. Below it, every Linux build Cfx still serves, with Recommended, Latest, Installed and Out
of support badges. **Install** on a build pins `FIVEM_VERSION` to it and restarts the server (when
it runs and the user may restart it). While a server runs Enhanced, the switch and builds are hidden
(Enhanced always runs Cfx's current Enhanced build).

### GTAV Enhanced

Listed on every FiveM server. With **FiveM for GTAV Enhanced** off, the page says Enhanced is not
available yet and offers no switch. On, it warns that Enhanced is early access at Cfx and offers
the switch, with a confirmation. Switching sets `FIVEM_EDITION` and restarts like a build change.
Going back to Legacy is always offered. A RedM server gets a note that RedM has no Enhanced edition.

## Requirements

- **An egg with the `cfx` feature.** The [FiveM / RedM egg](/nodes/eggs/) in the panel repository
  has it, with `FIVEM_VERSION` and `FIVEM_EDITION`. An egg from elsewhere may mark FiveM with a
  `cfx` tag, which the import does not keep: add `cfx` to the egg's Features. An egg without
  `FIVEM_VERSION` shows Artifacts read-only; one without `FIVEM_EDITION` cannot move to Enhanced.
- **The FiveM image** the egg names (`ghcr.io/plugged-host/fivem`), pullable on every node. An image
  of your own must carry the same `fivem-runtime`, which installs the build and writes the marker
  the Artifacts page reads (`alpine/.plugged-host.json`).
- **Two ports per server**: the game port and txAdmin's web port (`TXHOST_TXA_PORT`). A server a
  user creates gets two ports in a row and the second goes into that variable
  ([allocations](/nodes/allocations/)). For a server an admin creates, add a second allocation and
  put its port in `TXHOST_TXA_PORT`.
- **For frameworks with a new database**: a MySQL database host that takes new databases, linked
  to the server's node or its location, and a database limit above what the server has. Servers
  users create get **Databases** from Admin › Settings › Hosting › Games › Every New Server, 0 by
  default.
- **The panel reaches each server's game port** over HTTP, for the Players page.
- **Outbound HTTPS from the panel** to `changelogs-live.fivem.net`, `docs.fivem.net` and
  `raw.githubusercontent.com` (txAdmin's recipe index and recipes). The nodes download FXServer
  builds and recipe files themselves.
- **For Enhanced**: nodes that allow `io_uring` to containers. Its txAdmin needs it, and Docker's
  default seccomp profile forbids it.

## Setup

1. Import the FiveM / RedM egg into a nest, for example one called FiveM (see [Eggs](/nodes/eggs/)).
2. Open the egg in Admin › Nests and set the hidden variable **Hosting Provider Name**
   (`TXHOST_PROVIDER_NAME`, default `example.com`) to your own name. txAdmin shows it as the hosting
   provider. It takes 2 to 16 letters, digits, dots, dashes or underscores, no spaces: the start
   line passes it unquoted.
3. In Admin › Settings › Hosting › Games, **Add Game** and pick the egg. It needs no software
   choices.
4. In Admin › Settings › Hosting › FiveM, set **Image** to the image the egg names when servers of
   other FiveM eggs should move onto it (they do when their build or edition changes, or a framework
   installs). Leave it empty when every FiveM server comes from this egg.
5. Leave **FiveM for GTAV Enhanced** off until your nodes allow `io_uring`.
6. For frameworks that need a database, add a MySQL database host in Admin › Database Hosts with
   **Deployment Enabled**, link it to the nodes or their location, and raise the users' database
   limit.
7. Give subusers the FiveM permissions they need (below).

## Settings

### Admin › Settings › Hosting › FiveM

| Setting | Default | What it does |
|---|---|---|
| Image | empty | The image FiveM and RedM servers run on, one word like `ghcr.io/example/fivem:latest`. Servers move onto it when their build or edition changes or a framework installs. Empty leaves servers on their egg's image. |
| FiveM for GTAV Enhanced | off | Lets users switch their servers to the Enhanced edition. Turn it on once the nodes allow `io_uring`. Switching back to Legacy is always possible. |

## Permissions

Server permissions, for subusers:

| Permission | Allows |
|---|---|
| `fivem.config` | Server Configuration: reading and changing `server.cfg` through its form, the license key and database password included. |
| `fivem.players` | Players: seeing who is on the server. |
| `fivem.artifacts` | Artifacts and GTAV Enhanced: choosing the FXServer build and edition. Restarting for the change also needs `control.restart`. |
| `fivem.frameworks` | Frameworks: installing a framework, which can create a database and restarts the server. A new database also needs `databases.create`, an existing one `databases.read`. |

## Notes

- `server.cfg` changes apply when FXServer restarts.
- Frameworks install into a new folder and never touch the previous one. Old framework folders stay
  in `txData/` until someone deletes them.
- The Players page only sees what FXServer publishes on its game port, which is public by design.
- With the Enhanced setting on but an egg without `FIVEM_EDITION`, the GTAV Enhanced page says
  Enhanced is not available yet.
