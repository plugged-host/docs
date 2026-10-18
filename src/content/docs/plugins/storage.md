---
title: Storage
description: Off-site copies of every server on a storage box, automatic recovery when a node dies, and the backups portal.
sidebar:
  order: 10
---

plugged-host-storage keeps a copy of every server on a separate storage box, refreshed every 30
minutes, and uses it in three ways: owners download it (from the server's Backups page or the
backups portal), the panel restores a node's servers from it when the node dies, and a server
deleted by an admin stays downloadable for a few days. The copying is done by a small Node.js
agent on the storage box; the panel tells it what to copy and serves its updates. An optional
second box, the backup server, can copy everything too and serve archives faster.

## What it does

- **Mirror.** Every minute the agent asks the panel for its plan (the list of servers, their
  nodes and volume paths). Each server is copied once per mirror interval (30 minutes) with
  `rsync` over SSH, pulled from its node by the agent with the box's own `ph-mirror` key, so
  no panel credential sits on the nodes. Only changed files cross the network. After each
  completed pass the agent takes a hard-linked snapshot and keeps the newest three.
- **Leaves out what a server can rebuild:** caches, temp files, logs, crash reports, core dumps,
  `node_modules`, Python virtualenvs, FiveM's `cache` and `alpine` runtime. The list is
  `EXCLUDES` in `agent/agent.mjs`; limbo uses the same list.
- **Archives on demand.** A server's copy is packed into a `.tar.gz` from its newest snapshot
  when someone asks for it, behind a signed link that expires after 15 minutes. Browsers get the
  download streamed while it is packed; Wings gets the complete file. A built archive is reused
  until the next pass.
- **Off-site copy on the Backups page.** Every server's Backups page shows an "Off-site copy"
  card (available, waiting for the first copy, or unreachable; when it was last copied and its
  size) with a Download button for users who may download backups, and an "Off-site Backups"
  button that opens the backups portal.
- **Backups portal.** A page where owners sign in with their panel account and download the copy
  of each of their servers, including ones an admin deleted recently. It is at the panel's
  `/backups`, or on a host name of its own.
- **Failover.** When a node stops answering, its servers are moved to healthy nodes and restored
  from their latest copy. See [Failover](/storage/failover/).
- **Deleted servers.** A server deleted by an admin or by the panel keeps its copy for 7 days.
- **Cleanup.** Once an hour the agent reports the folders it holds and removes the ones the
  panel names. It never deletes anything on its own.
- **Self-updating agent.** The agent updates itself from the panel when the plugin's agent code
  changes.
- **Client API:** `GET /api/client/servers/{server}/replica` returns the freshest copy's time,
  size and state.

Servers that are never copied: system servers (devboxes), servers with an unlimited disk
(`0`), and servers that are still installing.

### Failover modes

`STORAGE_FAILOVER_MODE` decides what happens when a node has failed the panel's minute probe
`STORAGE_FAILOVER_AFTER_FAILURES` times in a row (5 by default) and no storage box can reach it
either:

| Mode | What happens |
|---|---|
| `off` | Nothing: the sweep does not run. Recoveries under way wait where they are until the mode is `notify` or `auto` again. |
| `notify` | Each owner gets a panel notification that the node appears offline, at most once a day. Nothing is moved. |
| `auto` (default) | Each server is moved to a healthy node and restored from its latest copy, then the owner is told its new address. |

Recovery needs plugged-host-servers (it picks the destination node). The whole sequence, the
limits and what to do with the old node are on the [Failover](/storage/failover/) page.

### Deleted servers

Every server deletion is recorded, and who deleted it decides how long its copy stays:

| Deleted by | Copy kept |
|---|---|
| An admin, or the panel itself (a command, a queued job, the abuse purge) | `STORAGE_DELETED_HOLD_DAYS` (7) days from the deletion. The owner still sees the server, under its ID, in a "Deleted servers" section of the backups portal, with a download. |
| Its owner | Removed at the agent's next hourly cleanup. |

The signed-in user decides: an admin who deletes a server they own counts as its owner.

