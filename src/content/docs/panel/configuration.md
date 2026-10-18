---
title: Configuration
description: Where the plugins' settings live, and the first pass through them on a new panel.
---

## Where settings live

Every plugin with settings has a page at **Admin › Plugins › (plugin) › Settings**. Saving it
writes the values to the panel's `.env`, so the two are the same thing: you can also edit `.env`
directly and clear the config cache afterwards. Each plugin's `config/<plugin>.php` lists every
key with its default, and each plugin page in these docs has the full table.

Some settings are not in `.env` but in the database, edited on their own admin pages: plans and
locations (servers), incidents and status components (status), Discord servers, rules and roles
(Discord, rux).

After editing `.env` by hand:

```bash
sudo -u www-data php artisan config:clear
```

## Panel-wide

| Setting | Why |
|---|---|
| `APP_ENV=production` | The Discord bots refuse to connect on anything else, so a copy of your panel can't answer on Discord in its place. Use another value on test panels. |
| `APP_URL=https://panel.example.com` | Links in mail, the agents' install commands and signed URLs are built from it. |
| `REDIS_QUEUE_RETRY_AFTER` / `DB_QUEUE_RETRY_AFTER` | Above the queue worker's timeout, see [Queue worker and scheduler](/panel/queue-and-scheduler/). |
| Mail (Pelican's settings) | Account mail and some notices go out by mail. |

## A first pass, plugin by plugin

Go through these in order. Each line links to the page with the details.

1. **[Servers](/plugins/servers/)**: locations, plans and the deployment tags
   (`UCS_DEPLOYMENT_TAGS`). With tags set, new servers only land on nodes that carry one of them,
   so a half-set-up node stays out of rotation until you tag it.
2. **[Economy](/plugins/economy/)**: the resource tiers, store prices and what credits buy.
3. **[Ads](/plugins/ads/)**: ads are **on** by default (`ADS_ENABLED=true`). Add your own ad units,
   or turn ads off, or disable the plugin.
4. **[Abuse](/plugins/abuse/)**: `ABUSE_MODE` starts at `report` (findings are recorded, nothing is
   suspended). Switch to `suspend` once you trust the findings.
5. **[Minecraft](/plugins/minecraft/)**: the CurseForge API key for modpacks.
6. **[Status](/plugins/status/)**: `STATUS_EXPORT_PATH` and the health URLs, if you run a
   [status page](/status/status-export/).
7. **[Storage](/plugins/storage/)**: set up after the [storage box](/storage/storage-box/) exists.
   Failover defaults to `auto`; it restores from the storage box's copies, so it has nothing to
   work with until the storage agent runs.
8. **[Discord](/plugins/discord/)** and **[AI](/plugins/ai/)**: after creating the
   [Discord applications](/discord/membership-bot/) and adding an AI provider for [neo](/discord/neo/).
9. **[Limbo](/plugins/limbo/)** and **[Devbox](/plugins/devbox/)** ship switched off
   (`LIMBO_ENABLED`, `DEVBOX_ENABLED`); turn them on when their nodes are ready.
10. **[Subdomains](/plugins/third-party/)**: your Cloudflare zone and API token.

Then run the [doctor](/panel/doctor/): it names the settings that are still missing.

## Secrets

Several settings are shared secrets between the panel and an agent (storage, abuse) or tokens for
outside services (Discord, AI providers, CurseForge, Cloudflare). They live only in `.env` and the
database. Keep `.env` readable by the panel user only:

```bash
sudo chown www-data:www-data /var/www/pelican/.env
sudo chmod 600 /var/www/pelican/.env
```

Never copy a production `.env` to a test panel: give the test panel its own Discord applications
and agent secrets.
