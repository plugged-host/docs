---
title: Introduction
description: What a plugged.host panel is made of, what runs where, and what these docs cover.
---

A plugged.host panel is [Pelican Panel](https://pelican.dev) with the plugged.host plugins in its
`plugins/` directory. Pelican's own code stays exactly as released: everything plugged.host adds
hooks into the panel the way Pelican plugins are meant to. That keeps upgrades simple and keeps
the panel's AGPL-licensed source untouched.

The plugins run [plugged.host](https://plugged.host) in production. They are written for
plugged.host first, so expect its opinions (free plans, credits, ads, its look) rather than a
general-purpose product. Most of them can be switched off, and most behaviour is a setting.

## What runs where

| Piece | Where it runs | Code | Guide |
|---|---|---|---|
| Panel: Pelican and the plugins, the queue worker and the scheduler | the panel box | [plugged-host/plugins](https://github.com/plugged-host/plugins) | [Panel](/panel/pelican/) |
| Discord bots (rux, which is also the membership bot, and neo) | the panel box, started by the scheduler | `plugged-host-discord`, `plugged-host-ai` | [Discord and AI](/discord/membership-bot/) |
| Wings and the abuse agent | every game node | Wings from Pelican, the agent from `plugged-host-abuse` | [Nodes](/nodes/wings/) |
| Storage agent: mirrors of every server, failover archives | a storage box (and optionally a backup server) | `plugged-host-storage/agent` | [Storage and failover](/storage/storage-box/) |
| FiveM image | pulled by nodes from GitHub's container registry | `plugged-host-fivem/image` | [FiveM image](/nodes/fivem-image/) |
| Status page and its prober | Cloudflare Workers | [plugged-host/status](https://github.com/plugged-host/status) | [Status page](/status/status-worker/) |
| Website | Cloudflare Workers | [plugged-host/site](https://github.com/plugged-host/site) | [Website](/status/website/) |

The smallest useful setup is one panel box and one node. The storage box, the Discord bots,
neo and the status page are all optional and can be added later.

## The plugins

Sixteen first-party plugins, plus three third-party ones shipped in the same repository. Core is
required by all the others; each plugin's page lists what else it needs.

| Plugin | What it does |
|---|---|
| [Core](/plugins/core/) | The platform: suspension, account deletion, hardening, error pages, node telemetry, the release version, and the hooks the others share |
| [Servers](/plugins/servers/) | Self-service server creation, plans, locations, transfers, node balancing |
| [Economy](/plugins/economy/) | Credits, tokens, Plus, the stores and resource plans |
| [Minecraft](/plugins/minecraft/) | Onboarding, Modrinth/CurseForge/Spigot, installed-jar detection, worlds, Geyser |
| [FiveM](/plugins/fivem/) | `server.cfg` form, txAdmin frameworks, players, artifacts with auto-update |
| [Devbox](/plugins/devbox/) | VS Code next to a game server, over SSH or in the browser |
| [Limbo](/plugins/limbo/) | Hibernates idle servers and brings them back on demand |
| [Queue](/plugins/queue/) | A start queue when a node is full |
| [Ads](/plugins/ads/) | Ad units, sponsored banners and the ad-funded start room |
| [Storage](/plugins/storage/) | Off-node mirrors, automatic node failover, the backups portal |
| [Abuse](/plugins/abuse/) | File, startup and console scans, a CPU watch and a node agent |
| [Status](/plugins/status/) | Incidents, maintenance and the status page export |
| [Discord](/plugins/discord/) | Discord membership, invite and boost rewards, the bot framework |
| [AI](/plugins/ai/) | neo, the assistant in the panel and on Discord, and rux, the moderation bot |
| [noprofit.space](/plugins/noprofit/) | Optional link to noprofit.space accounts; turn it off on your own panel |
| [Theme v2](/plugins/theme-v2/) | The look |
| [Third-party](/plugins/third-party/) | `announcements`, `subdomains`, `mclogs-uploader` |

## What these docs don't cover

- **noprofit.space.** plugged.host signs users in through noprofit.space, a separate,
  closed-source account service. The `plugged-host-noprofit` plugin connects the two. You don't
  need it: with that plugin disabled, every plugin falls back to the panel's own sign-in, plans
  and credits, and that is the setup described here.
- **plugged.host's own machines.** How plugged.host itself is hosted (its fleet, its two-box
  panel, its hardware) is not part of these docs. Examples use placeholders such as
  `panel.example.com` and `node1.example.com`.
- **Pelican itself.** Installing Pelican and Wings is covered by
  [Pelican's documentation](https://pelican.dev/docs); these pages only add what plugged.host
  needs on top.

## Licence

The plugins are MIT-licensed, © noprofit.space. The three third-party plugins keep their own
GPL-3.0 licence. Pelican Panel is a separate project under AGPL-3.0. Give your panel its own name
and logo: the [site](https://github.com/plugged-host/site) and
[status](https://github.com/plugged-host/status) repositories state that the plugged.host name and
logo are not covered by their licence.
