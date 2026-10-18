---
title: Abuse protection
description: Finds crypto miners, proxies, DDoS and scanning tools on hosted servers, suspends or reports them, and deletes what it suspended after a grace period.
sidebar:
  order: 11
---

plugged-host-abuse looks for what free and cheap hosting attracts: crypto miners, VPN and proxy
servers, DDoS and scanning tools, backdoors and obfuscated code. Three checks run on their own
schedules, each catching what the one before cannot: a full scan of every server's files,
startup and console every 3 hours, a watch on servers sitting at their CPU limit every minute,
and an agent on each node that reports what is actually running. A critical finding suspends the
server (or is only reported, if you prefer), staff can get a Discord alert, and servers the checks
suspended are deleted after a grace period unless an admin steps in.

## What it does

- **Full scan, every 3 hours.** For every server that isn't suspended: the startup command and
  variables, every file and folder name in the whole tree (through Wings' file search, any depth,
  any egg), the contents of the files a tool would live in (scripts at the top level, shell
  scripts, the egg's main file, files inside a folder named like a tool, configs next to a Linux
  executable; at most 30 small files per server), and the last 200 console lines. Library
  folders such as `node_modules` or `site-packages` are name-checked but never read. A server
  whose node doesn't answer gets only the startup check until the next run.
- **CPU watch, every minute.** One Wings call per node reads every running server's CPU use. A
  server at `ABUSE_CPU_PERCENT` of its CPU limit gets its console checked at once (at most every
  10 minutes). One that stays there for `ABUSE_CPU_MINUTES` gets a review finding and the full
  check (at most every 2 hours), which is what catches a miner between scans. Full CPU alone never
  suspends: a Minecraft server generating chunks looks the same.
- **Node agent, every minute.** A small Python agent on each node reports the processes, command
  lines and outgoing connections of every server's container and of the node itself, so a
  renamed miner, one deleted after it started or one running from memory is still seen. All
  rules live on the panel; the agent only collects. See [Abuse agent](/nodes/abuse-agent/).
- **Findings, not guesses.** Each finding has a category (crypto miner, VPN/proxy server, DDoS
  tool, port scanner or brute forcer, malware or backdoor, bulk mail sending, obfuscated code,
  tunnel, torrent client, hidden process, unrecognised executable, hidden Linux system, sustained
  full CPU), a source (files, startup, console, process, network, CPU, node host), evidence, and a
  severity: **critical** or **review**. Only critical findings act. Console text is never
  critical on its own (chat can be echoed into a console); only output a person can't fake with
  one chat line is, such as XMRig's own log lines or a proxy core's start banner.
- **Acting on it.** In `suspend` mode a critical finding suspends the server through Pelican
  (Wings stops it); the findings become the reason its owner reads on the suspended page. In
  `report` mode nothing is suspended and alerts say "Would suspend". Findings on the node's own
  processes are never acted on; they become node alerts.
- **The owner's other servers.** After a new critical finding, the owner's other servers are
  queued for the full check right away (at most once an hour per owner).
- **Staff alerts.** With a Discord webhook set, suspensions, deletions and new critical findings
  are posted to it (at most one finding alert per server or node every 30 minutes; suspensions and
  deletions always post).
- **Purge.** Every hour, servers the abuse checks suspended are deleted once
  `ABUSE_DELETE_AFTER_HOURS` have passed since the suspension, unless an admin unsuspended them
  since, limbo parked them, or a finding on them was dismissed. The suspended page tells the owner
  when. Before each deletion the owner's activity log gets an entry with the server's name and the
  reasons, so the record outlives the server.
- **Old findings close themselves.** An open finding not seen again for 7 days is marked
  resolved by the next full scan.

### Admin › Servers › Abuse

One sidebar entry with two tabs. Its badge counts open critical findings (in report mode, the
servers it would have suspended).

- **Findings**: open and suspended findings by default, newest activity first, filterable by
  status, severity, category and source. Per finding: **Evidence**, **Suspend server** (the owner
  sees this finding as the reason), **Dismiss as false positive** (it stays listed, but that rule
  is never acted on again for that server), **Resolve** (closed until the checks see it again) and
  **Reopen**. Resolve and Dismiss also work in bulk.
