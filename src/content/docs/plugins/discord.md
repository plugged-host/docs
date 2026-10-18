---
title: Discord
description: Discord server membership checks, credit rewards for invites and boosts, slash commands, and the self-supervised gateway daemon.
sidebar:
  order: 13
---

plugged-host-discord connects the panel to your Discord server. It checks whether each user who
linked Discord is a member of the server, rewards invites and boosts with credits, answers a few
slash commands, and keeps one long-lived gateway daemon running that tracks joins and leaves in
real time. It is also the base the [AI plugin](/plugins/ai/) builds its two Discord bots on: their
supervisor, the Discord account lookups and the credit payouts all come from here.

## What it does

- **Discord linking.** Users link Discord through Pelican's own Discord OAuth (the same Discord
  application). The plugin hardens it: a Discord account with an unverified email is refused, an
  existing panel account is never linked automatically by matching email, one Discord account can
  belong to one panel account only, and the `guilds` scope is requested so membership can be read
  with the user's own token. Discord is hidden from the profile's OAuth tab; users link from the
  Discord rewards tab, and an admin can unlink under Admin › Users › (user) › OAuth.
- **Membership checks.** A linked user is checked on every sign-in (a queued job) and every hour.
  The check uses the user's OAuth token first and falls back to the bot token.
- **What membership unlocks.** While a user is in the server they hold a panel role (default
  `Discord Linked`) so admins can see it, and [plugged-host-economy](/plugins/economy/) gives
  them its Discord tier instead of the default tier (more CPU, memory or disk, set in the economy
  settings). The subdomains plugin asks for a linked Discord and server membership by default
  (see [third-party plugins](/plugins/third-party/)). The role itself decides no limit.
- **Invite rewards.** The gateway daemon attributes every join to the invite code that was used.
  The join counts at once but pays only after the invited member has stayed for the hold period
  (6 hours by default). Discord accounts younger than the minimum age (30 days) and people who
  join through their own invite link never pay. If a member leaves, the invite stops counting
  and the credits are taken back: first from the balance, then by selling back purchased
  resources the inviter does not use, then as invite debt that is deducted from later rewards. A departure is
  only recorded when Discord confirms the member is gone; a timeout or rate limit leaves the
  record alone. Invites of a Discord account with no panel account wait until it links.
- **Boost rewards.** One boost pays 500 credits, two boosts pay 1,250 in total, each level once.
  Members with two boosts get a "2x Booster" role on Discord: the plugin uses a role whose name
  contains "2x boost", "2 boost", "tier 2 boost" or "booster 2", or creates "2x Booster".
- **Discord rewards tab** on the profile page (first tab, `/profile?tab=discord-rewards`), shown
  once a server ID is set: credits earned on Discord, invites paid, waiting (with the next payout
  time), left, too new and owed back, both boost levels, the rules, a **Check for new rewards**
  button (once a minute per user) and the reward history. Without a linked Discord it shows a
  **Link Discord** button.
- **Discord servers tab**: the Discord servers to join for more resources. It only exists with
  [plugged-host-noprofit](/plugins/noprofit/); standalone it is hidden.
- **Admin users table**: a Discord column (username, ID on hover, searchable).
- **Slash commands**, registered on your server:
  - `/invites [user]`: counted invites, pending rewards and credits, for you or another member.
  - `/topinvites [limit]`: the invite leaderboard (10 by default, at most 25).
  - `/setboost user count`: set a member's boost count (0, 1 or 2) and pay the reward. Only
    members with Discord's Administrator permission; checked by the panel, not only by Discord.
- **Giveaway and credit payouts** for [rux](/discord/rux/): standalone the panel records each
  giveaway in its own tables and pays winners through plugged-host-economy. A winner without a
  linked account stays pending and is paid when they link. Admin credit grants go the same way.
  With plugged-host-noprofit enabled, noprofit.space pays instead.
