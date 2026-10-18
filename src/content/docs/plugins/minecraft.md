---
title: Minecraft
description: plugged-host-minecraft adds Minecraft Java pages to the server panel, including a setup wizard, a Modrinth, CurseForge and SpigotMC browser, modpacks, Geyser, players and worlds.
sidebar:
  order: 4
---

`plugged-host-minecraft` turns a Minecraft: Java server into something an owner can run without
the file manager. It adds a first-run setup wizard, a browser for plugins, mods and modpacks from
Modrinth, CurseForge and SpigotMC, a list of what is installed, one-click Bedrock support
(Geyser and Floodgate), forms for the game's config files, whitelist and operator management, and
a Worlds page. It also adds the "Setting up" waiting room, which every server sees while it
installs.

## What it does

- **Setting up (waiting room).** While a server is still installing, or its install failed, every
  page of that server redirects here. This applies to every egg, not only Minecraft. The page
  shows which phase is running and for how long, then opens the server once it is installed. A
  failed install gets a **Retry reinstall** button (needs the reinstall permission) and a **Get
  help** link to the Discord invite URL of [plugged-host-discord](/plugins/discord/) when one is
  set.
- **Set up wizard.** A few questions in plain words: server software and Minecraft version, an
  optional Modrinth modpack (not on Paper/Purpur), Bedrock support (not on Forge), premium-only
  or cracked accounts (`online-mode`), private (whitelist on and enforced) or public, and the
  first players and operators. The wizard
  writes `server.properties`, `whitelist.json` and `ops.json`. When an answer needs a reinstall
  (other software, other version, a modpack), the reinstall runs first and a queued job writes
  the files once it has finished.
  - Servers created on the create page of [plugged-host-servers](/plugins/servers/) must go
    through the wizard: every page redirects to it until it is done. The create page already
    asked the owner to accept the Minecraft EULA, and this plugin writes `eula=true` into
    `eula.txt`.
  - Other servers (created by an admin, or older than the plugin) get a "not set up yet" callout
    on the console instead, until the wizard has been completed once.
  - The software and modpack steps are hidden for subusers without the reinstall permission.
- **Plugins, or Mods & Modpacks.** A browser filtered to the server's software and Minecraft
  version: plugins on Paper/Purpur, mods and modpacks on Fabric, Forge and NeoForge.
  - Modrinth is the default source and needs no key.
  - CurseForge appears as a second source once you set an API key.
  - SpigotMC (read through the public Spiget index) appears on Paper/Purpur servers. It offers
    free plugins only and only each plugin's latest build. Plugins hosted outside SpigotMC can be
    installed only when they link a GitHub release jar. The rest show **External download**.
  - A single plugin or mod is handed to Wings as a URL, so the node downloads it. The panel never
    holds the jar.
  - A modpack (Modrinth `.mrpack` or CurseForge `.zip`) switches the server to the loader and
    Minecraft version the pack needs, reinstalls it, then places the pack's files. The world is
    kept. This runs as queued jobs and the owner gets a notification when it is done.
- **Installed plugins and mods.** Every jar in `plugins/` or `mods/` is identified in the
  background while the page is open: from its own descriptor (`plugin.yml`, `fabric.mod.json`,
  `mods.toml` …), then an exact Modrinth hash or CurseForge fingerprint match, then a strict name
  match on Modrinth or SpigotMC. The list shows icons, source links, available Modrinth updates
  and missing plugin dependencies. Each jar can be deleted (optionally with its data folder),
  disabled (renamed to `.jar.disabled`) or updated to the newest Modrinth build.
- **Bedrock support.** **Add Bedrock support** on the plugins or mods page (or the wizard's
  Bedrock step) installs Geyser and Floodgate on Paper/Purpur, Fabric and NeoForge (Geyser has no
  build for plain Forge). Geyser comes from GeyserMC's own download API. Floodgate comes from
  GeyserMC for Paper/Purpur and from Modrinth for Fabric and NeoForge. The
  plugin writes Geyser's config, gives the server a free allocation on its node for the Bedrock
  port (marked "Geyser (Bedrock)" and reused on later updates), and restarts the server. Running
  it again updates Geyser instead of installing it twice.
- **Game Settings.** `server.properties` as a form, plus `bukkit.yml`, `spigot.yml`,
  `config/paper-global.yml` (or `paper.yml`) and `purpur.yml` when the server has them. Only the
  values that changed are written. The ports and the RCON password are managed by the panel and
  shown read-only. Saving a YAML file drops its comments, so the first save keeps the original as
  `<file>.plugged-host.bak`. **Edit as text** writes the whole file unchecked.
