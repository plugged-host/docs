---
title: FiveM
description: plugged-host-fivem adds FiveM pages to the server panel, including server.cfg as a form, one-click frameworks from txAdmin's recipes, a live player list, artifact updates and GTAV Enhanced.
sidebar:
  order: 5
---

`plugged-host-fivem` gives FiveM (and RedM) servers their own pages in the server panel: the
server's `server.cfg` as a form, one-click frameworks from txAdmin's official recipes, a live
player list, a choice of FXServer build with automatic updates, and a switch to FiveM for GTAV
Enhanced. The build itself is laid down by the FiveM image (`ghcr.io/plugged-host/fivem`) at
every server start. The pages only set what the image should install.

## What it does

The pages appear on servers whose egg carries the `cfx` tag (the same rule plugged-host-servers
and the subdomains plugin use), so an imported or second Cfx egg is picked up without naming an
egg id.

- **Server configuration.** The `server.cfg` txAdmin runs (found through
  `txData/default/config.json`, not assumed at the server root) as a form:
  - identity: hostname, project name, description, max players, locale, tags, server icon;
  - network and build: the enforced game build; the endpoints and OneSync are shown read-only,
    because the panel owns the port and txAdmin owns OneSync;
  - database: the `mysql_connection_string`, filled from one of the server's databases with one
    click, as a URI or `key=value`;
  - keys: the FiveM license key, a Steam Web API key and a Tebex secret, hidden until shown;
  - resources (`ensure` lines; disabling one comments it out), group memberships
    (`add_principal`) and access control (`add_ace`).

  Only the lines that changed are written, so comments, order and commands the form does not
  know stay as they are. A save is refused when the file changed since the page loaded (txAdmin's
  editor, the file manager, a framework install). **Edit as text** edits the whole file.
- **Frameworks.** Whatever txAdmin's recipe index lists for the server's game: on FiveM, for
  example ESX Legacy, QBCore, Qbox, vMenu and the plain Cfx server; on RedM, VORP and the plain
  RedM server (RedM is recognised by its `server.cfg`). The owner gives a server name, the Cfx
  license key (prefilled from the current `server.cfg`) and, for recipes that need one, a
  database: a new one from the server's database slots, or one it already has. The recipe runs
  into a new folder, `txData/<Name>_<HEX>.base`, while the server keeps running. Then the plugin
  fills in `server.cfg`, stops the server, points txAdmin at the new folder and starts it again.
  The previous folder is left untouched, and the page names it. A failed install removes the
  half-built folder and the database it created. The owner gets a notification either way.
- **Players.** Who is online, read from FXServer's own `/dynamic.json` and `/players.json` on the
  game port (the endpoints the server browser reads), refreshed every 12 seconds. Searchable by
  name, server id or identifier. FXServer only includes identifiers when the owner sets
  `sv_exposePlayerIdentifiersInHttpEndpoint`.
