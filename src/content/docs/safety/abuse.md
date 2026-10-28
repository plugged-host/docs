---
title: Abuse protection
description: How the panel finds miners, proxies, DDoS tools and other forbidden software on servers, what it does about them, and how to get alerts in Discord.
---

The panel looks on every server for software the Terms forbid: crypto miners, VPN and proxy
servers, DDoS tools, port scanners and brute forcers, malware and botnets, bulk mail. What it finds
is a **finding** in Admin › Abuse. In the suspend mode a critical finding suspends the server, and
the server is deleted after the configured hours unless an admin steps in. Admins review the
findings; users only see a suspended server.

## What it does

### Checks

All rules live in the panel. Wings only collects: file listings and contents, console lines and, on
nodes running the [Wings fork](/nodes/wings/), the processes and connections of each container.

| Check | When | Looks at |
|---|---|---|
| Full scan | Every server that is not suspended, every three hours (00:07, 03:07, ...); on demand from Admin › Abuse › Scan a Server | Startup values, every file name in the tree, up to 30 likely files' contents, the last 200 console lines |
| CPU watch | Every minute | Each server's CPU use against its limit |
| Process check | Every minute, Wings fork nodes only | What runs in each container and what it connects to; the node's own processes |

**Startup.** The startup command and the variables that name what runs or what gets installed
(`STARTUP_CMD`, `JS_FILE`, `PY_FILE`, `PY_PACKAGES`, `GIT_ADDRESS`, ...) are matched against tool
names and text signatures.