- **Players.** The whitelist and the operators in one table, plus the whitelist enforcement
  switch. When the server runs and the user may use the console, changes go through console
  commands. Otherwise the plugin edits the files and says that the change applies at the next
  start. On a premium (`online-mode=true`) server, names are checked against Mojang.
- **Worlds.** Every world as a card with **Download** (a zip built on the node, linked in the
  notification bell and deleted after two hours), **Upload** (a `.zip` or `.tar.gz` straight to
  the node; `level.dat` is found anywhere in the archive), **Options** (name, seed, generator
  settings, type, structures, data packs; saving starts a new world), **Generate**, **Use this
  world**, **Files** and **Delete**. Anything that replaces the active world needs the server
  stopped and can keep a zip of the old world in the server folder first.
- **Version and software.** The **Version and software** section on the server's Settings page
  (from plugged-host-servers) switches loader and version through this plugin.
- **The Minecraft egg.** The plugin ships a Minecraft: Java Edition egg
  (`egg/egg-minecraft-java.json`): Purpur, Fabric, Forge and NeoForge in one egg, picked by its
  `MC_SOFTWARE` variable, with Java 8 to 25 images. `plugged-host:minecraft-setup` imports it
  under its own UUID, the one the servers plugin's software catalog ships with. Imported this
  way, the egg's description, its installer's banner and the User-Agent its installer sends
  PaperMC name your panel (`APP_NAME`, `MINECRAFT_USER_AGENT`).
- **neo tools.** With [plugged-host-ai](/plugins/ai/) enabled, neo can look up the server
  (`minecraft_info`), search, install, list, toggle and remove content, install Geyser, switch
  software and install modpacks.
- **Client API.** Four endpoints under `/api/client/servers/{server}`, with the same subuser
  permissions as the pages:

  | Endpoint | Does | Permissions |
  |---|---|---|
  | `GET /mods` | Lists installed jars and what they are | `file.read` |
  | `POST /mods/geyser` | Installs or updates Geyser and Floodgate | `file.create` and `control.restart` |
  | `GET /content` | Searches content (`q`, `kind`, `game_version`, `source`, `page`) | `file.read` |
  | `POST /content/modpacks` | Queues a modpack install (`project`, `version`, `source`) | `file.create` and `settings.reinstall` |

## Requirements

- Requires [plugged-host-core](/plugins/core/) and [plugged-host-servers](/plugins/servers/).
- Optional: [plugged-host-economy](/plugins/economy/) (the perk list on the waiting room),
  [plugged-host-ai](/plugins/ai/) (the neo tools), [plugged-host-ads](/plugins/ads/) (the ad slot
  `onboarding-install` on the waiting room).
