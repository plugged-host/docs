---
title: Troubleshooting
description: "Where to look when the panel misbehaves: the Health page, logs, diagnostics, and the usual causes."
---

## Admin › Overview › Health

Start here. Besides upstream's checks (pending migrations, the clock's offset from NTP, debug mode,
the nodes' clocks), the page has two cards for the panel's own machinery:

| Card | Shows |
|---|---|
| Background Tasks | Every background task with when it last started and the error of its last run. Tasks run only on the instance with `APP_PRIMARY=true`; another instance says so |
| Node Telemetry | Nodes whose [telemetry](/nodes/telemetry/) sample is missing or older than 150 seconds, linked to the node |

A per-minute task last started more than a few minutes ago, or a three-hourly one more than three
hours ago, has stopped or is stuck in a long run. Restarting the panel restarts every task.

The same page switches debug logging on and off without a restart.

## Logs

```bash
sudo journalctl -u calagopus -f                 # the service's output
sudo tail -f /var/log/calagopus/panel.log       # with APP_LOG_DIRECTORY set
```

With `APP_LOG_DIRECTORY` the panel writes `panel.log` plus one file per day, kept for 30 days.

## Diagnostics

```bash
panel-rs diagnostics
```

Collects the versions, the environment's shape (no secrets), the migration state, the time and,
with `APP_LOG_DIRECTORY` set, the last 500 lines of `panel.log` (`--log-lines` changes that) into
one report. It asks before
showing it and before uploading it to pastes.dev; answer no to keep it local. See
[running commands](/panel/first-admin/#run-panel-commands-with-the-services-environment).

## Common problems

| Symptom | Cause and fix |
|---|---|
| The service stops right after starting | Read `journalctl -u calagopus`. Usually `APP_ENCRYPTION_KEY` is missing or still `CHANGEME`, `DATABASE_URL` is wrong, or Redis is not reachable |
| nginx answers 502 | The panel is not running or listens elsewhere: compare `BIND`/`PORT` with the `upstream` block |
| Every visitor has the same IP address | `APP_TRUSTED_PROXIES` misses your proxy or your CDN's ranges ([web server](/panel/web-server/#real-client-addresses)) |
| Nothing happens on schedule (no telemetry, no scans, limbo idle) | No instance has `APP_PRIMARY=true`, or the tasks failed: see the Background Tasks card |
| Tasks run twice | More than one instance has `APP_PRIMARY=true` |
| A node shows as unreachable | Wings is stopped, its certificate is invalid, a firewall blocks its API port, or its DNS name points at a proxy instead of the node. See [Wings](/nodes/wings/) |
| A feature skips one node | The node runs stock wings-rs, not the [fork](/nodes/wings/#what-the-fork-adds) |
| A setting "does not save" on another instance | Each instance caches settings for up to a minute |
| Stored secrets cannot be read after a restore | The restored database was encrypted with a different `APP_ENCRYPTION_KEY` |
| New servers fail with "too busy for new servers" | Every node of the location is paused: see [placement](/nodes/placement/) |

## Locked out

```bash
panel-rs users reset-password --user <username or email>
panel-rs users disable-2fa --user <username or email>
panel-rs users create --admin true               # a new emergency admin
```

With [noprofit.space](/accounts/noprofit/) connected, the login page sends everyone there. An admin
with a panel password signs in at `/auth/login?local=1` instead.

## Getting help

Ask in the [plugged.host Discord](https://discord.gg/plugged-host-1502647500295635085) or open an
issue on [GitHub](https://github.com/plugged-host/panel/issues). For a problem in an upstream
feature, check the [Calagopus documentation](https://calagopus.com/docs) first. Report security
problems privately, as the repository's
[security policy](https://github.com/plugged-host/panel/blob/main/SECURITY.md) describes.
