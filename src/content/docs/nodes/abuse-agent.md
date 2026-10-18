---
title: Abuse agent
description: Install the abuse agent on every Wings node so the panel sees which processes and connections run in each server, every minute.
---

The abuse agent is a small Python program that runs on each Wings node. Once a minute it reads
what `htop` would show: every process in every server's container (name, executable, command
line, CPU), each container's outgoing connections and packet rate, and the node's own processes.
It sends that to the panel and nothing else: every rule lives in
[plugged-host-abuse](/plugins/abuse/) on the panel, which decides what is a miner or a proxy and
what to suspend. A renamed miner, one deleted after it started or one running from memory is
invisible to file scans but not to the agent.

It needs no secret of its own: it signs its reports with the node's Wings token, which is already
on the node.

## Before you start

- **plugged-host-abuse** is enabled on the panel and its migration has run.
- The node runs Wings, with its configuration in `/etc/pelican/config.yml` (an old
  `/etc/pterodactyl/config.yml` works too).
- **Python 3.6 or newer.** The installer installs `python3-minimal` with `apt-get` when there is
  no `python3`; on a distribution without apt, install Python 3 first.
- The node can reach the panel over **HTTPS** (outbound 443). The panel URL must be `https://`.
- The node's **clock is synchronised** (systemd-timesyncd, chrony): the panel refuses reports
  more than 5 minutes off.

## Install

Run this as root on each node. The same command is under Admin › Servers › Abuse › Node agents ›
Install command, with your panel's URL already in it:

```bash
curl -fsSL https://panel.example.com/plugged-host/abuse/agent/install.sh | sudo bash
```

The installer:

1. Finds the Wings configuration.
2. Works out the panel URL. The panel writes its own URL (`APP_URL`) into the script when it
   serves it; a copy saved elsewhere uses the `remote:` line of the Wings configuration instead.
   `PH_PANEL_URL=https://panel.example.com` in front of `bash` overrides both.
3. Installs `python3` if it is missing.
4. Downloads `abuse-agent.py` from the panel, checks that it parses, and installs it as
   `/opt/plugged-host-abuse/abuse-agent.py` (root only, mode `0700`).
5. Writes `/etc/systemd/system/plugged-host-abuse-agent.service`, enables and starts it, waits a
   few seconds and prints its status.

For many nodes, run it over SSH from your machine:

```bash
for node in node1.example.com node2.example.com; do
  ssh -p 2222 root@"$node" 'curl -fsSL https://panel.example.com/plugged-host/abuse/agent/install.sh | bash'
done
```

Within a minute or two the node shows **Reporting** on the Node agents page.

## The service

The unit runs the agent as root, because reading other processes' executables and network tables
needs it, and takes everything else away:

| Setting | Value | Why |
|---|---|---|
| `CPUQuota` | `25%` | at most a quarter of one core |
| `MemoryMax` | `256M` | killed and restarted above that |
| `Nice`, `IOSchedulingClass` | `10`, `idle` | game servers come first |
| `Restart`, `RestartSec` | `always`, `30` | back after a crash or a failed start |
| `ProtectSystem` | `strict` | the whole file system is read-only to it |
| `CapabilityBoundingSet` | `CAP_SYS_PTRACE CAP_DAC_READ_SEARCH` | only what reading `/proc` of other processes takes |
| also | `ProtectHome=read-only`, `NoNewPrivileges`, `PrivateTmp`, `PrivateDevices`, `ProtectKernelTunables`, `ProtectKernelModules`, `ProtectControlGroups`, `RestrictSUIDSGID`, `LockPersonality` | |

It starts after `network-online.target` and `docker.service`. Executables are fingerprinted (read
once per binary, looking for the strings a renamed miner still carries) only when a process uses
15 % CPU or more or hides its binary, so idle game servers cost almost nothing.

```bash
systemctl status plugged-host-abuse-agent
journalctl -u plugged-host-abuse-agent -f
```

### Options

The agent reads these environment variables. The installer sets the first two; set the others with
a drop-in (`systemctl edit plugged-host-abuse-agent`), which survives re-running the installer:

| Variable | Default | What it does |
|---|---|---|
| `PH_WINGS_CONFIG` | the file the installer found | The Wings configuration to take the token from. |
| `PH_PANEL_URL` | the panel URL the installer found | Where reports go. Without it, the Wings configuration's `remote:`. |
| `PH_ABUSE_INTERVAL` | `60` | Seconds between reports, at least 30. |
| `PH_DOCKER_ROOT` | `/var/lib/docker` | Docker's data root. The agent reads container names from there to tell which server a container is. |