- **Node agents**: every node with its agent's status (Reporting, Not reporting after 5 minutes of
  silence, Not installed), version (highlighted when older than the panel's), last report, running
  servers and node CPU. **Install command** shows the one-liner for the nodes.

Both need the admin permission to view servers (Findings) or nodes (Node agents), and appear only
once the migration has run.

## Requirements

- [plugged-host-core](/plugins/core/) (suspension, the suspended page).
- The scheduler and a queue worker: the checks run on the scheduler, the owner sweep is a queued
  job (see [Queue and scheduler](/panel/queue-and-scheduler/)).
- The [abuse agent](/nodes/abuse-agent/) on each node, for the process and connection checks.
  Without it a node is covered only by the panel-side checks (files, startup, console, CPU).
- Optional: a Discord webhook for staff alerts.

## Setup

1. Enable the plugin and run the migrations (tables `plugged_host_abuse_findings` and
   `plugged_host_abuse_agents`):

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan migrate --force
   ```

2. Leave the mode on **Report only** (the default) and set the webhook in Admin › Plugins ›
   plugged.host Abuse Protection › Settings.
3. Install the agent on every node: [Abuse agent](/nodes/abuse-agent/).
4. See what a scan finds without recording anything:

   ```bash
   sudo -u www-data php artisan plugged-host:scan-abuse --dry-run
   ```

5. Watch Admin › Servers › Abuse for a few days, dismiss the false positives, then switch the mode
   to **Suspend the server**.

## Settings

Admin › Plugins › plugged.host Abuse Protection › Settings.

| Setting | Default | What it does |
|---|---|---|
| When a critical finding comes in (`ABUSE_MODE`) | `report` | `suspend`: suspend the server. `report`: record and alert, suspend nothing. `off`: record nothing, and the scan and CPU watch do nothing. |
| Staff alert webhook (`ABUSE_ALERT_WEBHOOK`) | empty | A Discord webhook URL for suspensions, deletions and new critical findings. The field never shows the stored value: leave it empty to keep it, enter `none` to remove it. |
| CPU watch: share of the server's CPU limit (`ABUSE_CPU_PERCENT`) | `90` | The CPU use, in percent of the server's own limit, that counts as pinned. 50 to 100. |
| CPU watch: minutes at that level before a full check (`ABUSE_CPU_MINUTES`) | `20` | How long a server must stay pinned before the review finding and the full check. 5 to 1440. |
| Delete abuse-suspended servers after (`ABUSE_DELETE_AFTER_HOURS`) | `24` | Hours between an abuse suspension and the purge deleting the server. `0` never deletes. Up to 8760. |

## Commands

| Command | What it does |
|---|---|
| `plugged-host:scan-abuse` | Check servers for crypto miners, VPN/proxy cores, DDoS and scanning tools, backdoors and obfuscated code. Without options it records findings but suspends nothing. `--suspend` acts as `ABUSE_MODE` says. `--dry-run` records and suspends nothing and only prints. `--server=` (ID or UUID, repeatable) and `--egg=` (egg ID) narrow it; naming a suspended server with `--server` still checks it. `--all` has no effect (kept for old cron lines). |
| `plugged-host:abuse-watch` | Watch for servers pinned at their CPU limit and check them for abuse. |
| `plugged-host:abuse-purge` | Delete servers suspended by the abuse checks once `ABUSE_DELETE_AFTER_HOURS` have passed. `--dry-run` lists what would be deleted, and when. |

On the scheduler:

| Task | How often |
|---|---|
| `plugged-host:scan-abuse --suspend` | every 3 hours |
| `plugged-host:abuse-watch` | every minute |
| `plugged-host:abuse-purge` | hourly |

The node agent's endpoints (`/plugged-host/abuse/agent/report`, `install.sh`, `abuse-agent.py`)
are registered by the plugin; see [Abuse agent](/nodes/abuse-agent/).

## Doctor checks

| Check | Result |
|---|---|
| Node agents reporting | warns about every node whose agent hasn't reported in the last 10 minutes, or never, and prints the install command |

## Notes

- **Dismiss, don't just unsuspend.** Unsuspending a server without dismissing its finding gets it
  suspended again on the next hit. Unsuspending does stop the purge clock for good.
- **Servers without a CPU limit** (`0`) are not watched by the CPU watch. The scan and the agent
  still cover them.
- **A stolen node token can't suspend other people's servers.** A node's report only counts for
  servers on that node.
- **Deleted means deleted.** The purge deletes the server and its files on the node like an
  admin deletion. With [storage](/plugins/storage/) the off-site copy follows its own retention.
- **Report mode first.** The defaults are deliberate: run `report` until the findings look right
  on your servers before turning on `suspend`, and again after changing what you host.