- **A Minecraft egg in the servers plugin's software catalog.** The Minecraft pages appear only on
  servers whose egg is listed in that catalog (keyed by egg UUID, see
  [plugged-host-servers › Only in the config file](/plugins/servers/#only-in-the-config-file))
  with a software variable whose values are `purpur`, `fabric`, `forge` or `neoforge`. The egg
  the plugin ships is that egg: import it with `plugged-host:minecraft-setup` (see Setup) and the
  shipped catalog entry works as it is. The plugin also reads and writes the egg variables
  `MINECRAFT_VERSION` and, when the egg has it, `BUILD_NUMBER`. "purpur" stands for the whole
  Paper/Purpur/Spigot family. Quilt is not supported.
- **A queue worker.** Modpack installs, world downloads and imports, and the wizard's
  post-reinstall step are queued jobs. See [Queue and scheduler](/panel/queue-and-scheduler/).
- **Outbound HTTPS** from the panel to the services it reads: `api.modrinth.com`,
  `api.curseforge.com`, `api.spiget.org`, `download.geysermc.org`, `api.mojang.com`,
  `launchermeta.mojang.com`, and the version lists at `api.purpurmc.org`, `fill.papermc.io`,
  `meta.fabricmc.net`, `files.minecraftforge.net` and `maven.neoforged.net`. Nodes download the
  jars themselves (from `cdn.modrinth.com`, CurseForge's CDN, `cdn.spiget.org`, GitHub and
  GeyserMC), so they need outbound HTTPS too.
- **A CurseForge Core API key** if you want CurseForge (optional). Everything else needs no key.

## Setup

1. Enable the plugin in Admin › Plugins and run the migrations (one table, `server_onboarding`).
   See [Plugins](/panel/plugins/).
2. Import the Minecraft egg, dry run first:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan plugged-host:minecraft-setup --dry-run
   sudo -u www-data php artisan plugged-host:minecraft-setup
   sudo -u www-data php artisan plugged-host:doctor plugged-host-minecraft
   ```

   It imports the egg only when no egg has its UUID yet, so it is safe to run again. The
   software catalog of [plugged-host-servers](/plugins/servers/#only-in-the-config-file) already
   points at this egg. To use an egg of your own instead, replace the catalog entry's UUID,
   startup keys and image keys with your egg's.
3. Open a Minecraft server: the **Plugins** (or **Mods & Modpacks**), **Game Settings**,
   **Players** and **Worlds** pages should be in its sidebar.
4. Optional: paste a CurseForge API key in Admin › Plugins › plugged.host Minecraft › Settings.
5. Check that the queue worker allows jobs of up to 15 minutes (see Notes).

## Settings

Admin › Plugins › plugged.host Minecraft › Settings, section **CurseForge & content**.

| Setting | Default | What it does |
|---|---|---|
| CurseForge API key (`CURSEFORGE_API_KEY`) | empty | Turns on CurseForge as a source: search, modpack installs and fingerprint identification of installed jars. The field never shows the stored key; leave it blank to keep it. |
| Modpack overrides file limit (`MINECRAFT_OVERRIDES_LIMIT`) | `2000` | The most files a CurseForge modpack's `overrides/` folder may hold (0 to 100000). A pack over the limit installs without its overrides. |
| SpigotMC plugins (`MINECRAFT_SPIGOTMC_ENABLED`) | `true` | Offers SpigotMC as a source on Paper/Purpur servers. |

### Only in `.env`

| Setting | Default | What it does |
|---|---|---|
| `MINECRAFT_USER_AGENT` | empty | The User-Agent of every request to Modrinth, CurseForge, Spiget, Mojang and the version APIs, which ask for one that names the application and a contact. Empty means `<APP_NAME>-panel/<release> (<contact>)`: characters a product name cannot hold, such as spaces, become `-`, and the contact is `MAIL_FROM_ADDRESS`, or `APP_URL` while that is unset or an `example.com`, `example.net` or `example.org` address. For example `My-Host-panel/2.2.0 (https://panel.example.com)`. `plugged-host:minecraft-setup` also writes it into the egg's installer, with `-egg/` in place of `-panel/`; a later change reaches the egg only through `--update`. |

## Commands

| Command | What it does |
|---|---|
| `plugged-host:minecraft-setup` | Imports the Minecraft: Java Edition egg the plugin ships when no egg has its UUID yet. An existing egg is left as it is. |
| `plugged-host:minecraft-setup --update` | Imports the file over the existing egg: its install script, variables, startup commands, images and config become the file's. Servers are not changed: each keeps its own startup command, image and variable values, and the new install script runs at its next reinstall. |
| `plugged-host:minecraft-setup --dry-run` | Says what it would do and changes nothing. With `--update`, it lists the variables that would be deleted. |

:::caution
`--update` deletes every variable of the existing egg that the file does not have, together with
every server's value for it. Run it with `--dry-run` first, and export the egg (Admin › Eggs ›
the egg › Export) before you run it for real.
:::

Nothing runs on the scheduler.

## Doctor checks

- **Minecraft egg**: every egg the servers plugin's software catalog lists exists on the panel,
  and the check names them. Warns with the UUIDs that are missing, with a pointer to
  `plugged-host:minecraft-setup` when the missing one is the egg this plugin ships. Also warns
  when the catalog lists no egg at all, because then no server gets the Minecraft pages.

## Notes

- **Long queue jobs.** A modpack install is two jobs. The first reads the pack, switches the
  software and starts the reinstall; it gets exactly one attempt, because a retry would reinstall
  the server again. The second checks every 20 seconds until the reinstall is done (up to 90
  times, about half an hour) and then downloads the pack's files. Each run may take up to
  900 seconds, and world downloads and imports may too. Keep the queue connection's
  `retry_after` above that (for example `REDIS_QUEUE_RETRY_AFTER=1000` or
  `DB_QUEUE_RETRY_AFTER=1000`) and start the worker with `--timeout=960`, or a long job can run a
  second time while the first is still going. See
  [Queue and scheduler › The retry timeout](/panel/queue-and-scheduler/#the-retry-timeout).
- **Modpack limits.** The egg has no variable for an exact Forge or NeoForge build, so a pack that
  demands one specific loader build may still need manual work. A Modrinth pack whose
  `overrides/` tree is over 96 MB is installed without it, and the owner is told to upload the
  folder by hand. CurseForge files whose authors do not allow third-party downloads are skipped.
- **Bedrock port.** Geyser takes the lowest free allocation on the server's node. When the node
  has none, Geyser is configured for port 19132, which the server does not own, so Bedrock players
  cannot connect. Keep spare allocations on Minecraft nodes, and let UDP through on your
  allocation ports in the node's firewall.
- **Large jars** (over 24 MB) are identified by name only, to keep PHP's memory flat.
- **World uploads** are limited by the node's upload size (Admin › Nodes).
