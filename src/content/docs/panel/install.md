---
title: Install the panel
description: Install the panel from a release binary, write its environment file and run it as a systemd service.
---

The panel is one binary, `panel-rs`, with the web frontend built in. It serves the site and the
API on one port, runs its background tasks itself and applies its own database migrations. Install
it from a [release](https://github.com/plugged-host/panel/releases), or [build it
yourself](/panel/building/).

Before you start, have the [database and Redis](/panel/database/) ready.

## 1. A user and folders

The panel runs as its own system user, never as root:

```bash
sudo useradd --system --home /var/lib/calagopus --shell /usr/sbin/nologin calagopus
sudo install -d -o calagopus -g calagopus -m 750 /var/lib/calagopus /var/log/calagopus
sudo install -d -m 755 /opt/calagopus/releases
sudo install -d -m 750 -g calagopus /etc/calagopus
```

## 2. The binary

Each [release](https://github.com/plugged-host/panel/releases) carries the panel for every
architecture as `panel-rs-<arch>-linux` (`x86_64`, `aarch64`, `riscv64`, `ppc64le`). Download the
one for your machine into a folder named after the release, and point `current` at it:

```bash
release=v3.0.2   # the release you install
sudo install -d /opt/calagopus/releases/$release
sudo curl -fL -o /opt/calagopus/releases/$release/panel-rs \
  "https://github.com/plugged-host/panel/releases/download/$release/panel-rs-$(uname -m)-linux"
sudo chmod 755 /opt/calagopus/releases/$release/panel-rs
sudo ln -sfn /opt/calagopus/releases/$release /opt/calagopus/current
```

Keeping each release in its own folder makes [updating](/panel/updating/) and rolling back a
matter of moving the `current` link.

The `panel-rs-aio-<arch>-linux` files are the all-in-one build (the panel with Wings inside, for
a single machine) and the Docker images (`ghcr.io/plugged-host/panel`) are upstream's image
variants built from this fork. These docs use the plain binary.

## 3. The environment file

The environment holds only what the panel needs before it can read its database; everything else
is a setting in Admin › Settings. Create `/etc/calagopus/panel.env`:

```bash
DATABASE_URL="postgresql://calagopus:<password>@127.0.0.1:5432/calagopus"
DATABASE_MIGRATE=true

REDIS_URL="redis://127.0.0.1:6379/3"
REDIS_KEY_PREFIX="calagopus"

# Generate once with `openssl rand -hex 32` and never change it: it encrypts stored secrets.
APP_ENCRYPTION_KEY="<random>"

# Listen on the loopback only; nginx is in front of it.
BIND=127.0.0.1
PORT=8000

APP_PRIMARY=true
APP_LOG_DIRECTORY=/var/log/calagopus
APP_USE_DECRYPTION_CACHE=true
# The proxies whose X-Forwarded-For the panel believes (nginx on the loopback, plus your CDN's ranges).
APP_TRUSTED_PROXIES="127.0.0.1/32,::1/128"
```

```bash
sudo chown root:calagopus /etc/calagopus/panel.env
sudo chmod 640 /etc/calagopus/panel.env
```

Every variable is described in [configuration](/panel/configuration/).

:::danger
Keep a copy of `APP_ENCRYPTION_KEY` somewhere safe. The panel refuses to start with the example
value `CHANGEME`, and a lost or changed key makes every stored secret (API keys, tokens, node
credentials in the settings) unreadable.
:::

## 4. The systemd unit

Create `/etc/systemd/system/calagopus.service`:

```ini
[Unit]
Description=Game panel (plugged.host Calagopus fork)
After=network-online.target postgresql.service redis-server.service
Wants=network-online.target

[Service]
User=calagopus
Group=calagopus
WorkingDirectory=/var/lib/calagopus
EnvironmentFile=/etc/calagopus/panel.env
ExecStart=/opt/calagopus/current/panel-rs
Restart=always
RestartSec=5
LimitNOFILE=65536
# The panel uses well under 100 MB; the cap keeps a runaway from taking the box with it.
MemoryMax=1G
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/calagopus /var/log/calagopus

[Install]
WantedBy=multi-user.target
```

Use `valkey-server.service` in `After=` if you run Valkey. Then start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now calagopus
sudo journalctl -u calagopus -f
```

On the first start the panel applies all migrations, which takes a few seconds, then logs that it
is listening. `curl http://127.0.0.1:8000/api/settings` answers with the public settings once it
is up.

Upstream's `panel-rs service-install` writes a simpler unit that runs as root from wherever the
binary is; the unit above is the one these docs assume.

## 5. Check the release

`panel-rs version` reads the environment first, so give it the two variables it insists on (it
connects to nothing):

```bash
APP_ENCRYPTION_KEY=version-check DATABASE_URL=postgresql://version@127.0.0.1:1/version \
  /opt/calagopus/current/panel-rs version
```

It prints the plugged.host release (`release v3.0.2`), then Calagopus's own version. See
[versions](/reference/versions/).

## Next

Create the [first admin](/panel/first-admin/) before the panel is reachable from outside, then put
the [web server](/panel/web-server/) in front of it.
