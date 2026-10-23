---
title: Requirements
description: The machines, software, domains and accounts a plugged.host panel needs.
---

## The panel box

One Linux server for Pelican, the plugins, the queue worker, the scheduler and the Discord bots.
plugged.host runs Debian 13; anything Pelican supports works.

| | |
|---|---|
| CPU and memory | 2 cores and 4 GB RAM to start. The queue worker, the scheduler and up to three Discord bots each run their own PHP process, so leave headroom. |
| Pelican Panel | **v1.0.0-rc.2**, the version the plugins are built against. |
| PHP | **8.5** (Pelican also accepts 8.4) with FPM and the extensions Pelican lists (`gd`, `mysql`, `mbstring`, `bcmath`, `xml`, `curl`, `zip`, `intl`, `sqlite3`), plus `pcntl`, `posix` and `openssl` for the Discord bots. `exec` must be allowed: the bots' supervisor and the panel's asset build use it. |
| Database | MariaDB or MySQL. plugged.host runs MariaDB; the plugins are not tested on SQLite or PostgreSQL. |
| Cache, sessions, queue | Redis, or the database drivers. Both work. |
| Web server | nginx (a vhost is on [Web server](/panel/web-server/)). |
| Build tools | Composer, Git, Node.js 22 or newer with Yarn: the plugins bring their own stylesheets, so the panel's assets are rebuilt after installing or updating them. |
| Cron and systemd | One `schedule:run` line in the web user's crontab and a queue worker service. |

## Game nodes

Every node runs [Wings](https://pelican.dev/docs/wings/install) with Docker, like any Pelican node.

- A public IPv4 address and a DNS name per node (`node1.example.com`). Players connect to that
  name, so it must point straight at the node: **not proxied** through Cloudflare.
- Python 3 for the [abuse agent](/nodes/abuse-agent/) (standard library only).
- SSH reachable from the storage box if you use [storage and failover](/storage/storage-box/).

## Optional pieces

| You want | You need |
|---|---|
| Mirrors and automatic failover | A [storage box](/storage/storage-box/) with a large separate disk, reachable over HTTPS under its own name (DNS only, not proxied). A second, faster [backup server](/storage/backup-server/) is optional. |
| Discord rewards and bots | Up to three [Discord applications](/discord/membership-bot/): the membership bot, neo and rux. |
| neo, the AI assistant | An API key for at least one AI provider (see [neo](/discord/neo/)). |
| Status page | A Cloudflare account for the [status Worker](/status/status-worker/) (the Workers Free plan is enough). |
| Subdomains for servers | A domain on Cloudflare and an API token for its DNS ([third-party plugins](/plugins/third-party/)). |
| CurseForge modpacks | A CurseForge API key ([Minecraft](/plugins/minecraft/)). |
| Ads | Your own ad network account and ad units ([Ads](/plugins/ads/)). |

## Domains

| Name | Points at | Proxied |
|---|---|---|
| `panel.example.com` | the panel box | optional |
| `backups.example.com` (backups portal) | the panel box | optional |
| every node's FQDN | that node | **no**: game ports, Wings and SFTP need the real address |
| `storage.example.com`, `backup.example.com` | the storage box, the backup server | no: archives stream for minutes |
| `status.example.com` | the status Worker | yes (a Workers custom domain) |
