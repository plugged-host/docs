---
title: The FiveM image
description: How the plugged.host FiveM image keeps every FiveM server on the build it asks for, and how to put your FiveM egg and servers on it.
---

FiveM servers on a panel with [plugged-host-fivem](/plugins/fivem/) install and run in one
image, `ghcr.io/plugged-host/fivem`. At every start it makes sure the server's FXServer build
(the `alpine/` folder) is the one the server asks for, downloads a new one from Cfx when needed,
and then runs the egg's startup command as usual. The panel's Artifacts and GTAV Enhanced pages
only change two egg variables and restart the server; the image does the rest.

This page covers what the image does, where it comes from, and how to move your FiveM egg and
servers onto it.

## What the image does

The image is Debian (trixie, slim) with `tini`, `bash`, `curl`, `jq`, `tar`, `xz`, `iproute2`,
`procps` and `tzdata`, plus one script, `fivem-runtime`. FXServer brings its own userland in the
server's `alpine/` folder, so the image needs nothing else. It plays two roles:

- **Install container.** The egg's install script is `exec fivem-runtime install /mnt/server`.
  Wings runs it as root with the server's files at `/mnt/server`.
- **Server image.** Wings starts it as the node's container user with the files at
  `/home/container`. The entrypoint is `tini -g -- fivem-runtime start`, so signals reach txAdmin
  and FXServer alike.

Two egg variables say what to install:

| Variable | Values | Meaning |
|---|---|---|
| `FIVEM_VERSION` | `recommended` (default), `latest`, or a build number | A channel follows Cfx: each start installs the channel's current build if it changed. A build number stays on that build, and a start then needs no network at all. |
| `FIVEM_EDITION` | `legacy` (default) or `enhanced` | `enhanced` runs FiveM for GTAV Enhanced. Cfx publishes only its current Enhanced build, so `FIVEM_VERSION` does not apply to it. |

At every start `fivem-runtime`:

1. Reads the two variables. An unknown edition counts as `legacy`, an invalid version as
   `recommended`.
2. Starts straight away when a pinned Legacy build is already installed.
3. Otherwise asks Cfx which build to install: the changelog API
   (`changelogs-live.fivem.net`) for `recommended` and `latest`, the server download page on
   `docs.fivem.net` for a pinned build and for Enhanced. When that build is already installed,
   it starts without downloading anything.
4. Downloads only from Cfx's own hosts (`runtime.fivem.net`, `downloads.cfx-services.net`),
   whatever the answer says.
5. Extracts the download next to the current files and swaps `alpine/` only when the new one is
   complete and contains the edition's server binary.
6. Records what it installed in `alpine/.plugged-host.json` (edition, build, URL, time), which
   the panel reads.
7. Runs the egg's startup command with the same `{{VARIABLE}}` substitution and `eval` as
   Pelican's own yolk images, so existing startup lines keep working. On Enhanced it rewrites the
   paths in the startup line to Enhanced's folder layout.

A failure is never worse than the old egg:

- When Cfx cannot be reached or a download is broken, the installed build starts as before.
- When a pinned build is no longer offered and nothing is installed, the recommended build is
  installed instead.
- When a switch of edition cannot complete but the other edition is installed, that one starts
  and the console says so. The panel shows the installed edition, so the owner sees it.
- Only a server with nothing installed and no way to download fails to start.

The image also turns off core dumps. FXServer crashes harmlessly while it shuts down on SIGINT,
and the default core pattern would otherwise leave a large core file in the server's folder on
every stop.

## Use the published image or build your own

The plugins repository's `fivem image` workflow (`.github/workflows/fivem-image.yml`) builds
`plugged-host-fivem/image/Dockerfile` whenever the image changes and publishes two tags:

- `ghcr.io/plugged-host/fivem:2.2`, which moves with every build of the release line. This is
  the default (`FIVEM_IMAGE`).
- `ghcr.io/plugged-host/fivem:2.2.0.<commit>`, one per build, which never moves.

Nodes pull the image without credentials, so check from a node that it is pullable:

```bash
docker pull ghcr.io/plugged-host/fivem:2.2
```

To build your own instead, from a checkout of the plugins repository:

```bash
docker build -f plugged-host-fivem/image/Dockerfile -t registry.example.com/fivem:2.2 plugged-host-fivem
docker push registry.example.com/fivem:2.2
```

Then set `FIVEM_IMAGE=registry.example.com/fivem:2.2` in the panel's `.env` (see
[Configuration](/panel/configuration/)) and run the egg setup below. Two alternatives:

- Build the image on every node and set `FIVEM_IMAGE=~registry.example.com/fivem:2.2`. The
  leading `~` tells Wings to use the local image and never pull it.
- Run the workflow in your own fork. Make the package public, or give Wings credentials for your
  registry in its `config.yml`, because nodes pull it as they need it.

