---
title: Wings
description: Install the plugged.host fork of Calagopus Wings on a node, enroll it with the panel, and keep it updated.
---

Every node runs Wings, the daemon that runs the game servers' Docker containers and that the panel
drives over HTTPS. plugged.host's nodes run [plugged-host/wings](https://github.com/plugged-host/wings),
a fork of Calagopus's [wings-rs](https://github.com/calagopus/wings) with what some of the panel's
features need on the node.

The panel also works with stock wings-rs: features that need the fork check what a node can do
and skip a node without it. The table below says what a stock node misses.

## What the fork adds

| Addition | Used by | On stock wings-rs |
|---|---|---|
| A public resources endpoint (`GET /api/public/resources`, no token): the node's memory, disk and CPU, total, used, free and allocated to servers | Anyone: a status page, a "where is there room" list | Not available |
| Load figures (`GET /api/system/load`) | [Node telemetry](/nodes/telemetry/), [placement](/nodes/placement/) | The node has no load figures |
| Every container's processes and outgoing connections (`GET /api/system/processes`, and per server) | [Abuse protection](/safety/abuse/) | Processes and connections are not watched; the file and console scans still run |
| Removing a server the panel no longer lists on the node (`POST /api/system/orphans`) | [Node failover](/nodes/failover/), once the old node is back | The old copy's files stay on the node |
| A schedule's restart step leaves a stopped server stopped | [Start gates](/starts/start-gates/) | A scheduled restart could start a stopped server past the gates |
| CPU weight and burst per container (`build.cpu_weight`, `build.cpu_burst`) | [Burst cores](/economy/credits-and-tokens/) | Burst works, but every container weighs the same |
| More threads for archiving, unpacking and backups of servers with burst CPU, and large zip entries compressed in parallel (`api.burst_operations`, on by default) | [Memberships](/economy/credits-and-tokens/#memberships): faster archives and backups for members | Every server archives and backs up with the node's configured threads |
| A `.jar` browsed like a `.zip` | [Minecraft](/games/minecraft/): identifying a plugin or mod without downloading it | Jars are identified by their hash only |

Install everything else about a node as upstream describes:
[Calagopus: Wings](https://calagopus.com/docs/wings) covers the requirements, Docker, disk limiters
and the configuration file.

## Install

### 1. Docker and a certificate

Install Docker Engine and get a TLS certificate for the node's name (for example with certbot:
`certbot certonly --standalone -d node1.example.com`). The node's name must resolve to the node
itself, not to a proxy.

### 2. The binary

Each [release](https://github.com/plugged-host/wings/releases) carries `wings-rs-<arch>-linux` for
`x86_64`, `aarch64`, `riscv64` and `ppc64le`:

```bash
release=v3.0.0   # the Wings release that goes with your panel release
sudo curl -fL -o /usr/local/bin/wings-rs \
  "https://github.com/plugged-host/wings/releases/download/$release/wings-rs-$(uname -m)-linux"
sudo chmod 755 /usr/local/bin/wings-rs
sudo install -d -m 700 /etc/calagopus-wings
```

A Docker image is published too: `ghcr.io/plugged-host/wings:<version>`.

### 3. The node in the panel

In Admin › Nodes › Create: the location, the node's URL (`https://node1.example.com:8080`), its
SFTP port (`2022`), memory and disk. Choose **Set Up Manually**, then **Generate Enrollment
Command**: the panel shows a command with a one-time code that expires after 30 minutes.

### 4. Enroll

Run the command on the node with the configuration path added:

```bash
sudo wings-rs --config /etc/calagopus-wings/config.yml configure \
  --enroll <code> --panel-url https://panel.example.com
```

It writes the configuration file the panel generated for the node.

:::caution
Always pass `--config`. Without it, wings-rs uses the first configuration file it finds among
several default paths, which on a node that ever ran another panel's Wings can be that daemon's
file, and `configure` would overwrite it.
:::

### 5. The configuration

Edit `/etc/calagopus-wings/config.yml`:

```yaml
api:
  port: 8080
  ssl:
    enabled: true
    cert: /etc/letsencrypt/live/node1.example.com/fullchain.pem
    key: /etc/letsencrypt/live/node1.example.com/privkey.pem
  # The public resources endpoint; set to false to answer 404 instead.
  public_resources: true

# Keep the panel from replacing this build with an upstream release.
ignore_panel_wings_upgrades: true
```

Keep the rest as the panel wrote it. The other keys (Docker network, SFTP, disk limiters, backups)
are upstream's; see [Calagopus: Wings configuration](https://calagopus.com/docs/wings/configuration).

### 6. The service

`/etc/systemd/system/wings.service`:

```ini
[Unit]
Description=Wings (plugged.host fork)
After=docker.service
Requires=docker.service
PartOf=docker.service

[Service]
User=root
KillMode=process
LimitNOFILE=4096
ExecStart=/usr/local/bin/wings-rs --config /etc/calagopus-wings/config.yml
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wings
```

Within a minute, Admin › Nodes shows the node answering and [node telemetry](/nodes/telemetry/)
has its first sample.

### Pairing instead of enrolling

Upstream's other way works too: start Wings without a configuration file and it waits to be
paired, printing a pairing code in its log (`journalctl -u wings`). In Admin › Nodes › Create,
choose **Pair a Waiting Node** and enter the node's address and that code. Keep `--config` in the
unit either way.

## Allocations

Give the node its ports in Admin › Nodes › the node › Allocations, on `0.0.0.0` with the node's
name as the alias, or let the panel make them on demand inside its deployment port ranges
([allocations](/nodes/allocations/)).

## Updating

Install the new binary over the old one and restart Wings. Game servers keep running while Wings
restarts.

```bash
release=v3.0.1
sudo curl -fL -o /usr/local/bin/wings-rs.new \
  "https://github.com/plugged-host/wings/releases/download/$release/wings-rs-$(uname -m)-linux"
sudo chmod 755 /usr/local/bin/wings-rs.new
sudo mv /usr/local/bin/wings-rs.new /usr/local/bin/wings-rs
sudo systemctl restart wings
```

With `ignore_panel_wings_upgrades: true` the panel never upgrades Wings by itself, so updates are
always your decision.

## Public resources

`curl https://node1.example.com:8080/api/public/resources` answers without a token, for any origin:

```json
{
  "memory": {"total": 67108864000, "used": 30064771072, "free": 37044092928, "allocated": 53687091200},
  "disk": {"total": 1000204886016, "used": 412316860416, "free": 536870912000, "allocated": 644245094400},
  "cpu": {"model": "AMD Ryzen 9 5950X 16-Core Processor", "threads": 32, "used_percent": 23.4, "allocated_threads": 24.0}
}
```

Bytes throughout. Disk is the filesystem that holds the servers' files; `free` is what non-root
users can still write. Allocated is the servers' limits added up (servers without a limit are not
counted; burst CPU is left out). The answer is cached for 5 seconds. Set
`api.public_resources: false` to turn it off.