```ini
# systemctl edit plugged-host-abuse-agent
[Service]
Environment=PH_DOCKER_ROOT=/srv/docker
```

:::caution
If Docker's `data-root` is not `/var/lib/docker` and you don't set `PH_DOCKER_ROOT`, the agent
still reports, but the panel can't match containers to servers: nothing in a server's container
is checked, only the node's own processes.
:::

## What it sends

Every report is one gzipped JSON document:

- **The agent**: its version, the node's host name, the interval and how long the scan took.
- **The node**: load average, CPU count and CPU use.
- **Each container** (Wings names it after the server's UUID): up to 40 processes, busiest first,
  each with PID, parent PID, name, executable path (and whether it was deleted), command line (up
  to 1024 characters), CPU use and fingerprint tags; the ports it listens on; how many distinct
  remote addresses it is connected or connecting to; connection counts for the 25 busiest remote
  ports plus a fixed list of mining, mail, SSH and RDP ports; and its outgoing packets and bits per
  second.
- **The node's own processes**: up to 400, with the same fields.

To see a report without sending it:

```bash
sudo python3 /opt/plugged-host-abuse/abuse-agent.py --print   # collect once and print
sudo python3 /opt/plugged-host-abuse/abuse-agent.py --once    # send one report and exit
```

## How it authenticates

The agent reads `token_id`, `token` and `remote` from the Wings configuration when it starts.
Each report carries the token ID (`X-PH-Node`), a timestamp (`X-PH-Timestamp`) and an
HMAC-SHA256 of the timestamp and the body's hash, keyed with the Wings token
(`X-PH-Signature`). The panel looks the node up by its token ID and checks the signature. It
refuses a report whose timestamp is more than 5 minutes off, the same report twice, and more than
one report per node every 20 seconds. A report only counts for servers on the node that signed
it, so a stolen node token cannot get another node's servers suspended.

The endpoint is `POST /plugged-host/abuse/agent/report` on the panel, with the user agent
`plugged-host-abuse-agent/<version>`. If a firewall or WAF sits in front of the panel, let that
request from the nodes through.

The agent reads the token only when it starts. After resetting a node's daemon token in the panel
(and updating Wings' configuration), its reports are refused (HTTP 403, `bad signature`) and the
node shows Not reporting until you restart the agent with
`systemctl restart plugged-host-abuse-agent`, or run the install command again.

## Which nodes report

- **Admin › Servers › Abuse › Node agents** lists every node: Reporting (a report in the last
  5 minutes), Not reporting, or Not installed, with the agent's version, its last report, how many
  server containers it saw and the node's CPU.
- The doctor warns about every node without a report in the last 10 minutes:

  ```bash
  cd /var/www/pelican
  sudo -u www-data php artisan plugged-host:doctor plugged-host-abuse
  ```

## Updating

The agent's version is the plugins release plus the start of a hash of its own file (for example
`2.2.0.1a2b3c4`), so it changes when the file does. The panel answers each report with the version
it ships; when they differ, the agent logs once that an update is available, and the Node agents
page shows the old version highlighted. The agent does not update itself: run the install command
again on the node. It replaces the script and the unit and restarts the service.

## Removing

```bash
systemctl disable --now plugged-host-abuse-agent
rm /etc/systemd/system/plugged-host-abuse-agent.service
rm -rf /etc/systemd/system/plugged-host-abuse-agent.service.d /opt/plugged-host-abuse
systemctl daemon-reload
```

The node then shows Not reporting, and the doctor warns about it like any node without an agent.
The panel-side checks (files, startup, console, CPU) keep covering its servers.

## Troubleshooting

| In the agent's log | Cause |
|---|---|
| `panel answered HTTP 403: {"error":"bad signature"}` | The node's clock is off by more than 5 minutes, the daemon token changed since the agent started (restart it), or the node was recreated in the panel with a new token. |
| `panel answered HTTP 429` | A second agent reports for the same node (another copy, or a manual `--once` while the service runs). |
| `no Wings config with token_id, token and remote` | `PH_WINGS_CONFIG` points at the wrong file, or Wings isn't configured on this node. |
| `report failed: ...` | The panel is unreachable from the node (DNS, firewall, certificate). It retries every interval. |
| reports arrive, but no findings ever name a server | Docker's data root isn't `/var/lib/docker`: set `PH_DOCKER_ROOT`. |