A folder on the box that the panel has no record of (deleted before the plugin recorded
deletions, or missed) is kept for the hold counted from its last copy, and at least a day after
the agent first reports it. Cached archives older than a day are removed too.

Admins see the list with `plugged-host:deleted-servers`, get a signed download link with
`--url`, and keep one longer with `--extend`. `STORAGE_PURGE_DELETED=false` stops all removals
while still recording holds.

### Agent versions and updates

The agent's version is the plugins release plus the start of a hash of the agent's code, for
example `2.2.0.1a2b3c4` (see [Versions](/reference/versions/)). It changes only when the release
or the agent code changes.

Every 15 minutes the agent fetches the panel's manifest
(`/plugged-host/storage/agent/manifest.json`). The panel signs it with each box's secret, and
the agent only accepts it when one signature is its own. When the version differs from the one
it runs, it downloads the bundle, checks its SHA-256 against the manifest, unpacks it into
`/opt/plugged-host-storage/releases/<version>`, points `current` at it and exits; systemd starts
the new version. So updating the plugins on the panel updates every agent within about 15
minutes. Older releases stay in `releases/`.

### Backups portal

The portal is part of the panel. Where it answers depends on **Portal address**
(`BACKUPS_PORTAL_URL`):

- **Empty (the default):** at `/backups` on the panel, such as
  `https://panel.example.com/backups`. It uses the panel's own session: a signed-in user sees
  their servers at once; anyone else gets a "Sign in" button that opens the panel's sign-in page
  and comes back. It has no Log out button of its own there: signing out of the panel signs out
  of the portal. Nothing to set up.
- **A host name of its own**, such as `https://backups.example.com`: point the name at the panel
  box, serve it with the vhost on the [Failover](/storage/failover/#the-backups-portal) page and
  set the address. The portal keeps its own session there. A visitor who is signed in to the
  panel is signed in to the portal in one redirect; anyone else gets a "Sign in" button that
  goes through the panel's sign-in page. The page also still answers at the panel's `/backups`.

An address on the panel's own host counts as empty. Every link to the portal follows the
setting: the "Off-site Backups" button and the card on a server's Backups page, and
[Theme v2](/plugins/theme-v2/)'s Backups row in the sidebar.

The page carries the panel's name (`APP_NAME`), favicon (`APP_FAVICON`) and logo (`APP_LOGO`,
left out when unset), and is shown in the user's panel language (English or German). Its other
links appear only when they have somewhere to go:

| Link | Shown when |
|---|---|
| Status | `STATUS_PAGE_URL` from [core](/plugins/core/), or the [status plugin](/plugins/status/)'s `STATUS_RSS_BASE_URL`, is set (the first wins). |
| Discord support | `DISCORD_INVITE_URL` from the [Discord plugin](/plugins/discord/) is set. |
| Store | The [economy](/plugins/economy/) plugin's Resource Store page exists. |
| Sign in with Discord | plugged-host-discord is enabled. |

## Requirements

- `plugged_host.requires`: `plugged-host-core` (its node telemetry is how the panel sees a node
  go down).
- `plugged_host.optional`:
  - `plugged-host-servers`: picks where a failed node's servers go. Without it no recovery
    starts.
  - `plugged-host-discord`: the portal shows the user's Discord avatar and a "Sign in with
    Discord" button.
  - `plugged-host-theme-v2`: the portal uses the theme's accent colour.
- A storage box: a Debian or Ubuntu machine with a large separate disk and a DNS name that the
  panel, your Wings nodes and your users' browsers reach over HTTPS. The installer brings
  Node.js 26, rsync and pigz.
- SSH from the box to every Wings node, as root, with the box's mirror key.
- The panel's scheduler running every minute (the failover sweep and core's node probe). See
  [Queue and scheduler](/panel/queue-and-scheduler/).

## Setup

1. Run the plugin's migrations: `sudo -u www-data php artisan migrate` (in `/var/www/pelican`).
2. Set up the storage box with the one-command installer: [Storage box](/storage/storage-box/).
3. Authorize the box's mirror key on every Wings node:
   `curl -fsSL https://panel.example.com/plugged-host/storage/node/install.sh | sudo bash`.
