---
title: Updating
description: Install a new panel release next to the running one, switch to it, and roll back if it does not come up.
---

Each [release](https://github.com/plugged-host/panel/releases) is a new binary. Installing it is
a download, a link switch and a restart; the panel migrates its database by itself on start.

## Before you update

1. Read the release notes on GitHub. They say what changed and whether the
   [Wings fork](https://github.com/plugged-host/wings/releases) has a matching release.
2. Back up the database: `sudo -u postgres pg_dump -Fc calagopus > calagopus-$(date +%F).dump`.
   Migrations only move forward; the backup is your way back.

## Update the panel

```bash
release=v3.0.3   # the release you install
sudo install -d /opt/calagopus/releases/$release
sudo curl -fL -o /opt/calagopus/releases/$release/panel-rs \
  "https://github.com/plugged-host/panel/releases/download/$release/panel-rs-$(uname -m)-linux"
sudo chmod 755 /opt/calagopus/releases/$release/panel-rs

previous=$(readlink /opt/calagopus/current)
sudo ln -sfn /opt/calagopus/releases/$release /opt/calagopus/current
sudo systemctl restart calagopus
```

Then check that it answers and runs the new release:

```bash
curl -fsS http://127.0.0.1:8000/up                 # ok
curl -fsS http://127.0.0.1:8000/api/settings | grep -o '"release":"[^"]*"'
```

The release also shows in the panel's footer. While it restarts, nginx answers 502 for a few
seconds (or your [maintenance page](/panel/web-server/#a-page-while-the-panel-restarts)). Game
servers are not affected: they run on the nodes.

## Roll back

Point `current` back at the previous release and restart:

```bash
sudo ln -sfn "$previous" /opt/calagopus/current
sudo systemctl restart calagopus
```

:::caution
A rollback does not undo migrations. An older release usually runs on a newer schema, but if it
does not, restore the database backup you made before the update.
:::

Remove old release folders once you are sure you won't go back; keep the last two or three.

## Several instances

When more than one panel instance shares the database, run the migrations once, before any
instance restarts:

1. Set `DATABASE_MIGRATE=false` on every instance.
2. Install the new binary on every instance (as above, without the restart).
3. Migrate once: `panel-rs database-migrator migrate` with the new binary
   (see [running commands](/panel/first-admin/#run-panel-commands-with-the-services-environment)).
4. Restart the instances one by one, the one with `APP_PRIMARY=true` included.

`panel-rs database-migrator status` shows which migrations are applied.

## Update the nodes

Update Wings from the [Wings fork's releases](/nodes/wings/#updating). Server containers keep
running while Wings restarts.

## Release numbers

Releases are named by the panel's version only, `v{VERSION}` (`v3.0.2`). A fix is always a new
version; there are no rebuilt releases under an old name. See [versions](/reference/versions/).
