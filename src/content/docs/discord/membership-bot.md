---
title: Membership bot
description: Create the Discord application behind plugged-host-discord, use it as the panel's Discord sign-in, invite it to your server and start its gateway daemon.
---

The membership bot is the Discord application of [plugged-host-discord](/plugins/discord/). It
checks who is in your Discord server, tracks invites and boosts for credit rewards, answers
`/invites`, `/topinvites` and `/setboost`, and its OAuth2 client is the panel's Discord sign-in
that users link their Discord with.

The panel can run up to three Discord applications. Each is a separate bot with its own token:

| | Membership bot | neo | rux |
| --- | --- | --- | --- |
| What | membership, invite and boost rewards, slash commands, Discord sign-in | account questions on Discord | moderation, rules, giveaways |
| Plugin | plugged-host-discord | plugged-host-ai | plugged-host-ai |
| Token | `DISCORD_BOT_TOKEN` | `NEO_BOT_TOKEN` | `RUX_BOT_TOKEN` |
| Server | `DISCORD_GUILD_ID` | `NEO_BOT_GUILD_ID` (defaults to `DISCORD_GUILD_ID`) | `RUX_GUILD_ID` (defaults to `DISCORD_GUILD_ID`) |
| Runs on | production only, unless `DISCORD_ALLOW_NON_PRODUCTION=true` | production only | production only |
| Status | `plugged-host:discord-bot-supervise --status` | `plugged-host:neo-bot-supervise --status` | `plugged-host:rux-supervise --status` |
| Log | `storage/logs/discord-bot.log` | `storage/logs/neo-bot.log` | `storage/logs/rux.log` |
| Guide | this page | [neo](/discord/neo/) | [rux](/discord/rux/) |

All three run on the panel box as long-lived artisan processes, started and restarted by the
panel's scheduler. There is nothing else to install.

## Before you start

- **PHP CLI** with `pcntl` (clean shutdown on signals), `posix` (stopping and checking the
  daemon) and `openssl` (the TLS WebSocket to Discord):

  ```bash
  php -m | grep -E '^(pcntl|posix|openssl)$'
  ```

- **`exec` and `shell_exec` allowed** for the CLI and for PHP-FPM: the supervisor starts the
  daemon with `exec`, and reads and writes the panel user's crontab. Check that neither is listed
  in `disable_functions`:

  ```bash
  php -r 'var_dump(ini_get("disable_functions"));'
  ```

  Check the PHP-FPM `php.ini` (for example `/etc/php/8.5/fpm/php.ini`) as well.
- **The scheduler line** in the panel user's crontab and the **queue worker** running (sign-in
  membership checks are queued). See [Queue and scheduler](/panel/queue-and-scheduler/). The
  bot adds the crontab line itself when it is missing, as long as `www-data` may use `crontab`.
