---
title: Minecraft
description: The Minecraft pages users get (plugins and mods, modpacks, Bedrock support, game settings, players, worlds), the setup of a new server, the log check, and how to set them up.
---

Minecraft: Java Edition servers get their own pages in the server's sidebar: **Plugins & Mods**
(with modpacks and Bedrock support), **Game Settings**, **Worlds** and **Players**. A Minecraft
server a user creates starts with a short setup that installs it with the software they pick.
Every Minecraft server, proxies and Bedrock included, gets a **log check** above its console that
names the problems in its latest log. Server owners use the pages; admins import the egg, add it to the
games catalog and choose the content sources.

## What it does

### Which servers get what

The panel decides from the server's egg: its `eula` feature (see [Eggs](/nodes/eggs/)) and whether
the egg configures a `server.properties`.

| Egg | Examples | Gets |
|---|---|---|
| `eula` and a `server.properties` | Paper, Purpur, Fabric, Forge, NeoForge, Vanilla, the Minecraft: Java Edition egg | All Minecraft pages, the setup, Minecraft [subdomains](/servers/subdomains/), neo's Minecraft tools, the log check |
| `eula` without a `server.properties` | Velocity, BungeeCord (proxies) | The log check only |
| A `server.properties` without `eula` | Vanilla Bedrock, PocketMine, Nukkit | The log check only |

A proxy has no worlds, whitelist or plugins of its own to manage, so it gets none of the pages.
Other servers do not show them, and their addresses answer "not found".

What the server runs:

- **The loader** is the server's software choice in the games catalog, else the egg's name. Paper,
  Purpur, Folia, Spigot, Bukkit, Pufferfish and Leaf load **plugins**. Fabric, Quilt, Forge and
  NeoForge load **mods**. A vanilla server has no loader and nothing to install into.
- **The Minecraft version** is the first of the egg variables `MINECRAFT_VERSION`, `MC_VERSION` and
  `VANILLA_VERSION` the server has. `latest` means the newest release the loader has builds for.
  Users change both in the Version section of the server's
  [Settings](/servers/server-settings/), which reinstalls the server.

### Plugins & Mods

