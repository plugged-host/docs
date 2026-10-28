---
title: Install order
description: The order to set up a plugged.host panel in, from an empty server to the optional features.
---

Each step has its own page. Do them in this order: later steps assume the earlier ones work.

## The panel

1. **[Database and Redis](/panel/database/)**: a PostgreSQL database and role, and a Redis (or
   Valkey) database number for the panel.
2. **[Install the panel](/panel/install/)**: the release binary (or [your own build](/panel/building/)),
   the environment file, the system user and the systemd unit. Start it on the loopback address.
3. **[First admin](/panel/first-admin/)**: create the admin from the command line, sign in on the
   loopback port or a tunnel, set the application URL.
4. **[Web server](/panel/web-server/)**: nginx with TLS in front of the panel. Only now open the
   site to the world.
5. **[Configuration](/panel/configuration/)**: mail, captcha, and the Admin › Settings pages that
   matter on day one.

:::caution
Don't expose the panel before an admin exists. With an empty users table, the first visitor gets
the setup screen and becomes the admin.
:::

## The first node

6. **Locations and a node** in the panel (Admin › Locations, Admin › Nodes), as upstream.
7. **[Wings](/nodes/wings/)** on the node: the plugged.host fork, enrolled with the node's code and
   always started with `--config`.
8. **[Eggs](/nodes/eggs/)**: import the eggs your users should get.
9. **[Node telemetry](/nodes/telemetry/)** shows the node answering within a minute. Check
   Admin › Overview › Health.

At this point admins can create servers. The rest decides what users can do on their own.

## Self-service

10. **[Creating servers](/servers/create-server/)**: games, plans and the allowance in
    Admin › Settings › Hosting › Games and Admin › Plans.
11. **[Placement](/nodes/placement/)** and **[allocations](/nodes/allocations/)**: where new servers
    go and which ports the panel may make.
12. **Off-node backups**: a backup storage that is not on the node, so
    [node failover](/nodes/failover/) and [limbo](/starts/limbo/) have something to restore from.

## Optional, in any order

- [Start queue](/starts/start-queue/) and [limbo](/starts/limbo/)
- [Credits, tokens and memberships](/economy/credits-and-tokens/), [ads](/economy/ads/)
- [Minecraft](/games/minecraft/) and [FiveM](/games/fivem/) settings
- [Subdomains](/servers/subdomains/) (Cloudflare)
- [Abuse protection](/safety/abuse/) (reports by default; choose whether it suspends)
- [Discord integration](/discord/integration/), [rux](/discord/rux/), [neo](/ai/neo/)
- [VS Code devboxes](/servers/devboxes/)
- [Status page](/status/status-page/) data, then the [status Worker](/status/status-worker/)