- **The plugin's tables**: `sudo -u www-data php artisan migrate` in `/var/www/pelican`.
- **`APP_ENV=production`** in the panel's `.env`. On any other environment the bot refuses to
  connect (see [Dev panels](#dev-panels)).
- **plugged-host-economy enabled** if invites and boosts should pay credits. Without it, rewards
  are recorded as paid but no credits move.

## 1. Create the application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and click
   **New Application**. Name it after your panel (users see the name when they link Discord).
2. Open **Bot**, click **Reset Token** and copy the token. It is shown once.
3. On the same page, under **Privileged Gateway Intents**, switch on **Server Members Intent**.
   Without it Discord refuses the bot's gateway connection with code 4014: the daemon then
   reconnects without it, slash commands keep working, but joins are not attributed to invites
   and leaves are only noticed by the hourly check. Message Content Intent is not needed.

## 2. Use it as the panel's Discord sign-in

The application's OAuth2 client is how users link Discord to their panel account.

1. In the portal, open **OAuth2**. Copy the **Client ID** and **Client Secret** (reset the
   secret if it is hidden).
2. Under **Redirects**, add:

   ```text
   https://panel.example.com/auth/oauth/callback/discord
   ```

3. In the panel, open Admin › Settings › OAuth, click **Enable** on Discord and paste the client
   ID and secret. Pelican stores them as `OAUTH_DISCORD_CLIENT_ID`, `OAUTH_DISCORD_CLIENT_SECRET`
   and `OAUTH_DISCORD_ENABLED` in the `.env`.

Users then link Discord with the **Link Discord** button on the profile's Discord rewards tab.
The plugin hardens Pelican's Discord login: it refuses Discord accounts with an unverified
email, never links an existing panel account automatically by email (Pelican's "Auto Link
Missing Users" has no effect for Discord), and lets one Discord account belong to one panel
account only. Pelican's "Auto Create Missing Users" still decides whether a Discord login without
a panel account creates one. Users cannot unlink Discord themselves; an admin can, under Admin ›
Users › (user) › OAuth.

## 3. Leave the interactions endpoint empty

In **General Information**, leave **Interactions Endpoint URL** empty. Slash commands reach the
bot over its gateway connection. If a URL is set, Discord sends them there instead.

The panel does have an endpoint, `https://panel.example.com/api/discord/interactions`, for a
setup without the gateway daemon. It refuses every request unless **Discord Public Key**
(`DISCORD_PUBLIC_KEY`, from General Information) is set and the request's signature checks out.
You don't need it with the daemon running.

## 4. Invite the bot

In **OAuth2 › URL Generator**, tick the scopes **bot** and **applications.commands**, then the
bot permissions:

| Permission | Why |
| --- | --- |
| View Channels | See the server. |
| Manage Server | Read the server's invites, to attribute each join to an invite code. |
| Manage Channels | Receive invite create and delete events. |
| Manage Roles | Create and assign the "2x Booster" role. |

Open the generated URL and add the bot to your server. The same link by hand, with your
application's client ID:

```text
https://discord.com/oauth2/authorize?client_id=<client id>&scope=bot+applications.commands&permissions=268436528
```

## 5. Order the roles

In Discord, open Server Settings › Roles and drag the bot's role **above** the "2x Booster" role
(or the role you use for members with two boosts). Discord only lets a bot give roles that are
below its own. If no 2-boost role exists, the bot creates "2x Booster" the first time a member
has two boosts, below its own role.

## 6. Fill in the settings

Open Admin › Plugins › plugged.host Discord › Settings:

1. **Discord Server (Guild) ID**: in Discord, turn on Developer Mode (User Settings › Advanced),
   right-click your server's icon and choose **Copy Server ID**.
2. **Discord Server Invite URL**: a permanent invite to your server. The field comes filled with
   plugged.host's own invite; replace it.
3. **Discord Bot Token**: the token from step 1.
4. **Assigned Panel Role**: the panel role members get while they are in the server
   (`Discord Linked` by default).
5. Adjust the rewards and the reward hold if you want, then **Save**.

Every setting is described on the [plugin page](/plugins/discord/#settings). Saving with a new
server ID or token registers the slash commands for you.

## 7. Register the slash commands

Saving the settings does this. To do it by hand, or after changing the bot's application:

```bash
cd /var/www/pelican
sudo -u www-data php artisan plugged-host:discord-register-commands
```

This registers `/invites`, `/topinvites` and `/setboost` on your server, where they show up at
once. `--global` registers them for every server the bot is in instead (also what happens when
no server ID is set). `/setboost` is limited to members with the Administrator permission; the
panel checks that again when it runs.

## 8. Start the daemon and check it

The scheduler starts the gateway daemon within a minute of the token being saved. To install the
crontab line (if missing) and start it right away:

```bash
sudo -u www-data php artisan plugged-host:discord-bot-install
```

Then check it:

```bash
sudo -u www-data php artisan plugged-host:discord-bot-supervise --status
```

| Row | What to look for |
| --- | --- |
| Daemon | `running` |
| Supervision | `active — the scheduler checks every minute` |
| Heartbeat | a few seconds ago; `WEDGED` means it is about to be replaced |
| Gateway READY | when the connection last succeeded |
| Intents | `67`; a note about GUILD_MEMBERS means Server Members Intent is off |
| Failed starts | absent; a count with a countdown means the daemon keeps failing |
| Scheduler | `running — last tick …` |
| Log | `storage/logs/discord-bot.log` |

The same verdicts appear as two status boxes on the plugin's settings page: whether invites are
being counted, and what the daemon is doing.

Day-to-day control:

```bash
sudo -u www-data php artisan plugged-host:discord-bot-supervise --stop      # stays down until --start
sudo -u www-data php artisan plugged-host:discord-bot-supervise --start
sudo -u www-data php artisan plugged-host:discord-bot-supervise --restart
```

Use `--stop` before updating the panel and `--start` afterwards. The plugin also ships a wrapper
that checks PHP, cron and the panel user before running `discord-bot-install`; `PANEL`, `WEBUSER`
and `PHP` override its defaults:

```bash
sudo bash /var/www/pelican/plugins/plugged-host-discord/deploy/install-supervision.sh
```

## Dev panels

Only a panel with `APP_ENV=production` connects the gateway, registers slash commands and gives
or takes Discord roles. On any other panel the supervisor stays idle and stops a daemon it finds.

:::danger
Never give a dev or staging panel production's bot tokens. Two daemons on one token answer every
slash command twice and count every join twice, and a dev panel's hourly sync would add and
remove real members' roles from its own database. Create separate Discord applications for a dev
panel and a separate test server, then set `DISCORD_ALLOW_NON_PRODUCTION=true` in its `.env`.
:::

neo on Discord and rux have no such switch: they only ever run on a production panel.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Log says "Discord rejected the bot token (close 4004)", failed starts keep growing | The token was reset or mistyped. Paste the current one in the settings; the daemon is replaced within a minute. |
| Settings page says "Invites are not being counted" | Server Members Intent is off. Switch it on in the portal, then `plugged-host:discord-bot-supervise --restart`. |
| Settings page says "The gateway daemon is not being supervised" | The scheduler is not running. The box names the cause: crontab line missing (`plugged-host:discord-bot-install`), no cron daemon (`systemctl enable --now cron` as root), or another scheduler failure (check `storage/logs/laravel-*.log`). |
| "The gateway daemon is stopped on purpose" | Someone ran `--stop`. Run `--start`. |
| Supervision says `idle — not the production panel` | `APP_ENV` is not `production`. See [Dev panels](#dev-panels). |
| A command run as root says it refuses to run as root | `sudo` is missing; run it as `www-data` instead. |
| Slash commands do not appear | Invite the bot with the **applications.commands** scope and register them again. |