The build runs the script's tests and fails when one fails. To run them on their own, offline:

```bash
bash plugged-host-fivem/image/tests/run.sh
```

## Pre-pull the image (optional)

A node pulls the image the first time a FiveM server installs or starts there. To save that wait,
pull it on every node that runs FiveM servers:

```bash
docker pull ghcr.io/plugged-host/fivem:2.2
```

## Put the eggs and servers on the image

The FiveM egg is any egg tagged `cfx`. Add the tag in Admin › Eggs if yours lacks it.

1. **Keep a copy of the egg** for a rollback: Admin › Eggs › the FiveM egg › Export. Note the
   Docker image your FiveM servers use now (Admin › Servers › a FiveM server).
2. **Dry run**, which lists every egg it would change and how many servers it would move:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan plugged-host:fivem-setup --servers --dry-run
   ```

3. **Run it:**

   ```bash
   sudo -u www-data php artisan plugged-host:fivem-setup --servers
   ```

4. **Check with the doctor.** Both FiveM checks should be ok:

   ```bash
   sudo -u www-data php artisan plugged-host:doctor plugged-host-fivem
   ```

Per egg the command:

- puts the image first in the egg's Docker images, so new servers get it (the old images stay
  selectable);
- makes the image the install container, with the plugin's `egg/install.sh` as the install
  script, so installs and starts lay the build down with the same code;
- creates or updates `FIVEM_VERSION` (default `recommended`, editable by users, also set from the
  Artifacts page);
- adds `FIVEM_EDITION` (default `legacy`), hidden from the Startup page because the GTAV Enhanced
  page sets it;
- sets the stop command to `^SIGINT`. txAdmin ignores the usual `quit` while it has no server
  running, so stops used to wait out Wings' stop timeout. SIGINT reaches txAdmin and FXServer and
  both shut down cleanly.

With `--servers` it also sets every FiveM server's image. Nothing restarts: each server picks the
image up at its next start. The egg's startup command is not touched.

**Run `plugged-host:fivem-setup` again after every import or update of the FiveM egg.** An egg
import puts the old install script and stop command back, and the doctor fails until you do.

## Check

1. Restart one FiveM server and watch its console: `[plugged.host] Downloading FiveM legacy
   build …`, then `… installed`, then txAdmin as usual. The first start on the image downloads the
   build again once (about 70 MB from Cfx), because the old egg left no record of what it
   installed. `txData`, resources and databases are not touched.
2. On that server, Artifacts shows the installed build, Players answers while it runs, Server
   configuration shows its `server.cfg` and Frameworks lists txAdmin's recipes.
3. Stop it: no `core.*` file appears in its folder.

## Roll back an egg

The `alpine/` folder the image installs has the same layout the old egg used, so servers start on
the old image as they are.

1. Put the egg back: Admin › Eggs › the FiveM egg › Import, with the file you exported. Or set
   back its Docker images, install container, install entrypoint, install script and stop
   command by hand. `FIVEM_EDITION` can stay; the old image ignores it.
2. Put the servers back on the old image, per server in Admin › Servers, or all at once in the
   panel's database:

   ```sql
   UPDATE servers SET image = '<old image>' WHERE egg_id = <FiveM egg id>;
   ```

   They pick it up at their next start.
3. Disable plugged-host-fivem in Admin › Plugins if the FiveM pages should go too.

## Framework databases

ESX, QBCore and Qbox need a MySQL database. The Frameworks page creates one from the server's
database slots, through Pelican's own database service, so the usual rules apply:

- Client databases are on (`PANEL_CLIENT_DATABASES_ENABLED`, on by default).
- The server has a database slot left (its database limit in Admin › Servers).
- A database host is linked to the server's node (Admin › Database Hosts › the host › linked
  nodes). With `PANEL_CLIENT_DATABASES_ALLOW_RANDOM` on (the default), any database host is used
  when none is linked.
- The game containers can reach the database host at the address it has in the panel. The
  framework's `server.cfg` gets a connection string with that address.

Without a free slot or a usable host, the page offers only the server's existing databases, or
says that the framework needs a database.

## GitHub archives and Wings' Content-Length

A recipe is mostly downloads, and the node does them itself through Wings. One kind is
different: Wings' downloader refuses responses without a Content-Length header, and GitHub's
source archives come without one. The panel relays those: it downloads the archive into
`storage/app/plugged-host-fivem` in the panel directory and uploads it to the node with a signed
upload token, the same way the file manager uploads files. So during framework installs:

- keep a few hundred MB free on the panel's disk;
- the panel needs outbound HTTPS to GitHub;
- the upload goes through the node's upload endpoint, so the node's upload size limit (Admin ›
  Nodes) applies to each archive.