4. The backups portal works at once at `https://panel.example.com/backups`. To give it a host
   name of its own, see [The backups portal](/storage/failover/#the-backups-portal).
5. Check it: `sudo -u www-data php artisan plugged-host:doctor plugged-host-storage`.

Optional: a second box, see [Backup server](/storage/backup-server/).

## Settings

Admin › Plugins › plugged.host Storage › Settings. The page opens with **Set up a storage
box**, which shows a fresh one-time setup command each time it opens (see
[Storage box](/storage/storage-box/)). Secrets are never shown: leave a secret field blank to
keep the stored value.

### Storage Agent

| Setting | Default | What it does |
|---|---|---|
| Agent URL `STORAGE_AGENT_URL` | empty | Where the storage box's agent answers, e.g. `https://storage.example.com`. Used for archive links and node probes. The installer fills it in. |
| Agent Secret (HMAC) `STORAGE_AGENT_SECRET` | empty | The secret the panel and the agent sign their requests with (`PH_AGENT_SECRET` on the box). The first setup creates it. |
| Mirror SSH public key `STORAGE_MIRROR_PUBLIC_KEY` | empty | The box's `ph-mirror` key. The installer fills it in; the node script authorizes it. |
| Mirror key's addresses `STORAGE_MIRROR_FROM` | empty | The IPs or CIDR blocks the box reaches the nodes from, comma-separated. When set, nodes accept the key only from there (`from=` in `authorized_keys`). Run the node script again after a change. Empty: from anywhere. |
| Signed URL TTL (seconds) `STORAGE_SIGNED_TTL` | `900` | How long an archive link or a node probe URL stays valid (60 to 86400). |
| Agent Bundle Version `STORAGE_AGENT_VERSION` | empty (computed) | Read-only on the page: the version agents are offered. Set it in `.env` only to force a version string. |

### Backup server

The same connection settings for the optional second box, plus its own setup command. See
[Backup server](/storage/backup-server/).

| Setting | Default | What it does |
|---|---|---|
| Agent URL `STORAGE_BACKUP_AGENT_URL` | empty | Where the backup server's agent answers, e.g. `https://backup.example.com`. Its installer fills it in. |
| Agent Secret (HMAC) `STORAGE_BACKUP_AGENT_SECRET` | empty | The backup server's own secret. Its first setup creates it. |
| Mirror SSH public key `STORAGE_BACKUP_MIRROR_PUBLIC_KEY` | empty | The backup server's mirror key. Its installer fills it in. |
| Mirror key's addresses `STORAGE_BACKUP_MIRROR_FROM` | empty | Like `STORAGE_MIRROR_FROM`, for the backup server's key. |

### Replication

| Setting | Default | What it does |
|---|---|---|
| Mirror Interval (minutes) `STORAGE_MIRROR_INTERVAL_MIN` | `30` | How often each server is copied. The installer writes it into the agent's settings, so after a change run the setup command on the box again. The panel also uses it to judge freshness (doctor, which box serves an archive). |
| Mirror Snapshots Retained `STORAGE_MIRROR_SNAPSHOTS` | `3` | Snapshots kept per server (1 to 100). Sent with every plan, so a change applies within a minute. |
| Minimum Free Space (%) `STORAGE_MIN_FREE_PERCENT` | `10` | Below this much free space on the box, the agent skips passes and reports an error instead of writing a truncated copy. Written into the agent's settings by the installer, like the interval. |
| Daemon Volume Base `STORAGE_DAEMON_BASE` | `/var/lib/pelican/volumes` | Where server volumes are on a node, used only for a node that has no volume path of its own. |

### Backups portal

| Setting | Default | What it does |
|---|---|---|
| Portal address `BACKUPS_PORTAL_URL` | empty | The portal's own address, such as `https://backups.example.com`, with that host name pointed at the panel's web server. Empty, or an address on the panel's own host: the portal is at the panel's `/backups`. See [Backups portal](#backups-portal). |

### Failover

| Setting | Default | What it does |
|---|---|---|
| Failover Mode `STORAGE_FAILOVER_MODE` | `auto` | `off`, `notify` or `auto`; see [Failover modes](#failover-modes). |
| Failover After N Failures `STORAGE_FAILOVER_AFTER_FAILURES` | `5` | Failed minute probes in a row before a node counts as down (1 to 100). |
| Max Failovers Per Run `STORAGE_FAILOVER_MAX_PER_RUN` | `5` | The most servers one sweep starts recovering, or notifies about in `notify` mode (1 to 100). |

### Only in .env

| Setting | Default | What it does |
|---|---|---|
| `STORAGE_FAILOVER_MAX_IN_FLIGHT` | `3` | Recoveries installing or restoring at the same time, in `auto` mode. |
| `STORAGE_DELETED_HOLD_DAYS` | `7` | Days an admin-deleted server's copy is kept. |
| `STORAGE_PURGE_DELETED` | `true` | `false` stops the agents' cleanup; holds are still recorded. |
| `LIMBO_NODE_TAG` | `limbo` | The tag that marks limbo nodes. Set on the [Limbo](/plugins/limbo/) settings page; storage reads it too. |

## Commands

| Command | What it does |
|---|---|
| `plugged-host:storage-setup` | Prints the command that sets the storage box up, with a one-time code valid for an hour. `--backup` prints the backup server's. |
| `plugged-host:failover-sweep` | Runs the failover sweep now and prints a summary (`mode`, nodes down, recoveries started, in flight, moved on). `--dry-run` (or `--status`) detects without recovering or notifying; `--drill=<server id>` rehearses a real recovery of one server; `--resume=<record id>` retries the restore of a failed recovery. `--drill` and `--resume` are refused while the mode is `off`. See [Failover](/storage/failover/#commands). |
| `plugged-host:deleted-servers` | Lists deleted servers whose copy is still kept (`--all` also lists removed and due ones). `--url=<uuid>` prints a signed download link (a uuid or its first 8 characters); `--extend=<uuid> --days=N` keeps a copy N days from now (default 7). |

On the scheduler: the failover sweep runs every minute (`plugged-host-storage:failover-sweep`).
It moves recoveries under way one step on, then looks for dead nodes. Everything else (mirror
passes, cleanup, updates) is timed by the agent on the box.

## Doctor checks

`sudo -u www-data php artisan plugged-host:doctor plugged-host-storage` checks:

| Check | Passes when |
|---|---|
| Storage agent configured | `STORAGE_AGENT_URL`, `STORAGE_AGENT_SECRET` and `STORAGE_MIRROR_PUBLIC_KEY` are set. |
| Backup server | No backup server is set up, or all three of its settings are. Warns while migration 004 has not run (the backup server's reports are dropped until then). |
| Mirror passes | The `server_replicas` table exists and the newest copy is less than three mirror intervals old. Warns when nothing has been copied yet. |
| Deleted-server copies | The `storage_deleted_servers` table exists and the agent's hourly cleanup report is less than three hours old. Shows how many copies are being kept. |

With a backup server, the last two run again for it, labelled "(backup server)".

## Notes

- The agent's mirror interval and free-space floor are copied from the panel when the installer
  runs. Change them on the panel, then run the setup command on the box again (or edit
  `/etc/plugged-host-storage.env` and restart the agent).
- Changes made since a server's last completed copy are not in it: up to one mirror interval,
  plus the time a pass takes.
- A server is recovered once per outage: after a finished recovery (or drill) it is recovered
  again when the node it runs on goes down. See [Failover](/storage/failover/#limits).
- The agent and the panel reject each other's requests when their clocks differ by more than
  five minutes. Keep NTP running on the box.
- A download link from the portal or the Backups page is valid for `STORAGE_SIGNED_TTL` (15
  minutes). Reload the page for a new one.
- Older releases had a Daily Backup section (`STORAGE_DAILY_BACKUP`,
  `STORAGE_DAILY_BACKUP_HOUR`). Nothing ever read them and they are gone: delete the lines from
  `.env` if they are there; left in, they do nothing.
