---
title: Requirements
description: The machines, software and accounts a plugged.host panel needs, and which of them are optional.
---

## Panel box

| What | Needs |
|---|---|
| Operating system | A current 64-bit Linux, for example Debian 12 or newer or Ubuntu 22.04 or newer. Release binaries exist for `x86_64`, `aarch64`, `riscv64` and `ppc64le` |
| Memory | 1 GB is plenty for the panel itself: it usually stays well under 100 MB. PostgreSQL and Redis need their own share |
| Disk | A few GB: the binary is around 100 MB, the rest is the database and logs |
| PostgreSQL | 15 or newer. The panel uses PostgreSQL only |
| Redis or Valkey | Any recent version. A shared instance is fine: give the panel its own database number and key prefix |
| Web server | nginx (or another reverse proxy) with a TLS certificate for the panel's domain |
| Domain | One name for the panel, for example `panel.example.com` |

The panel can run as several instances on one database (for example two boxes behind a load
balancer). Exactly one of them runs the background tasks; see `APP_PRIMARY` in
[configuration](/panel/configuration/).

## Nodes

| What | Needs |
|---|---|
| Operating system | 64-bit Linux that runs Docker |
| Docker | Docker Engine, as for upstream Wings ([Calagopus: Wings](https://calagopus.com/docs/wings)) |
| Wings | The [plugged.host Wings fork](/nodes/wings/). Stock wings-rs works too, but several features then skip the node |
| Name and certificate | A DNS name per node (`node1.example.com`) with a TLS certificate for the Wings API |
| Ports | The Wings API (8080 by default), SFTP (2022 by default) and the game ports you hand out (the panel makes allocations in `25000-50000` by default) |

A node's DNS name must point at the node itself, not at a proxy: game traffic, SFTP and the Wings
API go straight to it.

## Building from source (optional)

Only if you build the panel yourself instead of using the release binaries. The Rust build is heavy:
plan for 8 GB of memory and 20 GB of disk, and build on a different machine than the panel box if
it is small. Details: [building from source](/panel/building/).

## Outside services (all optional)

| Service | Used by |
|---|---|
| An SMTP server (or another mail transport) | Password resets, verification mails, backup mails. Configured in Admin › Settings › Mail, as upstream |
| Off-node backup storage (for example S3-compatible) | [Node failover](/nodes/failover/) and [limbo](/starts/limbo/) restore servers from backups kept off their node; the [backups page](/servers/backups/) keeps deleted servers' backups there |
| Cloudflare: a zone and an API token | [Subdomains](/servers/subdomains/), and the [status Worker](/status/status-worker/) if you use it |
| Discord applications | [Discord integration](/discord/integration/), [rux](/discord/rux/), [neo on Discord](/ai/neo-discord/) |
| An AI provider's API key | [neo](/ai/neo/), and rux's AI |
| Ad and link-shortener accounts | [Ads](/economy/ads/), tokens from [sponsored links](/economy/credits-and-tokens/) |
| A CurseForge API key | CurseForge search on the [Minecraft](/games/minecraft/) pages |
| A captcha provider | Sign-up and sign-in protection, as upstream (Admin › Settings › Security › Captcha) |

## Skills

You should be comfortable on a Linux shell: systemd units, nginx, PostgreSQL roles, DNS and TLS
certificates. Nothing here needs a programming language unless you build from source.
