---
title: Eggs
description: The eggs that ship in the panel repository, what each is for, how to import them, and the egg features and variables the panel's pages look for.
---

An egg describes how a server runs: its images, startup commands, install script, variables and
the files Wings rewrites at boot. The panel repository ships a set of eggs in
[`docs/eggs`](https://github.com/plugged-host/panel/tree/main/docs/eggs): the ones the Minecraft,
FiveM and devbox pages are made for, plus a few generic eggs for bots and apps. Admins import them
into nests and add them to the games catalog. How eggs and nests work in general is in the
[Calagopus documentation](https://calagopus.com/docs/).

## What it does

### The eggs

| File | Egg | Suggested nest | For |
|---|---|---|---|
| `minecraft-java.json` | Minecraft: Java Edition | Minecraft | Purpur, Fabric, Forge and NeoForge in one egg, for the [Minecraft](/games/minecraft/) pages |
| `velocity.json` | Velocity | Minecraft | The Velocity proxy |
| `vanilla-bedrock.json` | Vanilla Bedrock | Minecraft | Mojang's Bedrock Dedicated Server |
| `fivem.json` | FiveM / RedM | FiveM | FXServer with txAdmin, for the [FiveM](/games/fivem/) pages |
| `multi-theft-auto.json` | Multi Theft Auto | Multi Theft Auto | A Multi Theft Auto server |
| `devbox.json` | Devbox | Devbox | The servers behind [devboxes](/servers/devboxes/); never created by hand |
| `python.json` | python generic | Software | A Python app from a git repository or uploaded files |
| `nodejs.json` | node.js generic | Software | A Node.js app from a git repository or uploaded files |
| `rust.json` | rust generic | Software | A Rust project from a git repository, run with `cargo run --release` |
| `golang.json` | golang generic | Software | A Go project, built at every start, or a Go package |
| `code-server.json` | Code-Server | Software | VS Code in the browser as a plain server (not a devbox) |

### Minecraft: Java Edition

One egg for four server softwares, chosen by the hidden variable `MC_SOFTWARE`. Purpur covers the
plugin side: for Minecraft versions before 1.14.1, which Purpur has no builds for, the install puts
Paper in place instead. Features: `eula`, `java_version`, `pid_limit`. Its config file is
`server.properties` (Wings writes the server's IP and port into it at boot).

| Variable | Default | What it does |
|---|---|---|
| Minecraft Version (`MINECRAFT_VERSION`) | `latest` | The version to install. `latest` is the newest release; Fabric also takes `snapshot`. |
| Server Jar File (`SERVER_JARFILE`) | `server.jar` | The jar the server runs. |
| Build Number (`BUILD_NUMBER`) | `latest` | The Purpur build. Fabric, Forge and NeoForge always install the promoted build for the version. |
| Server Software (`MC_SOFTWARE`) | `purpur` | `purpur`, `fabric`, `forge` or `neoforge`. Hidden from users; the game's software choice sets it. |

Startup commands, which the games catalog's software choices name:

- **Jar (Purpur / Fabric)**: runs the jar with tuned G1 garbage-collector flags. The heap is 95 % of
  the server's memory limit.
- **Old Java**: the same without `--add-modules=jdk.incubator.vector`, for the Java 8 and 11
  images, which lack that module.
- **Modloader (Forge / NeoForge)**: starts with the `unix_args.txt` the Forge or NeoForge installer
  writes, else the jar.

Images: Java 25 (the first, used unless a software choice names another), 21, 17, 16, 11 and 8.

### Velocity and Vanilla Bedrock

- **Velocity** has `eula`, `java_version` and `pid_limit` but no `server.properties`, so the panel
  treats it as a Minecraft proxy: the log check only. Wings binds `velocity.toml` to the server's
  port. Variables: Build Number (`latest`), Server Jar File (`velocity.jar`) and the Velocity Version
  (`latest`, not editable by users).
- **Vanilla Bedrock** has `pid_limit` and a `server.properties` without `eula`: the log check only.
  Wings writes its port, server name, game mode, difficulty, world and cheats into
  `server.properties` from the variables Bedrock Version (`latest`), Server Name, Gamemode
  (`survival`), Difficulty (`easy`), Choose World (`default`) and Allow cheats (`false`).

### FiveM / RedM

Runs FXServer with txAdmin on the FiveM image the egg names. The image's `fivem-runtime` installs
the build at install and at every start. Feature: `cfx`. The start line sets
`TXHOST_FXS_PORT={{SERVER_PORT}}`, which puts FXServer on the server's own port instead of 30120.

| Variable | Default | What it does |
|---|---|---|
| FiveM Version (`FIVEM_VERSION`) | `recommended` | `recommended`, `latest` or a build number. Set from the Artifacts page. |
| txAdmin Port (`TXHOST_TXA_PORT`) | `30001` | txAdmin's web port. The server needs a second allocation with this port; servers users create get one. |
| FiveM Edition (`FIVEM_EDITION`) | `legacy` | `legacy` or `enhanced`. Hidden; set from the GTAV Enhanced page. |
| Hosting Provider Name (`TXHOST_PROVIDER_NAME`) | `example.com` | The provider name txAdmin shows. Hidden; set your own, 2 to 16 letters, digits, dots, dashes or underscores. |

### Devbox

Runs `ph serve` on the devbox image (`ghcr.io/plugged-host/panel-devbox:latest`; pick another in
the devbox settings). Its hidden variables (`DEVBOX_TOKEN`, `DEVBOX_PANEL_URL`, `DEVBOX_TLS_CERT`,
`DEVBOX_TLS_KEY`, `DEVBOX_EDGE_CA`) are set by the panel at every start. Choose the egg in
Admin › Settings › Hosting › Devboxes; do not add it to the games catalog.

### Multi Theft Auto

Runs `mta-server64` on the server's port. `SERVER_WEBPORT` is the HTTP port players download
resources from: the panel puts the server's second port in it (see
[allocations](/nodes/allocations/)).

### The generic eggs

- **python generic**: at install, clones Git Repo Address (with Git Branch, Git Username and Git
  Access Token for private repositories); with User Uploaded Files set to `1` it leaves the files to
  you. At every start it installs Requirements file (`requirements.txt`) and Additional Python
  packages, then runs App py file (`app.py`). Auto Update (`1`) pulls the repository at every start.
  Python 2.7 to 3.14 images.
- **node.js generic**: the same git options. At every start it runs `npm install` when there is a
  `package.json`, then Main file (`index.js`; `.js`, `.mjs` and `.cjs` with node, anything else with
  tsx) with Additional Arguments. Node.js 22 to 26 images.
- **rust generic**: the same git options, then `cargo run --release` at every start.
- **golang generic**: builds the uploaded project (with its `go.mod`) at every start into Program
  name (`app`) and runs it. A new server starts with a small example web server. Go package installs
  a Go program from the internet instead. Go 1.22 and 1.23 images.
- **Code-Server**: VS Code in the browser on the server's port, with the Password variable as its
  login. Images for Java, .NET, Mono, Erlang, Python, Bun, Dart, Go, Node.js, Elixir and Rust.

### Egg features the panel reads

Features are set on an egg in Admin › Nests › (nest) › (egg), field **Features**. The panel's pages
key on these:

| Feature | What the panel does with it |
|---|---|
| `eula` | The console asks to accept the Minecraft EULA when the server stops for it, and the create page asks users to accept it (then `eula.txt` says `eula=true` before the first start). Running servers get the in-game [ad](/economy/ads/) message. With a `server.properties` among the egg's config files, the egg is a Minecraft: Java Edition server: the [Minecraft](/games/minecraft/) pages, the new server setup, Minecraft [subdomains](/servers/subdomains/), neo's Minecraft tools and the log check. Without one, it is a Minecraft proxy: the log check only. |
| `java_version` | When the console prints a Java version error, it offers to switch the server to another of the egg's images. |
| `pid_limit` | When the console prints that the server cannot create a thread, a dialog explains the process limit (admins see the Wings setting to raise). |
| `cfx` | The [FiveM](/games/fivem/) pages, FiveM subdomains with their SRV records, and a second port for txAdmin in `TXHOST_TXA_PORT`. |
| `srv-minecraft`, `srv-fivem`, `srv-cfx`, `srv-mumble`, `srv-factorio`, `srv-rust`, `srv-scpsl`, `srv-teamspeak` | The Subdomains page, with that game's SRV records. |
| `subdomain` | The Subdomains page, with an address record only. |

An egg with a `server.properties` config file and no `eula` (Bedrock) gets the Minecraft log check.

### Egg variables the panel reads

| Variable | What the panel does with it |
|---|---|
| `MINECRAFT_VERSION`, `MC_VERSION`, `VANILLA_VERSION` | The first one an egg has is the Minecraft version, shown and changed in the Version section of the server's [Settings](/servers/server-settings/). |
| `TXHOST_TXA_PORT`, `SERVER_WEBPORT` | The server gets two ports in a row, and the second goes into this variable. |
| Any variable with `PORT` in its name | When a server moves to other port numbers, a value that was one of its old ports becomes the new port ([moving servers](/servers/moving-servers/)). |
| `FIVEM_VERSION`, `FIVEM_EDITION` | The FiveM build and edition, set by the Artifacts and GTAV Enhanced pages. |

An egg configuration with an allocation deployment (Admin › Egg Configurations) that writes a
variable itself wins over the panel's own port handling.

## Setup

### Import in the panel

1. In Admin › Nests, create a nest per group (for example Minecraft, FiveM, Devbox, Software), or
   use one you have.
2. Open the nest, go to its **Eggs** tab and use **Import**:
   - **from File**: pick the downloaded `.json` file, or drop several files on the page;
   - **from URL**: paste the raw file link, for example
     `https://raw.githubusercontent.com/plugged-host/panel/main/docs/eggs/minecraft-java.json`.
3. For the games users may create, add the egg in Admin › Settings › Hosting › Games
   ([creating servers](/servers/create-server/)). The Minecraft and FiveM pages say which software
   choices and settings their eggs need.

Importing an egg whose name is already in the nest is refused. To bring an imported egg up to date,
open it and use **Update** › **from URL** (or **from File**) instead.

### Import from the command line

`panel-rs nests mass-import` imports every `.json`, `.yml` and `.yaml` egg in a folder into one
nest. Run it on the panel box with the panel's environment, as
[commands](/reference/commands/#running-panel-commands) shows; the folder must be readable by the
panel's user:

```bash
panel-rs nests create --name Software --author admin@example.com
mkdir -p /tmp/software-eggs && cd /tmp/software-eggs
for egg in python nodejs rust golang code-server; do
  curl -fsSLO "https://raw.githubusercontent.com/plugged-host/panel/main/docs/eggs/$egg.json"
done
panel-rs nests mass-import --nest Software /tmp/software-eggs
```

- `--nest` takes the nest's name or UUID; without it, an interactive terminal asks.
- An egg already in that nest (same UUID or name) is updated in place.
- `--recursive` (`-r`) scans subfolders too, and `--ignore-errors` (`-i`) keeps going past a file
  that fails.

The command imports into one nest, so keep eggs for different nests in separate folders, or run it
once per nest. More commands are in [commands](/reference/commands/).

## Permissions

Admin role permissions for managing eggs:

| Permission | Allows |
|---|---|
| `nests.create`, `nests.read`, `nests.update`, `nests.delete` | Creating, viewing, changing and deleting nests. |
| `eggs.create` | Creating and importing eggs. |
| `eggs.read`, `eggs.update`, `eggs.delete` | Viewing, changing (including Update from URL) and deleting eggs. |

## Notes

- Tags on an egg are not kept on import. An egg from elsewhere that marks FiveM with a `cfx` tag
  needs `cfx` added under **Features**, or it gets no FiveM pages.
- Wings marks a server running when its console prints the egg's **Startup Done** text. The python,
  node.js and rust generic eggs ship with placeholder texts (`change this text 1`, `change this
  part`): set one your app prints, or the server stays Starting.
- Code-Server's Password variable defaults to `changeme`, and the server's port is open to the
  internet. Set a password before the first start.
- The Devbox egg is only for the panel's devboxes. A server created from it by hand gets no token
  and does nothing useful.
- The Minecraft: Java Edition egg's `MC_SOFTWARE` accepts only `purpur`, `fabric`, `forge` and
  `neoforge`; other software values are refused.
