---
title: Configuration
description: Every environment variable the panel reads, and a map of the Admin › Settings pages where everything else is set.
---

The panel splits its configuration in two:

- **The environment** (`/etc/calagopus/panel.env`) holds only what the panel needs before it can
  reach its database: where the database and Redis are, the encryption key, the address it listens
  on. Change it, then restart the panel.
- **Admin › Settings** holds everything else, stored in the database. A save applies at once on the
  instance that saved it, and within a minute on any other instance. Secrets (API keys, tokens) are
  stored encrypted and never shown again: an empty secret field keeps the stored value.

## Environment variables

### Required

| Variable | Example | What it does |
|---|---|---|
| `DATABASE_URL` | `postgresql://calagopus:<password>@127.0.0.1:5432/calagopus` | The PostgreSQL database. With `DATABASE_URL_PRIMARY` set, only reads go here |
| `APP_ENCRYPTION_KEY` | output of `openssl rand -hex 32` | Encrypts the stored secrets. Set once, never change it, keep a copy with your backups. `CHANGEME` is refused |

### Database and cache

| Variable | Default | What it does |
|---|---|---|
| `DATABASE_MIGRATE` | `false` | `true` applies pending migrations on every start. Set it to `true` on one instance, or run `panel-rs database-migrator migrate` before starting a new release |
| `DATABASE_URL_PRIMARY` | unset | A primary for writes, when `DATABASE_URL` is a read replica |
| `REDIS_MODE` | `redis` | `redis`, or `sentinel` for Redis Sentinel |
| `REDIS_URL` | `redis://localhost` | The Redis or Valkey server and database number, e.g. `redis://127.0.0.1:6379/3` |
| `REDIS_SENTINEL_CLUSTER` | unset | With `REDIS_MODE=sentinel`: the master's name |
| `REDIS_SENTINELS` | unset | With `REDIS_MODE=sentinel`: the sentinels as comma-separated `host:port` |
| `REDIS_KEY_PREFIX` | unset | Puts every key under `<prefix>::`, so several apps can share one Redis |

### Listening and proxies

| Variable | Default | What it does |
|---|---|---|
| `BIND` | `0.0.0.0` | The address to listen on. Use `127.0.0.1` behind nginx |
| `PORT` | `8000` | The port to listen on |
| `APP_TRUSTED_PROXIES` | empty | Comma-separated CIDRs whose `X-Forwarded-For` is believed: your reverse proxy, and your CDN's ranges. See [web server](/panel/web-server/#real-client-addresses) |
| `APP_BLOCKED_CIDRS` | the private and reserved ranges | Networks the panel refuses to fetch user-provided URLs from (an egg imported from a URL, for example). Empty turns the protection off |
| `APP_ENABLE_WINGS_PROXY` | `false` | Lets the panel proxy browser requests to the nodes, for nodes the browser cannot reach directly (a home network). Not meant for many nodes or much traffic |
| `APP_DISABLE_FRONTEND` | `false` | Serves the API only, for a frontend hosted elsewhere |

### Instances and logs

| Variable | Default | What it does |
|---|---|---|
| `APP_PRIMARY` | `true` | Whether this instance runs the background tasks (samplers, scans, limbo, the Discord bots …). With several instances on one database, exactly one has `true` |
| `APP_LOG_DIRECTORY` | unset | Also writes the log to `<dir>/panel.log`, with a daily file per day kept for 30 days. Unset: the journal only |
| `APP_DEBUG` | `false` | Debug logging from the start. Admins can also switch it on and off at runtime on Admin › Overview › Health |
| `APP_REQUEST_LOG_LIMIT` | `250` | Requests per second written to the log before the rest are only counted; `0` logs all |
| `APP_USE_INTERNAL_CACHE` | `true` | Keeps short-lived values in memory as well as Redis: faster, uses more memory |
| `APP_USE_DECRYPTION_CACHE` | `false` | Keeps decrypted secrets cached in memory and Redis: faster, slightly less secure |
| `SENTRY_URL` | unset | Sends errors to a Sentry project |
| `SENTRY_TRACING_SAMPLE_RATE` | `1.0` | Share of requests traced to Sentry |
| `SERVER_NAME` | unset | Adds an `X-Server-Name` header to every response and names the instance in Sentry. Useful to tell instances apart |

## Admin › Settings

Each group is its own entry under Settings in the admin sidebar; each tab saves its own fields.
Tabs marked "upstream" work as in Calagopus.

| Group | Tabs |
|---|---|
| General | Application (name, URL, sign-in methods, two-factor, sessions, telemetry), Metadata ([theme colour, seasonal theme](/panel/branding/)), Storage (upstream: where uploaded files go), [Status Page](/status/status-page/), Updates (upstream) |
| Mail | Mail, Mail Templates (upstream) |
| Accounts | User (upstream), [noprofit.space](/accounts/noprofit/), [Discord](/discord/integration/), [rux](/discord/rux/), Webauthn (upstream), [Welcome Tour](/accounts/welcome-tour/), [Reviews](/accounts/reviews/) |
| Hosting | Server (upstream), [Games](/servers/create-server/), [Minecraft](/games/minecraft/), [FiveM](/games/fivem/), [Subdomains](/servers/subdomains/), [Devboxes](/servers/devboxes/), [Placement](/nodes/placement/), [Start Queue](/starts/start-queue/), [Limbo](/starts/limbo/), [Recovery](/nodes/failover/) |
| Security | Captcha (upstream), Ratelimits (upstream), [Abuse](/safety/abuse/), Activity (upstream) |
| Economy | [Resource Store, Tokens, Memberships](/economy/credits-and-tokens/), [Partners](/economy/partners/) |
| Ads | [Placement, Adsterra, Monetag, Waiting Room, Ad Blockers, In-Game](/economy/ads/) |
| AI | [neo](/ai/neo/), [neo on Discord](/ai/neo-discord/) |

Other admin pages that hold configuration: Admin › Plans ([creating servers](/servers/create-server/)),
Admin › Domains ([subdomains](/servers/subdomains/)), Admin › Status ([status page](/status/status-page/)),
Admin › Abuse ([abuse protection](/safety/abuse/)), Admin › Sponsored Banners ([ads](/economy/ads/)),
Admin › Partners ([partner program](/economy/partners/)).

## Day one

After the [first admin](/panel/first-admin/), set at least:

1. Admin › Settings › General › Application: Name and URL.
2. Admin › Settings › Mail: a working mail transport, then send yourself a test mail.
3. Admin › Settings › Security › Captcha: a captcha before you open registration.
4. Admin › Settings › General › Application: Enable Registration, once the captcha works.
5. Admin › Settings › Hosting › Games: which games users can create, and their allowance
   ([creating servers](/servers/create-server/)).
6. Admin › Settings › Economy › Tokens: **Panel access** is on by default and costs 5 tokens every
   30 days. Until users have a way to earn tokens (daily tokens or a sponsored-link provider), turn
   it off, or everyone without a membership is sent to the Panel Access page instead of their
   servers ([credits, tokens and memberships](/economy/credits-and-tokens/)).
