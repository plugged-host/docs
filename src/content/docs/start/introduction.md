---
title: Introduction
description: What a plugged.host panel is made of, what runs where, and what these docs cover.
---

plugged.host runs on its own panel: a fork of [Calagopus](https://calagopus.com), the open-source
game-server panel written in Rust (Axum) with a React (Mantine) frontend. plugged.host's features
are written straight into the panel's source, as if Calagopus had always had them, and its nodes
run a matching fork of Calagopus Wings. Both are MIT licensed and public:

- Panel: [plugged-host/panel](https://github.com/plugged-host/panel)
- Wings: [plugged-host/wings](https://github.com/plugged-host/wings)

These docs explain how to run a panel like plugged.host with them: installing it, connecting nodes,
and setting up each feature plugged.host adds. Everything the fork leaves as Calagopus has it
(eggs and nests, locations, databases, backups, mail, OAuth, the API) is covered by the
[Calagopus documentation](https://calagopus.com/docs); these pages link there instead of repeating
it.

The fork is written for plugged.host first, a free host for game servers and bots, so expect its
opinions: free allowances, credits and tokens, ads, start queues, idle servers parked away. Almost
all of it is a setting, and the features that need an outside service are off until you configure
them.

## What runs where

| Piece | Where it runs | Code | Guide |
|---|---|---|---|
| The panel: one binary, `panel-rs`, with the web frontend built in | the panel box, behind nginx | [plugged-host/panel](https://github.com/plugged-host/panel) | [Install the panel](/panel/install/) |
| PostgreSQL and Redis (or Valkey) | the panel box, or anywhere the panel reaches | upstream | [Database and Redis](/panel/database/) |
| Background tasks and the Discord bots | inside the panel process (the instance with `APP_PRIMARY=true`) | the panel | [Configuration](/panel/configuration/) |
| Wings (wings-rs), the node daemon that runs the containers | every node | [plugged-host/wings](https://github.com/plugged-host/wings) | [Wings](/nodes/wings/) |
| Status page and its outside prober (optional) | Cloudflare Workers | [plugged-host/status](https://github.com/plugged-host/status) | [Status Worker](/status/status-worker/) |
| Website (optional) | Cloudflare Workers | [plugged-host/site](https://github.com/plugged-host/site) | [Website](/status/website/) |

The smallest useful setup is one panel box and one node. There is no queue worker, scheduler, cron
job or node agent to install: the panel runs its own background tasks, and the Wings fork answers
everything the panel asks of a node.

## What the fork adds

| Area | Features |
|---|---|
| Nodes | [Node telemetry](/nodes/telemetry/) every minute, [placement](/nodes/placement/) by real load with an automatic deployment pause, [allocations](/nodes/allocations/) made on demand, [node failover](/nodes/failover/) from off-node backups |
| Servers | Self-service [server creation](/servers/create-server/) within an allowance, [server settings](/servers/server-settings/) for users (resize, switch software, SFTP), [custom startup commands](/servers/startup-commands/), [moving servers](/servers/moving-servers/) between locations, [allowance cuts](/servers/allowance-cuts/), the [backups page](/servers/backups/), [subdomains](/servers/subdomains/), [server chat](/servers/server-chat/), [VS Code devboxes](/servers/devboxes/) |
| Starting servers | [Start gates](/starts/start-gates/), the [start queue](/starts/start-queue/), [limbo](/starts/limbo/) for idle servers |
| Games | [Minecraft](/games/minecraft/) pages (mods and plugins, worlds, players, modpacks, Bedrock), [FiveM](/games/fivem/) pages (server.cfg, frameworks, artifacts) |
| Accounts | [Admin › Users](/accounts/admin-users/), [notifications](/accounts/notifications/), the [welcome tour](/accounts/welcome-tour/), [reviews](/accounts/reviews/), [languages](/accounts/languages/), the optional [noprofit.space](/accounts/noprofit/) connection |
| Economy and ads | [Credits, tokens and memberships](/economy/credits-and-tokens/), [ads](/economy/ads/), the [partner program](/economy/partners/) |
| Safety | [Abuse protection](/safety/abuse/), [account standing](/safety/standing/), [suspension details](/safety/suspension/) |
| Discord and AI | [Discord integration](/discord/integration/), the [rux](/discord/rux/) moderation bot, the [neo](/ai/neo/) assistant and [neo on Discord](/ai/neo-discord/) |
| Operations | The [status page](/status/status-page/) data, the Health page ([troubleshooting](/panel/troubleshooting/)), [releases](/reference/versions/), the panel's look ([branding](/panel/branding/)) |

## What the fork removes

Some Calagopus features are hidden and their permissions never granted, so they cannot be used:
devices (Docker device passthrough), mounts, the extension manager, the update checker, the
private network ("Connections"), the server firewall, managed database instances (database
agents) and backup groups. Classic database hosts stay. Telemetry to calagopus.com is off by
default and stays a switch in Admin › Settings › General › Application.

## Off until you turn it on

| Feature | Needs |
|---|---|
| [noprofit.space](/accounts/noprofit/) sign-in and accounts | plugged.host's own account service; leave it off |
| [Status page](/status/status-page/) data | Admin › Settings › General › Status Page |
| [Discord](/discord/integration/), [rux](/discord/rux/), [neo on Discord](/ai/neo-discord/) | Discord applications and bot tokens |
| [neo](/ai/neo/) | an AI provider's API key |
| [Ads](/economy/ads/) and sponsored links for [tokens](/economy/credits-and-tokens/) | accounts with the ad and link networks |
| [Subdomains](/servers/subdomains/) | a Cloudflare zone and API token |
| [Reviews](/accounts/reviews/) | a review page of your own |
| [Welcome tour](/accounts/welcome-tour/) | nothing, it is a switch |

## Where to go next

Read the [requirements](/start/requirements/), then follow the [install order](/start/install-order/).