- **Artifacts.** Every Linux FXServer build Cfx still offers, with Cfx's own support dates and the
  Recommended and Latest marks. The owner picks **Follow Recommended** (the default), **Follow
  Latest** (each start installs the channel's current build if it changed) or **Stay on this
  build**. Installing a build from the list pins it and restarts a running server so it applies
  now.
- **GTAV Enhanced.** Switches a server between FiveM (Legacy) and FiveM for GTAV Enhanced, a
  separate server build for the separate Enhanced client. Server files, `txData` and the database
  are not touched either way. The page shows the installed edition next to the requested one, so a
  switch that could not complete is visible. RedM servers get a note instead. Switching **to**
  Enhanced is off by default (`FIVEM_ENHANCED`); switching back to Legacy is always allowed.
- **The FiveM image.** `ghcr.io/plugged-host/fivem` is both the egg's install container and the
  servers' image. At every start it keeps the server's `alpine/` folder on what the egg
  variables `FIVEM_VERSION` and `FIVEM_EDITION` ask for, straight from Cfx, and records the build
  in `alpine/.plugged-host.json` for the panel. See [The FiveM image](/nodes/fivem-image/).
- **Egg setup command.** `plugged-host:fivem-setup` puts the cfx eggs, and optionally every FiveM
  server, on the image. In the egg's image list it appears as "`<APP_NAME>` FiveM".

Subuser permissions: Players needs none beyond access to the server. Server configuration needs
file read and read content (file update to save). Frameworks needs file read, read content,
create and delete, plus restart; creating a database also needs the database create permission.
Artifacts and GTAV Enhanced need startup read (startup update to change). Changing a build or
edition restarts the server only for users with the restart permission; otherwise it applies at
the next start.

## Requirements

- Requires [plugged-host-core](/plugins/core/). No optional plugins.
- **A FiveM egg tagged `cfx`** that runs FXServer under txAdmin (the usual FiveM egg does). Add
  the tag in Admin › Eggs if your egg does not have it.
- **The FiveM image on the nodes.** The default `ghcr.io/plugged-host/fivem:2.2` must be pullable
  by Wings, or you build your own. See [The FiveM image](/nodes/fivem-image/).
- **A queue worker** for framework installs (see [Queue and scheduler](/panel/queue-and-scheduler/)).
- **A database host linked to the node** for frameworks that need a database (ESX, QBCore, Qbox),
  and servers with database slots. See [The FiveM image › Framework databases](/nodes/fivem-image/#framework-databases).
- **Outbound HTTPS** from the panel to `changelogs-live.fivem.net` and `docs.fivem.net` (the build
  lists), `raw.githubusercontent.com` (the recipe index and recipes) and GitHub (framework
  sources). The panel also calls each FiveM server's game port over plain HTTP for the player
  list, at the allocation's alias or the node's FQDN.

## Setup

1. Enable the plugin in Admin › Plugins.
2. Run the egg setup, dry run first, then for real with the servers:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan plugged-host:fivem-setup --servers --dry-run
   sudo -u www-data php artisan plugged-host:fivem-setup --servers
   sudo -u www-data php artisan plugged-host:doctor plugged-host-fivem
   ```

3. Restart one FiveM server and watch its console for `[plugged.host] Downloading FiveM legacy
   build …` and `… installed`. The `[plugged.host]` prefix comes from the image, whatever your
   panel is called.

The full guide, including what the command changes on the egg, pre-pulling the image and rolling
back, is [The FiveM image](/nodes/fivem-image/).

## Settings

The plugin has no settings tab. Set these in the panel's `.env` (see
[Configuration](/panel/configuration/)):

| Setting | Default | What it does |
|---|---|---|
| `FIVEM_IMAGE` | `ghcr.io/plugged-host/fivem:2.2` | The image FiveM servers install and run in. `plugged-host:fivem-setup` writes it into the cfx eggs and servers. A leading `~` tells Wings to use a local image without pulling. |
| `FIVEM_RECIPE_INDEX` | `https://raw.githubusercontent.com/tabarra/txAdmin-recipes/main/indexv4.json` | txAdmin's recipe index. The Frameworks page offers what it lists for the server's game, and only recipes from this index ever run. |
| `FIVEM_ENHANCED` | `false` | Lets owners switch servers to FiveM for GTAV Enhanced. Leave it off until your nodes allow io_uring (see Notes). |

Fixed values in `config/plugged-host-fivem.php`, with no `.env` key: Cfx's changelog API and
download page (the two build lists), the cache time for those lists and the recipe index
(600 seconds), and the player list refresh (12 seconds).

## Commands

| Command | What it does |
|---|---|
| `plugged-host:fivem-setup` | Puts the cfx eggs on the FiveM image: the image first in the egg's images (named "`<APP_NAME>` FiveM"), the plugin's install script running in that image, the `FIVEM_VERSION` and `FIVEM_EDITION` variables, and SIGINT as the stop signal. Safe to run again. |
| `plugged-host:fivem-setup --servers` | Also moves every FiveM server that is not on the image onto it. Each server picks it up at its next start. |
| `plugged-host:fivem-setup --dry-run` | Shows what would change and changes nothing. |

Nothing runs on the scheduler. Framework installs run as a chain of queued jobs: each one works
through the recipe's tasks for about 50 seconds and then queues the next, so a recipe of many
downloads never holds a worker for long.

## Doctor checks

- **FiveM eggs on the image**: every egg tagged `cfx` installs with the configured image and has
  the `FIVEM_EDITION` variable. Fails with a pointer to `plugged-host:fivem-setup`. Says "no cfx
  egg" when there is none.
- **FiveM servers on the image**: how many FiveM servers still run another image. Those get no
  artifact updates. Warns with a pointer to `plugged-host:fivem-setup --servers`.

## Notes

- **Run the setup again after any egg import or update.** Importing the egg puts its old install
  script and stop command back.
- **The first start on the image downloads the build again** (about 70 MB from Cfx), because the
  old egg left no record of what it installed. `txData`, resources and databases are not touched.
- **Stops use SIGINT.** txAdmin ignores the egg's usual `quit` while it has no server running, so
  stops used to wait out Wings' stop timeout. The image also turns off core dumps, because
  FXServer crashes harmlessly while it shuts down on SIGINT and would otherwise leave a large core
  file on every stop.
- **GTAV Enhanced needs io_uring.** The txAdmin bundled with FiveM for GTAV Enhanced hangs at
  start when the container may not use io_uring, and Docker's default seccomp profile (Docker 25
  and later) blocks `io_uring_setup`, `io_uring_enter` and `io_uring_register`. Turning it on
  means a custom seccomp profile on every node that allows those three syscalls, which widens
  every container's kernel attack surface. That is why `FIVEM_ENHANCED` is off by default. Until
  it is on, the GTAV Enhanced page explains what would change without offering the switch.
- **Enhanced always runs Cfx's current build.** Cfx publishes only one Enhanced build, so
  `FIVEM_VERSION` and the Artifacts page apply to Legacy only.
- **Framework sources from GitHub are relayed by the panel.** Wings' downloader refuses responses
  without a Content-Length, and GitHub's source archives come without one. The panel downloads
  them into `storage/app/plugged-host-fivem` and uploads them to the node, so keep a few hundred
  MB free on the panel during installs. Everything else in a recipe the node downloads itself.
- **Your panel's name.** The pages name the panel by `APP_NAME`: under the build and framework
  lists ("`<APP_NAME>` does not host or change them") and on the GTAV Enhanced page while it is
  off ("not available on `<APP_NAME>` yet"). Framework installs mark the endpoint lines they
  write into `server.cfg` with `# <APP_NAME>: do not modify!`, a note for people; nothing reads
  it. Only the image's own console lines say `[plugged.host]`, because the image does not know
  the panel's name.
