---
title: Doctor
description: plugged-host:doctor checks that every enabled plugin has what it needs and that the background pieces are alive.
---

`plugged-host:doctor` answers one question: is this panel complete and healthy? Run it after every
setup step, after updates, and whenever something seems off.

```bash
cd /var/www/pelican
sudo -u www-data php artisan plugged-host:doctor
```

## What it prints

1. **The release**, e.g. `v2.2.0.9c396e7` (see [Versions](/reference/versions/)).
2. **The plugins**: each plugged.host plugin with its status, what it requires and what it works
   with. A required plugin that is off is shown in red.
3. **The checks**: every enabled plugin's health checks, each `ok`, `warn` or `FAIL` with a detail
   line that says what to do.

It exits non-zero when any check fails, so it can gate a deploy script.

## One plugin

```bash
sudo -u www-data php artisan plugged-host:doctor plugged-host-storage
```

## What gets checked

Core checks the basics every panel needs:

| Check | Reports a problem when |
|---|---|
| Plugin requirements | an enabled plugin requires one that is off |
| Scheduler (cron `schedule:run`) | the scheduler hasn't ticked in the last few minutes |
| Queue worker | no queued job has been taken recently |
| Volume mounts | a mount points into a server volume and isn't a devbox's own game volume (a warning) |

Every other plugin adds its own: node telemetry, abuse agents reporting, the storage agent and its
mirror passes, the Discord bots, the FiveM eggs and image, devbox nodes, missing secrets and keys.
Each plugin's page lists its checks under **Doctor checks**.

## Reading a failure

The detail line is meant to be followed literally: it names the setting, service or command
that fixes it. Fix the first failure and run the doctor again: later checks often fail only
because of an earlier one (no scheduler means no node telemetry, no status export, no agents
reporting).
