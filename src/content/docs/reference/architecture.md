---
title: Architecture
description: How the panel, its database, its background tasks and the nodes fit together, and where the code for each part lives.
---

## The pieces

```
browser ──▶ nginx ──▶ panel-rs (Axum + the built-in frontend) ──▶ PostgreSQL
                         │   └─ background tasks (APP_PRIMARY)      Redis / Valkey
                         │
                         └──▶ Wings (wings-rs) on each node ──▶ Docker containers
browser ───────────────────▶ Wings: console websocket, file uploads and downloads, SFTP
```

- **The panel** is one binary, `panel-rs`: an HTTP server (Rust, Axum) with the React frontend
  embedded in it. It serves the site, the API and the API documentation on one port.
- **PostgreSQL** holds everything: users, servers, settings, activity, uptime, telemetry history.
  The panel applies its own migrations on start (`DATABASE_MIGRATE=true`).
- **Redis or Valkey** holds the cache, sessions and rate limits, plus state the instances share
  (for example the Discord gateway's status).
- **Wings** on each node runs the containers. The panel drives it over HTTPS with the node's
  token; browsers talk to it directly for the console and files, with short-lived tokens the panel
  signs. Nodes call the panel back on its remote API.

## Requests

| Path | What |
|---|---|
| `/api/settings`, `/api/languages`, … | Public: what the frontend needs before sign-in |
| `/api/auth/*` | Sign-in, two-factor, OAuth, and the optional noprofit.space sign-in |
| `/api/client/*` | The signed-in user's API (session or API key); `/api/client/servers/{server}/*` for one server, as owner, subuser or admin |
| `/api/admin/*` | Admins, or roles with the matching admin permission |
| `/api/remote/*` | Wings, with the node's token |
| `/data/*`, `/up` | The [status page](/status/status-page/) files and the health check, public |
| `/docs/api` | The generated [API documentation](/reference/commands/#the-panels-api) |
| everything else | The frontend |

## Background tasks

The panel runs its own scheduled work: there is no cron job, queue worker or separate daemon to
install. Tasks run only in the instance with `APP_PRIMARY=true`, so several instances can share one
database while exactly one runs them. The Discord bots' gateway connections are kept by a task the
same way. Admin › Overview › Health lists every task with its last start and last error
([troubleshooting](/panel/troubleshooting/)).

The tasks plugged.host adds include `sample_nodes` (every minute), `collect_status`, `watch_abuse`
and `scan_abuse` (every three hours), `settle_limbo`, `release_start_queue`, `settle_transfers`,
`settle_failovers`, `settle_allowance_cuts`, the Discord tasks and `sync_noprofit_accounts` (only
while noprofit.space is connected). Each feature's page lists its tasks.

## Settings

Every setting an admin may change lives in the database, in sections shown as tabs on the
Admin › Settings pages. Secrets are encrypted with `APP_ENCRYPTION_KEY` and never shown again.
Each instance caches the settings for up to a minute. The environment only holds what the panel
needs before it can read the database ([configuration](/panel/configuration/)).

## Permissions

Three sets, as upstream:

- **Admin permissions** (`nodes.read`, `servers.create`, `status.manage`, …), carried by roles.
  Admins have every permission.
- **Server permissions** (`control.start`, `files.read`, `chat.write`, …), carried by roles,
  subusers and API keys. Wings checks the console, power and file permissions in its websocket
  token.
- **User permissions**: the scopes of API keys.

plugged.host's features add their own permissions, named in each feature's page. The permissions
of [removed upstream features](/start/introduction/#what-the-fork-removes) are never offered or
granted, not even to admins.

## Where the code lives

The fork keeps upstream's layout and puts each feature where upstream keeps its equivalent, so
there is no "plugged.host folder". In the [panel repository](https://github.com/plugged-host/panel):

| Path | What |
|---|---|
| `backend/` | HTTP routes (`src/routes/`), background tasks (`src/tasks.rs`), CLI commands (`src/commands/`) |
| `shared/` | Models, settings (`src/settings/`), permissions, and the logic routes and tasks share |
| `database/` | The schema (`src/schema.ts`) and the SQL migrations generated from it |
| `frontend/` | React + Mantine, built with Vite; Theme v2 in `src/app.css` and `src/theme.ts` |
| `api-clients/wings-api` | The Wings API client, with the fork's endpoints added by hand |
| `docs/` | Developer documentation: architecture, development, upstream merges, one page per feature |
| `plugged-host/` | plugged.host's own build and deploy scripts, unit and nginx file: examples, nothing depends on them |

Every changed upstream line carries a `plugged.host` comment and every new file a `plugged.host:`
header, so `git grep -n "plugged.host"` lists the fork's changes.
[docs/upstream.md](https://github.com/plugged-host/panel/blob/main/docs/upstream.md) lists them in
full and describes how the fork merges Calagopus.

The [Wings fork](https://github.com/plugged-host/wings) follows the same rules; its
`plugged-host/README.md` lists what it changes.

## Licence

The panel and Wings are MIT, like Calagopus; the Calagopus copyright stays in every file it covers.
The plugged.host name and logo are not covered by the licence.
