---
title: Devbox
description: plugged-host-devbox gives Plus members VS Code on the server, a private Linux box next to a game server with its files at /server, reached over SSH or in the browser.
sidebar:
  order: 6
---

`plugged-host-devbox` is "VS Code on the server" for plugged.host Plus members. A devbox is a
private Linux box next to a game server, with the game server's files mounted at `/server`, a
terminal, common languages and every VS Code extension. VS Code's Remote-SSH extension connects to
it with a connect code from the panel, or VS Code runs in the browser. Each devbox is a hidden
Pelican server that Wings runs on the game server's node. Devboxes are off until you switch them
on.

## What it does

- **Open in VS Code.** The server's Settings page gets a **VS Code** section for the owner and for
  subusers allowed to use it. The first click creates the devbox and starts it; later clicks start
  it again. While it runs, the card shows:
  - the **connect code**, which VS Code asks for as the password (one per person, new at every
    start);
  - the **SSH command**, `ssh -p <port> <panel username>@<node FQDN>`;
  - **Open in VS Code**, a `vscode://` link that opens `/server` through the Remote - SSH
    extension (with a link to install the extension);
  - the devbox's **host key** fingerprint, which VS Code asks to trust once;
  - **Open in browser** when VS Code in the browser is set up, and **Stop**.
- **Signing in.** Over SSH a person signs in with their panel username and either their connect
  code or an SSH key saved on their panel account. Account passwords are never accepted over SSH.
  The devbox asks the panel who may sign in, so a person who loses access is out at the next
  heartbeat.
