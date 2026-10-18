---
title: Commands
description: Every artisan command the plugged.host plugins add, and what the scheduler runs on its own.
---

All commands run as the panel user from the panel directory:

```bash
cd /var/www/pelican
sudo -u www-data php artisan plugged-host:doctor
```

The **Scheduled** column is what the plugin puts on Laravel's scheduler (driven by the
[cron line](/panel/queue-and-scheduler/)); it only runs while the plugin is enabled. Commands marked
*internal* are started by a bot's gateway daemon and are not meant to be run by hand.
`sudo -u www-data php artisan schedule:list` shows the schedule of your own panel.

Add `--help` to any command for its arguments.

## Core

[Core plugin](/plugins/core/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:doctor` `<plugin>` | Check that the plugged.host plugins have what they need and are healthy. |  |
| `plugged-host:sample-nodes` | Probe every node's wings once and record reachability, latency and load. | every minute |

## Servers

[Servers plugin](/plugins/servers/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host-servers:transfers` `--status` `--max=600` | Drive server transfers: stop, copy with live progress, retry, start. | every minute |
| `plugged-host:allowance-cuts` `--dry-run` | Bring servers down to fit allowances that were lowered (the base went down on noprofit.space). | every 5 minutes |
| `plugged-host:deploy-pause` `--show` | Pause deployment on nodes over their load line and reopen calmed ones. | every minute |
| `plugged-host:plusplus-expire` `--dry-run` | Move servers off Premium locations and trim CPU for accounts whose PlusPlus ran out. | every 5 minutes |
| `plugged-host:trim-memory` `<plan>` `--apply` | Take memory noprofit.space asked back off users' servers, evenly. |  |

## Economy

[Economy plugin](/plugins/economy/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:credits-reset` `--dry-run` `--force` | Zero every credit balance and Discord invite counter, keeping purchased resources and the transaction history. |  |

## FiveM

[FiveM plugin](/plugins/fivem/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:fivem-setup` `--servers` `--dry-run` | Put the cfx eggs (and with --servers, every FiveM server) on the plugged.host FiveM image. |  |

## Devbox

[Devbox plugin](/plugins/devbox/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:devbox-reconcile` `--dry-run` | Stop idle devboxes, finish stops, kill stray devbox containers and remove orphaned, moved or unused devboxes. | every minute |
| `plugged-host:devbox-setup` | Install or update the devbox egg and the account that owns devbox servers. |  |
| `plugged-host:devbox-web-setup` `--no-dns` | Set up VS Code in the browser for devboxes: CA, edge certificate and the running devboxes' DNS records. |  |

## Limbo

[Limbo plugin](/plugins/limbo/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:limbo-sweep` `--dry-run` `--status` | Stop and hibernate idle servers, and hand hibernated ones to the limbo node. | every minute |

## Queue

[Queue plugin](/plugins/queue/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:queue-refund-priority-passes` `--dry-run` | Close the priority passes Plus replaced and refund what was still running. |  |
| `plugged-host:queue-sweep` `--status` `--release` | Release start-queue entries whose node has room or whose wait has run out. | every minute |

## Ads

[Ads plugin](/plugins/ads/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:ads-in-game` `--dry-run` `--all` | Send the in-game ad to the Minecraft servers whose turn it is. | every minute |

## Storage

[Storage plugin](/plugins/storage/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:deleted-servers` `--url=` `--extend=` `--days=7` `--all` | List deleted servers whose copy on the storage box is kept, with a download link or a longer hold. |  |
| `plugged-host:failover-sweep` `--dry-run` `--status` `--drill=` `--resume=` | Detect offline nodes and (in auto mode) recover their servers from the storage mirror. | every minute |
| `plugged-host:storage-setup` `--backup` | Print the command that sets the storage box (or --backup: the backup server) up (one-time code, valid for an hour). |  |

## Abuse

[Abuse plugin](/plugins/abuse/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:abuse-purge` `--dry-run` | Delete servers suspended by the abuse checks once ABUSE_DELETE_AFTER_HOURS have passed. | hourly |
| `plugged-host:abuse-watch` | Watch for servers pinned at their CPU limit and check them for abuse. | every minute |
| `plugged-host:scan-abuse` `--suspend` `--dry-run` `--server=*` `--egg=` `--all` | Check servers for crypto miners, VPN/proxy cores, DDoS and scanning tools, backdoors and obfuscated code. | every 3 hours (`--suspend`) |

## Status

[Status plugin](/plugins/status/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:status-collect` | Collect public service telemetry and atomically export the status page data. | every minute |
| `plugged-host:status-export` | Regenerate the public status JSON and incident feed. |  |
| `plugged-host:status-prune` | Delete status telemetry outside the configured retention period. | daily, 03:17 |

## Discord

[Discord plugin](/plugins/discord/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host:discord-boost-set` `<user>` `<count>` | Manually set a user's Discord boost count and award credits. |  |
| `plugged-host:discord-bot` | *Internal.* Run the plugged.host Discord Bot gateway daemon to handle slash commands (/invites) and track joins and leaves. |  |
| `plugged-host:discord-bot-install` `--dry-run` `--no-start` | Install the crontab trigger that keeps the plugged.host Discord gateway daemon alive, then start it. |  |
| `plugged-host:discord-bot-supervise` `--status` `--start` `--stop` `--restart` `--force` | Keep the plugged.host Discord gateway daemon running, or start/stop/inspect it by hand. | every minute |
| `plugged-host:discord-invite-baseline` `--force` `--dry-run` `--show` | Freeze pre-tracking Discord invite totals from invite.uses as a display-only leaderboard baseline. |  |
| `plugged-host:discord-invite-maturity` `--inviter=` `--dry-run` | Award Discord invite rewards whose escrow window has elapsed. | every 5 minutes |
| `plugged-host:discord-invite-reconcile` `--limit=200` `--restore` `--dry-run` | Verify tracked Discord invitees are still in the guild, uncounting and clawing back the ones who left. | hourly, at :23 |
| `plugged-host:discord-register-commands` `--global` | Register Discord bot slash commands (/invites, /topinvites) with Discord API. |  |
| `plugged-host:discord-sync` `--user=` `--force` | Synchronize Discord server membership and update panel roles for users. | hourly |

## AI

[AI plugin](/plugins/ai/)

| Command | What it does | Scheduled |
|---|---|---|
| `plugged-host-ai:neo-chat` `<user>` `<message>` `--server=` `--approve` `--new` | Ask neo something as a given user and print the transcript. |  |
| `plugged-host-ai:neo-prune` | Delete neo conversations (panel and Discord) older than the retention period. | daily, 03:40 |
| `plugged-host:neo-bot-ask` `<discord_id>` `<message>` `--dm` `--name=` `--new` | Ask neo on Discord a question from the terminal (prints the answer). |  |
| `plugged-host:neo-bot-gateway` | *Internal.* Run neo's Discord gateway daemon (supervised by plugged-host:neo-bot-supervise). |  |
| `plugged-host:neo-bot-handle` `<message>` | *Internal.* Answer a message sent to neo on Discord (started by neo's gateway daemon). |  |
| `plugged-host:neo-bot-supervise` `--status` `--start` `--stop` `--restart` `--force` | Keep neo's Discord gateway daemon running, or start/stop/inspect it by hand. | every minute |
| `plugged-host:rux-ai` | Fetch neo's AI providers for rux now and show them. |  |
| `plugged-host:rux-gateway` | *Internal.* Run rux's Discord gateway daemon (supervised by plugged-host:rux-supervise). |  |
| `plugged-host:rux-handle` `<message>` | *Internal.* Carry out one order given to rux (started by the rux gateway daemon). |  |
| `plugged-host:rux-rule-check` `<hit>` | *Internal.* Check a message against rux's standing rules and act on it (started by the rux gateway daemon). |  |
| `plugged-host:rux-spam` `<caught>` | *Internal.* Delete spam rux caught and warn its author (started by the rux gateway daemon). |  |
| `plugged-host:rux-supervise` `--status` `--start` `--stop` `--restart` `--force` | Keep rux's Discord gateway daemon running, or start/stop/inspect it by hand. | every minute |
| `plugged-host:rux-tick` | rux housekeeping: draw due giveaways, retry payouts, lift ran-out bans. | every minute |
| `plugged-host:rux-watch` | Check the messages queued from rux's watched channels. |  |

## noprofit.space

[noprofit.space plugin](/plugins/noprofit/)

| Command | What it does | Scheduled |
|---|---|---|
| `noprofit:accounts-sync` `--full` | Send server usage and Discord state of linked accounts to noprofit.space. | every minute, `--full` every 15 minutes |
| `noprofit:credits-sync` `--full` | Keep panel credits in step with noprofit.space. | every minute |
| `plugged-host:discord-giveaways-export` `<file>` | Export giveaway history for noprofit.space (noprofit:giveaways-import). |  |
## Scheduled tasks without a command

| Task | Plugin | Scheduled |
|---|---|---|
| Doctor scheduler tick (proves cron runs) | Core | every minute |
| Doctor queue heartbeat (a tiny queued job, proves the worker runs) | Core | every 5 minutes |
| Prune expired rows of the database cache store (only when the cache driver is `database`) | Core | hourly |
| Prune rux's stored messages | AI | daily, 04:17 |
