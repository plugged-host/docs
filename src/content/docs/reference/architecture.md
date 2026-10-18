---
title: Architecture
description: How the plugins depend on each other, the contracts that make noprofit.space optional, and the rules that keep plugins independent.
---

## The panel stays upstream

Pelican's own source stays byte-for-byte as released. Everything plugged.host adds is a plugin
under `plugins/` and extends the panel only through the ways Pelican and Filament offer: service
providers (registered automatically from a plugin's `src/Providers/`), Filament page and resource
discovery, `configureUsing` on Filament components, render hooks, Livewire hooks and Laravel's
container.

A plugin's layout:

```
plugged-host-example/
  plugin.json                 id, namespace, panels, plugged_host.requires/optional, meta (Pelican's)
  config/plugged-host-example.php   every setting, read from .env with its default
  database/migrations/
  lang/{en,de}/strings.php
  resources/{views,css,js}/
  src/
    Providers/                service providers, schedule, routes, hooks
    Filament/{Admin,App,Server}/{Pages,Resources,Widgets}/
    Console/Commands/
    Services/  Models/  Policies/
```

## Who depends on whom

Each `plugin.json` declares, under `"plugged_host"`, what the plugin **requires** (it doesn't work
without them) and what it is **optional** with (it uses them when they are enabled and works
without them otherwise). Core depends on nothing.

| Plugin | Requires | Works with |
|---|---|---|
| `plugged-host-core` | – | – |
| `plugged-host-abuse` | core | – |
| `plugged-host-economy` | core | discord, ads, queue, devbox |
| `plugged-host-servers` | core, economy | ai, ads |
| `plugged-host-minecraft` | core, servers | ai, ads |
| `plugged-host-fivem` | core | – |
| `plugged-host-discord` | core | economy |
| `plugged-host-ai` | core, discord | economy, servers, ads |
| `plugged-host-queue` | core, servers | economy, ads |
| `plugged-host-limbo` | core, servers | economy, ads, storage |
| `plugged-host-ads` | core | economy |
| `plugged-host-storage` | core | discord, servers |
| `plugged-host-status` | core | – |
| `plugged-host-devbox` | core, servers, economy, abuse | storage, limbo |
| `subdomains` | core | economy, discord |
| `plugged-host-theme-v2` | core | economy |
| `plugged-host-noprofit` | core | economy, discord, ai, servers |

`plugged-host:doctor` prints this table for your panel, with the plugins that are off marked.

## noprofit.space is a plugin

plugged.host signs users in through noprofit.space, a separate account service. Nothing outside
`plugged-host-noprofit` talks to it. Every system that can use noprofit.space defines a contract in
the plugin that owns it, with a standalone default there; `plugged-host-noprofit` swaps in
noprofit.space's implementation only while it is enabled.

| Contract | Owner | Without noprofit.space (the default) |
|---|---|---|
| Account portal | core | Pelican's own sign-in and profile page, Discord sign-in through the panel |
| Compute plans | economy | resource tiers, limits and store prices from economy's settings; credits kept on the panel |
| Discord accounts and credit payouts | discord | the panel's own Discord links; giveaways and grants paid through economy |
| Discord servers status | discord | nothing to report: the Discord servers tab is hidden and the panel pays boost rewards itself |
| neo's backend, providers and settings | ai | AI providers and usage limits configured on the panel |

## Shared hooks

Plugins that would otherwise call each other go through hooks the owning plugin offers:

- **Start chain** (core): one hook on a server's Start button. Limbo (wake a hibernated server),
  the queue (wait for room on a full node) and ads (the start room) register as gates in it, in
  order, without knowing about each other.
- **Node telemetry** (core): every node is probed once a minute; servers, storage and status read
  the result instead of probing on their own.
- **Events** (servers): `ServerMoved` is sent when a transfer or a failover restore puts a server on
  another node (subdomains updates its DNS records); `ServerProvisioned` when a new server is
  created (minecraft prepares new Minecraft servers). The software switcher contract fills the
  "Server software" section of a server's settings page: a game plugin binds it (minecraft:
  loaders and versions), and without one the section is hidden.
- **Suspended server page** (core): what a suspended server shows, extended by abuse and limbo.

## Rules for plugin code

- **Ask whether a plugin is enabled, not whether its class exists.** Pelican autoloads every
  plugin's `src/` even while it is disabled, so `class_exists()` says nothing about its tables,
  routes or views. Use `PluggedHost\Core\Support\Plugins::enabled('plugged-host-x')` or
  `Plugins::available(SomeClass::class)`.
- **A table belongs to the plugin whose code uses it**, and its migration lives there.
- **Migration file names are global** across plugins (they share Laravel's migrations table): a
  migration moved between plugins keeps its exact file name.
- **Translation keys need the `strings.` segment**: `plugged-host-x::strings.group.key`. Without it
  the raw key is shown.

## Off the panel

| Piece | What it does | Talks to the panel |
|---|---|---|
| Discord bots | long-running artisan processes on the panel box, started and restarted by the scheduler | directly (same database) |
| Abuse agent | reports processes and connections on each node every minute | HTTPS, signed with the node's Wings token |
| Storage agent | copies every server's files from the nodes over SSH, keeps snapshots, serves archives for failover, updates itself | HTTPS, HMAC-signed with a shared secret |
| FiveM image | installs the requested FXServer build at every start | no: the panel sets egg variables, Wings starts the container |
| Status Worker | probes site, panel and nodes from Cloudflare, merges the panel's export | reads the public `/data/` export |