- **What a devbox is.** A hidden server (the devbox egg, owned by the system account `ph-devbox`)
  on the game server's node. It takes one free allocation of the node as its port, has its own
  volume as the home folder (`/home/container`: VS Code's server and extensions, logins, caches),
  and mounts the game server's volume read-write at `/server`. Its resources come on top of the
  game server's and the owner's plan.
- **Inside.** Debian with Python 3, Node.js, OpenJDK 21, build tools, Lua 5.4, git and the usual
  command-line tools, plus code-server for the browser version. The system is read-only and there
  is no root: tools install per user (`pip install --user`, `npm i -g` go to `~/.local`). `/tmp` is
  small, so `TMPDIR` points into the home folder.
- **`ph`, the game server from inside.** The game itself runs in its own container. `ph` talks to
  it:

  ```bash
  ph status            # running or not, CPU, memory, disk
  ph logs -n 100       # recent console output; ph logs -f follows it
  ph cmd "say hi"      # run a console command and show the answer
  ph console           # live console
  ph start | stop | restart | kill
  ```

  What `ph` may do follows the person's own permissions on the game server. `ph start` and
  `ph restart` go through the panel like the Start button, so the start queue, ads and limbo
  apply. A fresh home also gets notes for AI coding tools in `~/.claude/CLAUDE.md`.
- **Personal and shared devboxes.** By default everyone has their own devbox on a server, paid
  by their own Plus. The owner can switch on one **shared** devbox instead: then the owner's Plus
  pays for it, every member uses it, and the personal devboxes on that server are deleted. In a
  shared devbox everyone shares one Linux user, `ph status` and `ph logs` work, and power and
  console are off.
- **Who may have one.** The owner, and subusers with the **VS Code** permission plus SFTP and
  every file permission (read, read content, create, update, delete). A devbox can read, write
  and run the server's files, so it never gives more than SFTP would. Admins get no devbox on
  other people's servers.
- **VS Code in the browser.** Optional. Each devbox answers at `https://<slug>.<your devbox
  domain>` through an nginx "edge" on the panel box, which asks the panel who may in on every
  request. See [Devboxes on nodes › VS Code in the browser](/nodes/devboxes/#vs-code-in-the-browser).
- **Lifecycle.** A devbox stops after a while without a connection, and after a maximum run time
  whether connected or not. A devbox nobody used for some days is deleted with its home folder.
  Each person has one cap on running devboxes, counting their own and the shared ones on servers
  they own. All of these are settings.
- **Guards.** A devbox does not start while the game server is suspended, installing, being
  restored or moved, or its node is in maintenance; while the node is held by the servers
  plugin's deployment pause, over 90% memory or CPU, over the storage line on disk, or not
  answering; or while the game server's disk is full (writes to `/server` count there). A
  running devbox stops when its game server is suspended, starts moving to another node, or its
  disk fills up. A subuser who is removed or loses a permission loses their devbox at once, and a
  shared devbox they were in starts over with a new token and nothing of theirs left running.
- **Abuse protection.** A critical finding from [plugged-host-abuse](/plugins/abuse/) on a devbox
  stops every devbox of its person (the owner, for a shared one) and refuses new devboxes and
  sign-ins until an admin dismisses or resolves the finding in Admin › Servers › Abuse. A devbox
  under review is never deleted, so the evidence stays.
- **Hidden from the rest of the panel.** Devbox servers are left out of the admin and user server
  lists, never get "your server is installed" mail, and are skipped by storage mirrors, failover
  and limbo. While someone works in a devbox, an hourly activity entry on the game server keeps
  limbo from hibernating it, and load balancing does not move a game server whose devbox runs.
- **Activity log.** Sign-ins, `ph` power actions and work in the devbox show on the game server's
  activity log.
- The Plus page of [plugged-host-economy](/plugins/economy/) lists the devbox resources of each
  tier while devboxes are on.

## Requirements

- Requires [plugged-host-core](/plugins/core/) (its mount guard),
  [plugged-host-servers](/plugins/servers/), [plugged-host-economy](/plugins/economy/) (Plus) and
  [plugged-host-abuse](/plugins/abuse/). Devboxes stay off while plugged-host-abuse is disabled.
- Optional: [plugged-host-storage](/plugins/storage/) and [plugged-host-limbo](/plugins/limbo/),
  which leave devbox servers alone.
- **Abuse protection in suspend mode** with its [node agent](/nodes/abuse-agent/) reporting on
  every node that runs devboxes.
- **Nodes prepared for devboxes**: the Wings data directory in Wings' `allowed_mounts`, the node
  firewall, the devbox image, and spare allocations. See [Devboxes on nodes](/nodes/devboxes/).
- **The devbox image**, by default `ghcr.io/plugged-host/devbox:<release>` (for example `2.2.0`),
  pullable by the nodes.
- **The scheduler**, which runs the reconcile every minute (idle stops, cleanup).
- For VS Code in the browser (optional): a domain of its own on Cloudflare, a Cloudflare API token
  and nginx on the panel box.

## Setup

The full steps are in [Devboxes on nodes](/nodes/devboxes/). In short:

1. Turn on abuse protection in suspend mode, with the agent on every devbox node.
2. Enable the plugin and run the migrations, then create the devbox egg and the system account:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan plugged-host:devbox-setup
   ```

3. Prepare each node: `allowed_mounts`, the node firewall, the image.
4. Switch devboxes on in Admin › Plugins › plugged.host Devbox › Settings.
5. Check: `sudo -u www-data php artisan plugged-host:doctor plugged-host-devbox`.

## Settings

Admin › Plugins › plugged.host Devbox › Settings.

### Devboxes

| Setting | Default | What it does |
|---|---|---|
| Devboxes on (`DEVBOX_ENABLED`) | `false` | Shows "Open in VS Code" and allows devboxes. Off hides the section and refuses new devboxes; running ones stop at the next reconcile. |
| Image (`DEVBOX_IMAGE`) | empty | The image Wings runs. Empty means this release's tag, `ghcr.io/plugged-host/devbox:<release>`. A digest (`…@sha256:…`) pins one exact build; a leading `~` makes Wings use a local image without pulling. Each devbox takes a change at its next start. |

### Plus and PlusPlus

Resources per devbox, on top of the game server's own. New values apply to devboxes created
afterwards. CPU is in percent of one thread (100 = one thread).

| Setting | Default | What it does |
|---|---|---|
| Plus › CPU (`DEVBOX_PLUS_CPU`) | `200` | CPU limit of a devbox paid by Plus, 50 to 1600. |
| Plus › Memory (`DEVBOX_PLUS_MEMORY`) | `2048` | Memory in MiB, 512 to 65536. |
| Plus › Disk (`DEVBOX_PLUS_DISK`) | `5120` | Disk for the home folder in MiB, 1024 to 262144. |
| PlusPlus › CPU (`DEVBOX_PLUSPLUS_CPU`) | `400` | CPU limit of a devbox paid by PlusPlus. |
| PlusPlus › Memory (`DEVBOX_PLUSPLUS_MEMORY`) | `4096` | Memory in MiB. |
| PlusPlus › Disk (`DEVBOX_PLUSPLUS_DISK`) | `10240` | Disk in MiB. |

### In the browser

| Setting | Default | What it does |
|---|---|---|
| Domain (`DEVBOX_WEB_DOMAIN`) | empty | The domain devboxes answer under, as `https://<slug>.<domain>`. Empty switches the browser version off. Use a domain your panel's session cookie does not cover. Run `plugged-host:devbox-web-setup` after changing it. |
| Edge IPv4 (`DEVBOX_WEB_ORIGIN_IP`) | empty | Public IPv4 of the panel box (the edge). Every devbox's DNS record points here. |
| Cloudflare API token (`DEVBOX_CLOUDFLARE_TOKEN`) | empty | A token with Zone DNS edit on the domain's zone, for the devbox DNS records. Only shown when the subdomains plugin is not enabled; with it, the subdomains plugin's token is used. Leave blank to keep the stored one. |

### Lifecycle

| Setting | Default | What it does |
|---|---|---|
| Stop after no connection for (`DEVBOX_IDLE_MINUTES`) | `15` | Minutes without a connection before the panel stops a devbox, 1 to 1440. |
| Stop after running for (`DEVBOX_MAX_HOURS`) | `12` | Hours after a start when the panel stops a devbox, connected or not, 1 to 168. Connect codes also expire then. |
| Running at once per person (`DEVBOX_RUNNING_PER_USER`) | `2` | Devboxes one person may have running: their own plus the shared ones on servers they own, 1 to 20. |
| Delete when unused for (`DEVBOX_CLEANUP_DAYS`) | `14` | Days without use after which a devbox is deleted with its home folder, 1 to 365. |

### Only in `.env`

| Setting | Default | What it does |
|---|---|---|
| `DEVBOX_SYSTEM_USER` | `ph-devbox` | Username of the account that owns every devbox server. Nobody signs in as it. |
| `DEVBOX_PANEL_URL` | `APP_URL` | Where devboxes reach the panel (boot report, heartbeat, sign-ins, `ph`). |
| `DEVBOX_PKI_PATH` | `storage/app/private/plugged-host-devbox` in the panel directory | Where the devbox CA and the edge's client certificate live. nginx reads `edge.crt`, `edge.key` and `ca.crt` from here. |

## Commands

| Command | What it does |
|---|---|
| `plugged-host:devbox-setup` | Installs or updates the devbox egg (with the image from the settings) and creates the system account. Safe to run again; run it after an update or an image change. |
| `plugged-host:devbox-web-setup` | For VS Code in the browser: creates the devbox CA and the edge's client certificate if missing, makes sure every running devbox has its DNS record, and prints the certificate paths nginx needs. `--no-dns` leaves DNS alone. |
| `plugged-host:devbox-reconcile` | Stops idle, overdue or no-longer-allowed devboxes, finishes stops Wings has not confirmed (kills after 60 seconds), kills devbox containers nothing in the panel allows, and removes orphaned, moved or unused devboxes. `--dry-run` only says what it would do. |

The scheduler runs `plugged-host:devbox-reconcile` every minute in the background, never two at
once. It needs the scheduler: a devbox cannot stop itself, because Wings would restart it.

## Doctor checks

- **Egg and system user**: warns "not ready" until devboxes are on, plugged-host-abuse is enabled
  and both migrations ran; fails when the devbox egg or the system account is missing (run
  `plugged-host:devbox-setup`).
- **Image**: ok for a pinned digest, warns while the image is a tag, because tags move.
- **Reconcile (idle stop)**: fails when the reconcile has not run in the last three minutes, which
  usually means the scheduler is not running.
- **Nodes mount game files**: fails naming the nodes where a devbox found no `/server`. Those
  nodes lack the Wings data directory in `allowed_mounts` (see
  [Devboxes on nodes](/nodes/devboxes/)).

## Notes

- **Pin the image.** The release tag moves with every build of the image. Set `DEVBOX_IMAGE` to
  the digest you tested, `ghcr.io/plugged-host/devbox@sha256:<digest>`.
- **Stops never fail open.** A stop marks the devbox as stopping, and from then on the panel
  refuses its token, so `ph` closes every session at its next heartbeat. The token is retired
  only once Wings reports the devbox offline. The reconcile asks again every minute and kills
  the devbox when a stop takes longer than 60 seconds.
- **The panel is the gatekeeper.** When the panel answers a devbox with 401 or 403, `ph` empties
  its access list, closes every SSH and browser session and ends every other process in the
  devbox. When the panel does not answer for 5 minutes, `ph` closes every session until it
  answers again. A panel outage therefore disconnects everyone in a devbox.
- **Node capacity.** Devbox servers count in Pelican's node memory and disk math like any server,
  and each takes one allocation from the node.
- **Removing a game server, user or subuser** removes or stops the matching devboxes right away,
  not at the next reconcile.
- **Lifting an abuse block by hand.** A block outlives its finding when the finding's server was
  deleted. To lift it anyway, in tinker:

  ```php
  PluggedHost\Devbox\Models\DevboxBlock::query()->where('user_id', <id>)->update(['lifted_at' => now()]);
  ```

- **Wording.** The settings page, the egg and a few messages name plugged.host, and the settings
  page and doctor point at a helper script from plugged.host's own tooling for the node change.
  The manual steps are in [Devboxes on nodes](/nodes/devboxes/). The domain field refuses only
  plugged.host's own domain; keeping your devbox domain away from your panel's cookie is up to
  you.