- **The gateway daemon and its supervisor.** The daemon holds one WebSocket to Discord for weeks.
  The scheduler checks it every minute and starts it when nothing holds its lock, replaces it
  when it stops heartbeating, and backs off when it keeps failing. If the scheduler's crontab line
  goes missing, the next panel page load puts it back. See [Gateway daemon](#gateway-daemon).
- **Production only.** The daemon, slash-command registration and Discord role changes only run
  on a panel with `APP_ENV=production`, unless `DISCORD_ALLOW_NON_PRODUCTION=true`.
- **HTTP interactions endpoint** at `/api/discord/interactions`, as an alternative to the
  gateway. It refuses every request without a valid Ed25519 signature, and refuses everything
  while no public key is set. The normal setup leaves it unused.

## Requirements

- `plugged_host.requires`: plugged-host-core.
- `plugged_host.optional`: plugged-host-economy. Credits for invites, boosts and giveaways need
  it (see [Notes](#notes)).
- A Discord application with a bot, **Server Members Intent** switched on, invited to your
  server. The same application's OAuth2 client is the panel's Discord sign-in.
- The panel's [queue worker and scheduler](/panel/queue-and-scheduler/).
- PHP CLI with the `pcntl`, `posix` and `openssl` extensions, and `exec` and `shell_exec` not in
  `disable_functions` (CLI and PHP-FPM).
- `sudo` on the panel box if you run the bot commands as root (they re-run themselves as the
  panel user).

## Setup

Follow [Membership bot](/discord/membership-bot/): create the application, enable Pelican's
Discord OAuth, invite the bot, fill in the settings and check the daemon.

## Settings

Admin › Plugins › plugged.host Discord › Settings, stored in the panel's `.env`. The bot token
and public key are never shown again: leave the field empty to keep the stored value. Saving
with a new server ID or token stops the daemon (the scheduler starts it again within a minute)
and registers the slash commands again.

The settings page also shows two status boxes: whether invites are being counted (the Server
Members Intent check) and what the gateway daemon is doing.

### Discord Server Connection

| Setting | Default | What it does |
| --- | --- | --- |
| Discord Server (Guild) ID `DISCORD_GUILD_ID` | empty | Your Discord server's ID. Nothing is checked and the rewards tab is hidden until it is set. |
| Discord Server Invite URL `DISCORD_INVITE_URL` | `https://discord.gg/plugged-host-1502647500295635085` | The invite shown to users who linked Discord but are not in the server. neo also uses it as its support link. The default is plugged.host's own server: set yours. |
| Discord Bot Token `DISCORD_BOT_TOKEN` | empty | The bot's token. Needed for joins, invites, boosts, slash commands and the bot-side membership check. |
| Discord Public Key `DISCORD_PUBLIC_KEY` | empty | Only for HTTP interactions: verifies Discord's signature on `/api/discord/interactions`. |

### Role & Membership Automation

| Setting | Default | What it does |
| --- | --- | --- |
| Assigned Panel Role `DISCORD_LINKED_ROLE_NAME` | `Discord Linked` | The panel role given while a user is in the server. Created if it does not exist. |
| Verify membership on login `DISCORD_SYNC_ON_LOGIN` | `true` | Queue a membership check every time a user signs in. |
| Remove role if not in server `DISCORD_UNLINK_REMOVE_ROLE` | `true` | Take the panel role away when the user leaves the server or Discord is unlinked. |

### Invite & Boost Rewards

| Setting | Default | What it does |
| --- | --- | --- |
| Credits Per Invite `DISCORD_CREDITS_PER_INVITE` | `50` | Credits per invited member who stays. |
| Minimum Account Age for Invites `DISCORD_INVITE_MIN_ACCOUNT_AGE_DAYS` | `30` | Discord accounts younger than this (days) count as ineligible and never pay. |
| Credits for 1 Server Boost `DISCORD_CREDITS_PER_BOOST_1` | `500` | Paid once for the first boost. |
| Credits for 2 Server Boosts `DISCORD_CREDITS_PER_BOOST_2` | `1250` | The total for two boosts; the second level pays the difference. |
| Discord 2-Boost Role ID `DISCORD_BOOST_2_ROLE_ID` | empty | The Discord role for members with two boosts. Empty: found by name or created as "2x Booster". |

### Invite Escrow & Clawback

| Setting | Default | What it does |
| --- | --- | --- |
| Reward Hold `DISCORD_INVITE_MATURITY_HOURS` | `6` | Hours an invited member must stay before the inviter is paid. `0` pays at once. |
| Reclaim credits when a member leaves `DISCORD_INVITE_CLAWBACK` | `true` | Take credits back when a paid invite leaves (balance, then unused purchased resources, then invite debt). |
| Gateway Intents `DISCORD_GATEWAY_INTENTS` | `67` | `67` = guilds, server members and invites (needs Server Members Intent). `65` = without the privileged intent. `1` = slash commands only. |

### Gateway Daemon & Supervision

These also apply to neo's and rux's daemons (plugged-host-ai uses this supervisor).

| Setting | Default | What it does |
| --- | --- | --- |
| Automatic restarts `DISCORD_BOT_SUPERVISOR_ENABLED` | `true` | Master switch for the supervisor. Off: the scheduler starts no daemon, for all three bots. |
| Reinstall scheduler entry automatically `DISCORD_BOT_AUTO_INSTALL_TRIGGER` | `true` | When the scheduler has not ticked for three minutes, a panel request writes the `schedule:run` line back into the panel user's crontab. |
| Gateway Idle Timeout `DISCORD_GATEWAY_IDLE_TIMEOUT` | `90` | Seconds of silence from Discord after which the daemon reconnects (45 to 3600). |
| Heartbeat Interval `DISCORD_BOT_HEARTBEAT_INTERVAL` | `15` | How often the running daemon records that it is alive (5 to 300 seconds). |
| Heartbeat Timeout `DISCORD_BOT_HEARTBEAT_TIMEOUT` | `120` | Silence after which the supervisor replaces the daemon. Values under 60 are treated as 60. |
| Maximum Restart Backoff `DISCORD_BOT_RESTART_MAX_BACKOFF` | `900` | Ceiling on the delay between failed starts (seconds). The delay doubles from 60 s and resets once a connection succeeds. |
| Log Rotation Size `DISCORD_BOT_LOG_MAX_BYTES` | `8388608` | The daemon log is rotated to `.1` past this size. |
| Run Daemon As User `DISCORD_BOT_RUN_AS` | `www-data` | The user the daemons and the crontab line belong to. Never root. |
| PHP Binary Override `DISCORD_BOT_PHP_BINARY` | empty | Full path to the PHP CLI used to start the daemons and in the crontab line. Empty: detected automatically. |

### Only in `.env`

| Setting | Default | What it does |
| --- | --- | --- |
| `DISCORD_ALLOW_NON_PRODUCTION` | `false` | Let a panel whose `APP_ENV` is not `production` connect the gateway, register commands and change roles. Only with its own Discord application. |

The plugin also reads Pelican's `OAUTH_DISCORD_CLIENT_ID` and `OAUTH_DISCORD_CLIENT_SECRET`
(Admin › Settings › OAuth) to refresh users' Discord tokens.

## Gateway daemon

`plugged-host:discord-bot` is the daemon. You never start it yourself: the scheduler runs
`plugged-host:discord-bot-supervise` every minute, which starts it in the background when nothing
holds its lock.

- **Liveness is a file lock** on `storage/app/plugged-host/discord/bot.lock`, released by the
  kernel however the daemon dies. A second daemon can never connect next to the first.
- **A stuck daemon is replaced** when its heartbeat is older than the heartbeat timeout. A
  daemon whose server ID or token no longer matches the settings is replaced too.
- **Failures back off**: 60 s, 120 s, 240 s … up to the maximum backoff. A revoked token passes
  every check and only fails when Discord refuses it, so without this the panel would start
  1,440 daemons a day.
- **`--stop` is sticky**: the daemon stays down until `--start`. Use it around panel upgrades.
- **The log** is `storage/logs/discord-bot.log`, rotated at the log rotation size.
- **The crontab line** is the only thing outside the panel directory. `discord-bot-install`
  adds it to the panel user's crontab if no `schedule:run` line for this panel is there, and the
  panel puts it back by itself (see the setting above). `discord-bot`, `discord-bot-supervise`
  and `discord-bot-install` re-run themselves as the panel user when started as root, so the line
  never lands in root's crontab and no root-owned files end up in `storage/`.

If Discord refuses the Server Members Intent (close code 4014), the daemon reconnects without it
and remembers that. Slash commands keep working, but joins are not attributed to invites and
leaves are only noticed by the hourly reconcile. The settings page then says "Invites are not
being counted".

## Commands

Run as `sudo -u www-data php artisan …` in `/var/www/pelican`.

| Command | What it does |
| --- | --- |
| `plugged-host:discord-sync [--user=] [--force]` | Check server membership and update the panel role (and rewards) for every linked user, or one user by ID or username. `--force` runs even when no server ID is set. |
| `plugged-host:discord-register-commands [--global]` | Register `/invites`, `/topinvites` and `/setboost` on your server, or globally with `--global` (also used when no server ID is set). |
| `plugged-host:discord-bot-supervise [--status] [--start] [--stop] [--restart] [--force]` | Without options: one supervisor tick (what the scheduler runs). `--status` shows the daemon, its heartbeat, intents, failed starts, the scheduler and the log path. `--stop` stops it and keeps it down, `--start` clears that and starts it, `--restart` does both, `--force` ignores the backoff. |
| `plugged-host:discord-bot-install [--dry-run] [--no-start]` | Add the scheduler's crontab line for the panel user if it is missing, then start the daemon. `--dry-run` only reports. |
| `plugged-host:discord-bot` | Run the gateway daemon in the foreground (debugging; Ctrl-C stops it). |
| `plugged-host:discord-invite-maturity [--inviter=] [--dry-run]` | Pay invite rewards whose hold has passed, for everyone or one inviter (Discord user ID). |
| `plugged-host:discord-invite-reconcile [--limit=200] [--restore] [--dry-run]` | Ask Discord whether tracked invitees are still in the server and uncount (and claw back) the ones it confirms are gone. `--restore` re-checks members marked as gone and puts back those still present. |
| `plugged-host:discord-invite-baseline [--force] [--dry-run] [--show]` | Store the invite counts Discord reports from before tracking started, as a leaderboard figure that never pays. `--show` prints what is stored. |
| `plugged-host:discord-boost-set {user} {count=2}` | Set a user's boost count (0 to 2) by hand and pay the reward. `user` is a panel username, user ID, email or Discord user ID. |

On the scheduler:

| Task | When |
| --- | --- |
| `plugged-host:discord-bot-supervise` | every minute |
| `plugged-host:discord-invite-maturity` | every five minutes |
| `plugged-host:discord-sync` | hourly |
| `plugged-host:discord-invite-reconcile` | hourly, at minute 23 |

## Doctor checks

The plugin registers no checks of its own; `plugged-host:doctor` only lists it with its required
and optional plugins. The bot's health is in `plugged-host:discord-bot-supervise --status` and in
the two status boxes on the settings page.

## Notes

:::caution
Without plugged-host-economy enabled, invite and boost rewards are still recorded as paid, but no
credits move, and they are not paid later. Enable economy before the bot goes live.
:::

- Change `DISCORD_INVITE_URL`: the default is plugged.host's own Discord server. Some texts on
  the rewards tab also name "the plugged.host Discord server"; they are in the plugin's
  `lang/<locale>/strings.php`.
- Leave **Interactions Endpoint URL** empty in the Discord Developer Portal. When it is set,
  Discord sends slash commands there instead of over the gateway.
- `/setboost` and `plugged-host:discord-boost-set` exist because Discord does not say how many
  times a member boosted. The plugin works it out from the 2-boost role and the server's boost
  total, which is a best guess.
- The self-repair and `discord-bot-install` only look at the panel user's own crontab. If you
  drive the scheduler from `/etc/cron.d` or a systemd timer instead, don't run
  `discord-bot-install`: it would add a second `schedule:run` line.
- The settings page hint mentions noprofit.space's Discord tier. Standalone, the Discord tier is
  the one in plugged-host-economy's settings. With plugged-host-noprofit enabled, linking,
  membership tiers, the Discord servers tab and boost payouts come from noprofit.space instead.