**Files.** The whole file tree is listed in one call, with sizes and the type sniffed from each
file's first bytes. A server too big to list in 30 seconds is walked instead: 400 folders, 6 deep,
skipping bulk data (region files, `node_modules`, caches). Every name is checked. Then up to 30
files of at most 512 KiB are read, most likely first: the egg's main file, scripts and configs in a
folder that matched a tool name or next to a Linux executable, top-level scripts, any shell script.
Library folders are never read. On a bot egg (Python, Node.js, Bun, Deno or a generic one, matched
by the egg's name) top-level configs and shallow scripts are read too, and an unknown Linux
executable is a review finding. A whole Linux root filesystem inside a server is a finding on any
egg.

**Names.** A distinctive name (`xmrig`, `t-rex`, `masscan`) counts wherever it appears. An ordinary
word that is also a tool (`xray` is also an anti-xray Minecraft plugin, `hydra` a mod) counts only
for a Linux executable or a process named exactly that.

**Contents.** A text signature needs all its parts in one file: a mining pool address with a
wallet, `stratum+tcp://`, an Xray/V2Ray config with an inbound, a DDoS script's attack methods,
obfuscated JavaScript (15 or more `_0x` names) or Python hidden behind `exec(base64...)`. The
matching runs in linear time, so a hostile file cannot slow the scan.

**Console.** A console also prints what players type, so a signature in free text is at most a
review, and a line that looks relayed (`<Player> ...`, "issued server command") is skipped. Only
output nobody fakes with one chat line is critical: several of XMRig's own log lines from different
modules, the Xray/V2Ray start banner, sing-box's log format, a run of masscan or nmap results.

**CPU.** A miner pins its CPU for hours. A server at the **CPU Threshold** (90% of its limit by
default) has its console read at once and every 10 minutes after. One that stays there for **CPU
Minutes** (20) gets a review finding ("Sustained full CPU") and the full scan, at most every 2
hours. A little under the threshold keeps the streak going; under three quarters of it ends it. Full
CPU alone never suspends: a Minecraft server generating chunks looks the same.

**Processes and connections** (Wings fork only). What the file checks cannot see:

- a renamed miner (Wings reports strings found in the binary, and a renamed XMRig still says XMRig);
- a binary deleted after it started, one running from memory or a temp folder, a process named like
  a kernel thread, a script run by an interpreter whose file name matches;
- connections: 100 hosts contacted at once is a port scan, SSH to 15 hosts or RDP to 10 is brute
  forcing, Telnet to 10 is botnet spreading, mail to 20 servers is bulk mail, 150 000 packets per
  second out is a flood (smaller numbers are reviews);
- full CPU with a connection to a common stratum port is a review.

The node's own processes become node findings, which only alert.

### Severity and status

| Severity | Means |
|---|---|
| Critical | What the Terms forbid outright. Suspends in the suspend mode |
| Review | Worth a look: tunnels, Tor and torrent clients, unknown executables, sustained full CPU, anything seen only in the console. Never suspends |

There is one finding per server (or node) and rule. The same rule seen again updates it (Times
Seen, Last Seen, the latest summary and evidence) instead of adding one.

| Status | Means |
|---|---|
| Open | Seen, nothing done yet |
| Suspended | The server was suspended for it |
| Dismissed | An admin called it a false positive. It stays dismissed when seen again and never suspends |
| Resolved | An admin closed it, or it was not seen for 7 days. It reopens when seen again |

### What the panel does

The **Mode** decides:

- **Suspend**: a critical finding that is not dismissed suspends the server, with the findings'
  summaries as the reason and a deletion time of now plus **Delete After (Hours)** (0: never
  deleted). The server is then deleted at that time ([Suspension](/safety/suspension/)), unless it
  was unsuspended or a finding on it was dismissed (which clears the deletion time).
- **Report only** (the default): findings are recorded and alerted, nothing is suspended. A fresh
  panel shows what it would do before it suspends anyone.
- **Off**: nothing is checked.

Also:

- **Scan a Server** in Admin › Abuse records findings like the scheduled scan but never suspends:
  the admin decides.
- Unsuspending a server without dismissing its finding gets it suspended again on the next hit.
- A server in the middle of a transfer is not suspended; the finding stays open and the next check
  tries again.
- **Owner sweep.** Someone caught mining on one server usually runs the same kit on the others:
  after a new critical finding, the owner's other servers get the full scan right away, at most
  once per owner per hour.
- **Standing.** Every abuse suspension is a strike on the server's owner; enough of them keep the
  account from creating servers ([Account standing](/safety/standing/)). Dismissing a finding takes
  that strike back.
- A critical finding on a devbox also affects its person's devboxes
  ([Devboxes](/servers/devboxes/)).

### Alerts

With an **Alert Webhook** set, the panel posts a Discord embed, signed "{panel name} abuse", with a
link to Admin › Abuse, the owner, the node and the egg, for:

- a suspension (red);
- a new critical finding in the report-only mode ("Would suspend ..., report-only mode", yellow);
- a new critical finding on a node's own processes;
- the deletion of an abuse-suspended server (red).

A server or node gets at most one finding alert per 30 minutes. Suspensions and deletions always
post. The webhook mentions nobody.

### Admin › Abuse

The findings, newest first, filtered by status (Open by default) and searchable by summary, server,
owner or node name. A row opens the finding with its egg, rule, times seen, first seen, action and
evidence; its menu resolves or dismisses it. **Scan a Server** runs the full scan on one server and
shows what it found; a scan slower than 45 seconds keeps running and its findings appear in the
list.

## Requirements

- Nothing for the startup, file, console and CPU checks: they work with stock Wings.
- The process and connection checks, and node findings, need the [Wings fork](/nodes/wings/) on the
  node. A stock Wings node is skipped by them; the other checks still run there.
- For alerts: a Discord channel where you can create a webhook.

## Setup

1. Open Admin › Settings › Security › Abuse. Leave **Mode** at **Report only** for now.
2. In Discord, open the channel for alerts › Edit Channel › Integrations › Webhooks › New Webhook,
   name it, and copy its URL (`https://discord.com/api/webhooks/...`).
3. Paste it into **Alert Webhook** and save. The URL must be https. It is stored encrypted; the
   field then stays empty with "A webhook is stored", and saving it empty keeps it.
4. Watch Admin › Abuse and the alert channel for a few days. Dismiss false positives.
5. Set **Mode** to **Suspend** and **Delete After (Hours)** to how long an admin has to step in
   before a suspended server is deleted. Save.

To stop alerts, press **Remove Webhook**.

## Settings

### Admin › Settings › Security › Abuse

| Setting | Default | What it does |
|---|---|---|
| Mode | Report only | Suspend, Report only or Off, see above |
| Delete After (Hours) | 24 | Hours from an abuse suspension to deletion (0 to 8760, 0 never deletes) |
| Alert Webhook | none | Discord webhook URL for suspensions, deletions and new critical findings |
| CPU Threshold | 90 | Percent of its CPU limit (50 to 100) that starts a CPU streak |
| CPU Minutes | 20 | Minutes at the threshold (5 to 1440) before the review finding and the full scan |

CPU Threshold, CPU Minutes and the standing fields on the same tab show with **Advanced mode** on
(the switch at the top of Admin › Settings › General › Application). The standing fields are on
[Account standing](/safety/standing/).

## Permissions

| Permission | Gives |
|---|---|
| `abuse.read` | Admin › Abuse: the findings and their evidence |
| `abuse.manage` | Dismissing and resolving findings, Scan a Server |
| `settings.update` | Changing the abuse settings |

The admin activity log records `abuse:finding.dismiss`, `abuse:finding.resolve` and `abuse:scan`.

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `watch_abuse` | Every minute, at second 15 | CPU watch and process check |
| `scan_abuse` | Every three hours, at minute 7 | Full scan of every server that is not suspended |
| `purge_suspended_servers` | Every 5 minutes | Deletes suspended servers whose deletion time passed |

They run only on the panel instance with `APP_PRIMARY=true`.

## Notes

:::danger
In the suspend mode a suspended server is deleted after **Delete After (Hours)**, with its files.
Dismiss a false positive before then; unsuspending alone does not stop a later suspension.
:::

- Console text alone is never critical: chat can be echoed into the console.
- Abuse protection works the same with or without [noprofit.space](/accounts/noprofit/); only the
  strikes it records go there too ([Account standing](/safety/standing/)).