The page is titled **Plugins** on a plugin server and **Mods & Modpacks** on a mod loader. Its
header has **Add Bedrock support** (see [Bedrock players](#bedrock-players)) and **Rescan**.

**Installed on this server** lists the jars in `/plugins` or `/mods`. A `.jar.disabled` file is a
turned-off one. Each jar is identified by, in order:

1. its SHA-1 hash, looked up on Modrinth;
2. its CurseForge fingerprint, looked up on CurseForge (with an API key);
3. its own descriptor (`plugin.yml`, `fabric.mod.json`, `mods.toml` and the like), read through
   Wings without downloading the jar, then its name searched on Modrinth and SpigotMC (shown with
   " ~"), else the descriptor alone.

Up to 8 unknown jars are identified per look, and the result is kept for 30 days, so the list fills
in over a few seconds. A row shows the name, version, source, authors and size, and badges for
**Disabled**, an available update (Modrinth's newest build for the loader and version) and **needs
x** (a dependency no installed jar provides). Its actions:

- **Update**: downloads the new build and deletes the old one, keeping it disabled if it was.
- **Enable** / **Disable**: renames the jar to or from `.jar.disabled`.
- **Delete**: with "Also delete its folder" for a plugin's data folder.
- **Identify**: forgets what was remembered about the jar and identifies it again.

A change applies on the next restart.

**The catalog** below it has a search, **Filters** (Source, Type, Minecraft version) and 20 rows
per page:

- Sources: Modrinth always, CurseForge with an API key, SpigotMC on plugin servers when it is on.
- Types: plugins on a plugin server, mods on a mod loader, and **Modpacks** when the server can
  take [one](#modpacks).
- The version filter starts on the server's version and can be cleared for any.
- **1-Click Install** takes the newest release that fits the loader and version. **Versions**
  lists every build, with Modrinth's warning for client-only mods.
- SpigotMC offers only its latest build. Premium and externally hosted SpigotMC resources cannot
  be installed (**External download**).

The node downloads the file itself (Wings' pull) into `/plugins` or `/mods`. Wings runs at most
`limits.server_concurrent_pulls` downloads per server at once (3 by default); the panel retries
for a few seconds when that is full. Searches are cached for 5 minutes, projects and versions for
an hour. A source that fails says "the content source did not answer, try again later".

### Modpacks

**Modpacks** is a type in the catalog. It is offered when the server's game has Fabric, Quilt,
Forge or NeoForge among its software choices, or when the server runs one of them. It searches
Modrinth's and (with a key) CurseForge's modpacks for those loaders.

**Install** needs the server stopped. It asks for the pack's version and whether to **remove the
mods installed now** (on by default). Then, in the background:

1. The panel downloads the pack (at most 256 MB) and reads its file list and overrides.
2. It removes the old mods when asked: to the server's trash when it has one, else deleted.
3. When the server's software or Minecraft version differ from the pack's, it switches them like
   the Version setting does and reinstalls the server, waiting up to 30 minutes. The loader's own
   build is the newest the egg installs for that version.
4. The node downloads the pack's files, three at a time, and unpacks the overrides (configs and
   the like) into the server. Overrides over 256 MB are left out, and the page says to upload them
   in Files.

A file that fails to download (a dead link, or a CurseForge author who forbids downloads by other
apps) is listed as skipped instead of failing the pack. CurseForge files that are not `.jar` (resource
and shader packs, which only clients load) are left out. Paths in a pack never leave the server's
folder.

The page shows the progress above the installed list. When the reinstall starts, the user is
sent to the console, which shows the same progress until the install ends.

:::caution
"Remove the mods installed now" is on by default. Without a trash on the server, the `mods` folder
is deleted, not moved.
:::

### Bedrock players

**Add Bedrock support** (or **Update Geyser** once it is there) lets Bedrock players join a Java
server through Geyser and Floodgate. It is offered on Paper and its forks, Fabric and NeoForge;
Geyser has no build for Quilt or Forge. The dialog says what it installs and the address Bedrock
players join. On confirm:

1. **The port.** The server's allocation noted `Bedrock (Geyser)` is used, else one its Geyser
   config already listens on. Without one, the panel takes a free port the way a user's Add does
   ([allocations](/nodes/allocations/)), adds it to the server with that note, and does not count it
   against the server's allocation limit. Wings opens every allocation for TCP and UDP, so Bedrock's
   UDP traffic gets through. A node with no free port left refuses.
2. **The jars.** Old Geyser and Floodgate jars are deleted. Geyser comes from GeyserMC's download
   API. Floodgate comes from GeyserMC on the Paper family and from Modrinth on Fabric and NeoForge.
   Without a Floodgate build, Bedrock players sign in with a Java account, and the dialog says so.
3. **The config.** An existing Geyser config gets its Bedrock port, the server's port and the auth
   type set, comments kept. Without one, the panel writes a short config and Geyser adds its
   defaults on start.
4. A running server restarts after 5 seconds.

### New server setup

A Minecraft server a user creates ([creating servers](/servers/create-server/)) is created
**without its install**: it stays empty and is not started, and the user lands on **Set up your
server**. Servers an admin creates install and start as usual and have no setup.

While the setup waits:

- Every page of the server sends the owner, admins and subusers with `minecraft.settings` and
  `minecraft.players` to it, and the sidebar shows only **Set up**. A subuser without those
  permissions sees the server's pages as they are.
- Every start and restart is held by the `setup` [start gate](/starts/start-gates/), so a server
  whose setup was never finished stays empty.
- A suspended, moving or parked server, or one on a node in maintenance, shows that screen first.

The steps, with Back and Next:

1. **Server software** (with `settings.software`): the game's software choices and the Minecraft
   version (Latest by default). With `minecraft.content`, a **Modpack** card when the game can run
   a mod loader: popular packs, a search, and Modrinth or CurseForge. A pack brings its own software
   and version.
2. **Bedrock support** (with `minecraft.bedrock`, when the chosen software runs Geyser): yes, or
   Java only (the default).
3. **Player accounts**: premium accounts only (`online-mode=true`, the default) or cracked clients.
4. **Who is it for**: private (the whitelist, the default) or public.
5. **Players**: whitelist names (when private) and operators, up to 20 each.

The install starts as soon as the user leaves the Server software step, while they answer the
rest. Picking again later replaces the pick; an install that already began is always finished
first, so two installs never run at once. **Finish setup** opens the console, which shows each step:
the install, `online-mode`, the whitelist and names (looked up at Mojang in online mode; unknown
names are listed as skipped), Geyser, then the start. A part that fails is listed and the rest is
still applied. A failed install stops it, with "reinstall it from Settings".

While any server installs or reinstalls (not only Minecraft), its sidebar shows only **Console**,
and every other page of the server sends there.

### Game Settings

One tab per settings file the server has written so far:

| Tab | File | Shown on |
|---|---|---|
| server.properties | `server.properties` | Every Minecraft server |
| bukkit.yml | `bukkit.yml` | Plugin servers |
| spigot.yml | `spigot.yml` | Plugin servers |
| paper-global.yml | `config/paper-global.yml`, else `paper.yml` | Plugin servers |
| purpur.yml | `purpur.yml` | Plugin servers |

With no file at all, the page says to start the server once. Files are read up to 512 KB.

- **server.properties** shows every key except the ones the panel manages (`server-ip`,
  `server-port`, `query.port`, `rcon.port`, `rcon.password`), as a switch, a number, a choice or
  text. Numbers and choices are checked before anything is written.
- **The YAML files** show every single-line value by its dotted path, grouped under its top-level
  key. Lists and multi-line values are not shown: **Edit as Text** opens the file in the file editor
  (with `files.read-content` and `files.update`).

**Save** sends only what changed. The panel changes those lines and nothing else: comments, order
and keys it does not show stay as they are. A change applies when the server restarts; the restart
button in the header (with `control.restart`) asks first and goes through the start gates.

### Players

The **Whitelist** section holds **Only allow whitelisted players**, which sets `white-list` and
`enforce-whitelist` together (and runs `whitelist on` or `off` on a running server). In offline
mode it warns that anyone can join under any name.

The table lists everyone on the whitelist, operators (with their level), banned players (with the
reason) and everyone who has played (the first 1000 player files), with a search on name and UUID.
**Add player** takes a Minecraft username and gives access (the whitelist), operator powers, or
both. Each row can whitelist or remove from the whitelist, make or remove an operator, ban with an
optional reason (up to 200 characters) or pardon.

How a change is made:

1. In online mode the name is looked up at Mojang and stored with Mojang's spelling and UUID; an
   unknown name is refused. In offline mode the panel computes the UUID the server would.
2. On a running server, when the user also has `control.console`, the panel sends the command
   (`whitelist add`, `op`, `ban`, `pardon`) and the server writes its own file.
3. Otherwise the panel edits the JSON file the way the server writes it, and the server reads it
   at its next start.

A player's name opens **their details**:

- Health, food and experience, the inventory, armour, off hand and ender chest, position, respawn
  point and last death, game mode and statistics, read from the player's saved data. A running
  server saves it every few minutes and when the player leaves.
- **Heal**, **Feed** and **Kill**: console commands. They need the server running, the player
  online and `control.console`.
- **Teleport** (to coordinates, the world spawn or another player) and the **game mode**: live
  through the console while the player is online, or written into their data file while the
  server is stopped (with `files.update`).
- **Delete player data** (server stopped): experience, inventory, ender chest, the whole data file,
  statistics or advancements (`files.update` for edits, `files.delete` for files).

An edit keeps the previous file as `<uuid>.dat_old`, the game's own backup name. Live changes need
Minecraft 1.13 or newer. Heads and item icons are fetched by the panel, never by the browser.

### Worlds

A world is a folder in the server root with a `level.dat`; the `<world>_nether` and
`<world>_the_end` folders beside it belong to it. At most 12 folders are looked into.

One card per world, the loaded one (`level-name`) first, with its seed, world type, difficulty,
game mode, structures and when it was last saved. The loaded world's actions:

- **Options**: name, seed (empty is random), generator settings, world type, structures and data
  packs, written to `server.properties`. The server generates the world at its next start.
- **Generate**: the same world started over, with a new random seed (the default) or the same one.
- **Upload and replace**: drop an archive (`.zip`, `.tar`, `.tar.gz`, `.tgz`, `.tar.xz`,
  `.tar.zst`). The panel finds the folder with `level.dat` (at the top or up to two folders down)
  and puts it in place of the loaded world. The browser uploads the archive, so the tab has to stay
  open until the upload is done (also needs `files.create`).

These three need the server stopped. **Keep a copy of the current world** (on by default) renames
the loaded world to `<world>-<date>`, which stays a card of its own and can be loaded again.

:::caution
With "Keep a copy of the current world" off, the loaded world is deleted: to the server's trash
when it has one, else for good.
:::

Every card also has **Use this world** (loads it from the next start), **Download** (one zip of
the world and its dimensions; a running server is told `save-all flush` first when the user has
`control.console`), **Files** and **Delete** (not the loaded world).

### Log check

Above the console of every Minecraft server, proxy and Bedrock server, for users with
`control.console` and `files.read-content`. The panel reads `logs/latest.log` (up to 4 MB), or the
console's last 100 lines when there is none (Bedrock writes none). It strips colour codes, masks
secrets (passwords, RCON, tokens, API keys, webhook URLs, Discord bot tokens and common key formats)
and uploads the log to [mclo.gs](https://mclo.gs), which also strips IP addresses. mclo.gs's
analysis names the problems and a suggested fix for each.

- A log is uploaded only when it changed: a running server's at most every 2 minutes, a stopped
  server's (the crash) right away. The result is kept 24 hours and shared by everyone watching.
- A clean log shows one quiet line with a link. Problems show as a card with up to three problems
  and their fixes, and a link to the whole log.
- **Ask neo to fix it** shows when [neo](/ai/neo/) is on and the user has the server's `neo.access`.
  It opens a neo chat on that log.

### Thread limit notice

Eggs with the `pid_limit` feature get a dialog when the console prints that the server cannot
create a thread (`pthread_create failed`, `unable to create new native thread` and the like), once
per run. Admins read "Memory or process limit reached" with the Wings setting to raise
(`container_pid_limit` under `docker` in Wings' `config.yml`, then restart Wings). Everyone else
reads the error to pass on to an admin.

## Requirements

- **An egg** with the `eula` feature that configures `server.properties`. The
  [Minecraft: Java Edition egg](/nodes/eggs/) in the panel repository is made for these pages: one
  egg for Purpur, Fabric, Forge and NeoForge. Other Minecraft eggs work too; the setup and modpacks
  switch software only through a game's software choices.
- **The game in the games catalog** with a software variable and choices, for the setup's software
  step and for modpacks that switch the loader.
- **The Wings fork** for reading inside jars. On stock wings-rs, jars are identified by their hashes
  only.
- **A CurseForge API key** (optional) for CurseForge as a source. Without it, Modrinth and SpigotMC
  remain.
- **Outbound HTTPS from the panel** to the services it asks: `api.modrinth.com`, `cdn.modrinth.com`,
  `api.curseforge.com`, `api.spiget.org`, `cdn.spiget.org`, `fill.papermc.io`, `api.purpurmc.org`,
  `meta.fabricmc.net`, `files.minecraftforge.net`, `maven.neoforged.net`,
  `launchermeta.mojang.com`, `download.geysermc.org`, `api.geysermc.org`, `api.mojang.com`,
  `sessionserver.mojang.com`, `textures.minecraft.net`, `api.mclo.gs`, `minecraft.wiki` and
  `assets.mcasset.cloud`, plus the download host CurseForge's API names for a CurseForge modpack.
  The nodes download plugin, mod and modpack files themselves.
- **neo** (optional) for "Ask neo to fix it".

## Setup

1. Import the Minecraft: Java Edition egg into a nest, for example one called Minecraft (see
   [Eggs](/nodes/eggs/)).
2. In Admin › Settings › Hosting › Games, **Add Game** and pick that egg. Set **Software Variable**
   to `MC_SOFTWARE` and add the software choices with **Add Software**:

   | Value | Label | Startup Command |
   |---|---|---|
   | `purpur` | Purpur | `Jar (Purpur / Fabric)` |
   | `fabric` | Fabric | `Jar (Purpur / Fabric)` |
   | `forge` | Forge | `Modloader (Forge / NeoForge)` |
   | `neoforge` | NeoForge | `Modloader (Forge / NeoForge)` |

   The Startup Command takes the name of one of the egg's startup commands (or a whole command);
   empty uses the egg's first. The first choice is the default. Save.
3. To let users create servers (and get the setup), turn on **Players Create Servers** on the same
   tab ([creating servers](/servers/create-server/)).
4. Optional: create an API key at [console.curseforge.com](https://console.curseforge.com), paste
   it into **CurseForge API Key** in Admin › Settings › Hosting › Minecraft, and save. CurseForge
   then shows up as a source.
5. Optional: set **User Agent** on the same tab to one that names your panel and a contact. Modrinth
   asks API users for an identifying user agent; the default already names the panel and its URL.
6. Give subusers the Minecraft permissions they need (below).

## Settings

### Admin › Settings › Hosting › Minecraft

| Setting | Default | What it does |
|---|---|---|
| CurseForge API Key | empty | Offers CurseForge as a source of plugins, mods and modpacks, and matches installed jars against it. Stored encrypted; leave the field empty to keep a stored key. |
| SpigotMC | on | Offers SpigotMC (through the Spiget API) as a source of plugins on plugin servers. |
| User Agent | empty | What the panel calls itself to Modrinth, CurseForge, SpigotMC and the loaders' APIs. Empty: `<app name>-panel/<release> (+<app URL>)`. One line. |
| Log Check | on | Checks Minecraft servers' latest log on mclo.gs and shows the problems above the console. Off, the console shows nothing. |

The software choices themselves are part of the games catalog in Admin › Settings › Hosting › Games
([creating servers](/servers/create-server/)).

## Permissions

Server permissions, for subusers:

| Permission | Allows |
|---|---|
| `minecraft.content` | Plugins & Mods: browsing, installing, updating, turning off and deleting plugins and mods, and searching modpacks. Installing a modpack also needs `settings.software`. |
| `minecraft.settings` | Game Settings: reading and changing `server.properties` and the Bukkit, Spigot, Paper and Purpur files, secrets in them included. |
| `minecraft.players` | Players and player details: the whitelist, operators and bans. Heal, feed, kill, teleport and game mode on an online player also need `control.console`; changing a stopped server's player files needs `files.update`, deleting them `files.delete`. |
| `minecraft.worlds` | Worlds: creating, loading, uploading and deleting worlds. Downloading also needs `files.read-content`, uploading `files.create`. |
| `minecraft.bedrock` | Add Bedrock support: installs Geyser and Floodgate and gives the server one more port. |

The setup is answered by users with `minecraft.settings` and `minecraft.players`; its software step
needs `settings.software`, a modpack `minecraft.content`, Bedrock `minecraft.bedrock`. The log
check needs `control.console` and `files.read-content`.

## Notes

- Plugin, mod and settings changes apply on the next restart.
- The log check sends server logs to mclo.gs, an outside service where anyone with the link can read
  the paste. Secrets are masked first, but player names stay. Turn **Log Check** off if logs must not
  leave your panel.
- The Minecraft: Java Edition egg installs Paper instead of Purpur for versions before 1.14.1, which
  Purpur has no builds for. Forge installers for Minecraft before 1.17 often fail under the Java 21
  the egg installs with.
- The egg's first image is Java 25. When an old version needs an older Java, the console offers the
  egg's other images (the `java_version` feature), or a software choice can name one in its
  **Image** field.
- Commands from the player pages use UUIDs, so live changes need Minecraft 1.13 or newer.
- A server whose setup was never finished cannot be started and stays empty.
