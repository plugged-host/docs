---
title: rux
description: Set up rux, the Discord moderation and giveaway bot of plugged-host-ai, with its application, permissions, role order and the people it takes orders from.
---

rux is the moderation and giveaway bot of [plugged-host-ai](/plugins/ai/). Admins give it orders
in plain language, slang and typos included, by DM, by @mentioning it or by starting a message
with "hey rux":

> hey rux, make a giveaway that ends on the 4th at 5pm for 500 credits, dont let the last 2 winners join

> if anyone asks for new locations, warn them

> @Helpers can help with moderation, give them mod permissions

rux posts the giveaway with an **Enter** button and draws it at the end time, turns the second
order into a standing rule it enforces from then on, and makes the Helpers role a rux moderator
role. It is a moderation and toolbox bot, not a support bot: [neo](/discord/neo/) answers
questions.

## What you need

- plugged-host-ai enabled with its tables (`sudo -u www-data php artisan migrate` in
  `/var/www/pelican`).
- **neo's AI providers set up** ([neo, step 1](/discord/neo/#1-add-an-ai-provider)). rux calls
  the same providers directly, in the same order with the same failover. Its use counts against
  the providers' keys, never against anyone's neo limits; neo does not have to be switched on.
- [plugged-host-economy](/plugins/economy/) enabled, if giveaways and credit gifts should pay.
  Winners are paid in its credits; without it they stay pending.
- A panel with `APP_ENV=production`. rux has no override: it never runs on a dev panel.
- The PHP CLI requirements and the scheduler of the
  [membership bot](/discord/membership-bot/#before-you-start). rux uses its supervisor.

## 1. Create the application

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create a
   **New Application**, for example "rux".
2. Open **Bot** and click **Reset Token**. Copy the token.
3. Under **Privileged Gateway Intents**, switch on **Message Content Intent**. Standing rules,
   watched channels and "hey rux" need it. Without it Discord refuses the connection (close
   code 4014); rux then reconnects without it, so DMs and @mentions keep working, and tries
   again with it every 6 hours. The settings page says when this happens.

## 2. Fill in the settings

Open Admin › Plugins › plugged.host AI › Settings, tab **rux**:

| Field | What to enter |
| --- | --- |
| rux is on | On. |
| Bot token | The token from step 1. |
| Discord server id | The server rux moderates. Defaults to the membership bot's (`DISCORD_GUILD_ID`). |
| Time zone | The zone rux reads and writes every time in, for example `Europe/Berlin`. Default `Europe/Paris`. Members see times as Discord timestamps in their own zone. |
| Default giveaway channel id | Optional: where giveaways go when an order names no channel. |
| Mod log channel id | Optional: every moderation action is posted here. |
| Most credits per winner, Most winners per giveaway | Sanity limits for one order (10,000 and 25 by default). |
| Main admin (gives credits) | Discord user IDs, comma separated, of the people who may have rux give someone credits. Empty turns this off. |
| Most credits per gift | Upper limit for one gift (10,000). |
| Warnings | The warning steps, see [Warnings](#warnings). |
| AI | Whether watched channels enforce the basic guidelines, and the spam guard. The section also shows the provider chain rux uses. |

Channel and user IDs are copied in Discord with Developer Mode on (User Settings › Advanced),
by right-clicking the channel or user. Every setting and its `.env` key is on the
[plugin page](/plugins/ai/#tab-rux).

Save. The scheduler starts rux within a minute once nothing blocks it.

## 3. Invite it

Get the invite link:

```bash
sudo -u www-data php artisan plugged-host:rux-supervise --status
```

The `Invite:` line has scope `bot` and permissions `2253174605966358`:

| Permission | Used for |
| --- | --- |
| View Channels, Read Message History | Reading orders and the messages rules apply to. |
| Send Messages, Send Messages in Threads, Embed Links | Replies, giveaways, notices, the mod log. |
| Manage Messages, Pin Messages | Deleting and purging messages, pinning. |
| Manage Channels | Locking channels and slowmode. |
| Kick Members, Ban Members, Timeout Members | Moderation and the warning steps. |
| Manage Roles | Managing roles and giving moderator roles their permissions. |
| Manage Nicknames | Setting nicknames. |

The rux tab shows the same link in its status box once rux can run.

## 4. Order the roles

In Discord, open Server Settings › Roles and drag rux's role **above** the roles of every member
it should be able to moderate, and above the roles it should manage (including the moderator
roles it gives permissions to). Discord does not let a bot act on anyone whose highest role is
above its own, or on the server owner.

## 5. Check it

```bash
sudo -u www-data php artisan plugged-host:rux-supervise --status
```

| Line | Meaning |
| --- | --- |
| Runnable | `yes`, or everything still missing: production, the switch, the token, the server ID, the account directory, neo's providers, the tables. |
| Running | Whether the daemon runs, with its process ID. |
| Paused | `yes` after `--stop`. |
| Connected | When it connected, and as which bot. |
| Heartbeat | Seconds since the daemon last reported. |
| Invite | The invite link. |
| Log | `storage/logs/rux.log` |

```bash
sudo -u www-data php artisan plugged-host:rux-supervise --stop      # stays down until --start
sudo -u www-data php artisan plugged-host:rux-supervise --start
sudo -u www-data php artisan plugged-host:rux-supervise --restart
sudo -u www-data php artisan plugged-host:rux-ai                    # the provider chain rux uses
```

The daemon is replaced by itself when the token or server ID changes. Its restart timings are
plugged-host-discord's [supervisor settings](/plugins/discord/#gateway-daemon--supervision).

## Who rux listens to

- **Admins** can order everything except giving credits. An admin is a Discord account linked
  to a panel account that is a root admin. Link it through the panel's Discord sign-in
  ([Membership bot](/discord/membership-bot/#2-use-it-as-the-panels-discord-sign-in)). With
  plugged-host-noprofit enabled, admins are noprofit.space admins instead.
- **The main admins** (`RUX_CREDIT_GRANTERS`) can also have rux give someone credits, at most the
  gift limit at once. They must be admins as well. Other admins, moderators, standing rules and
  text rux reads can never make it pay. The credits go to the panel account the person linked
  Discord to, as an admin adjustment.
- **Moderators** are members of a role an admin made a rux moderator role. They can order
  moderation only: look up members, warn, time out, kick, ban, unban, set nicknames, read,
  delete and purge messages, lock channels and slowmode, clear warnings, and see the rules,
  giveaways, case log, bans, role permissions and a server overview. They only read or delete in
  channels they can see themselves, never touch the mod log channel, and can never act on staff,
  admins, other moderators or themselves.
- **Everyone else** is ignored. In a DM they are told, at most once an hour, that rux only takes
  orders from admins; on the server rux stays silent.

Making a role a moderator role also gives it Discord's Kick, Ban, Manage Messages and Timeout
permissions, unless the admin says not to. Taking it back removes exactly what rux added.

One order at a time per conversation: an order that arrives while the last one is still being
carried out is answered "still on your last order" and dropped. rux remembers the last 30
minutes of a conversation with an admin.

## Moderation

Every moderation action is a case. It is posted to the mod log channel when one is set,
Discord's audit log shows who ordered it, and the member gets a DM with the reason (before a
kick or ban). When rux acts by itself (a rule, a watched channel, spam) the case keeps the start
of what the member wrote.

### Warnings

Warnings count until an admin or moderator clears them. With the defaults:

- the 3rd and the 4th warning also time the member out for 24 hours;
- the 5th and every later warning bans them for 24 hours, and rux lifts the ban afterwards.

Manual, rule and watched-channel warnings all count. Change the steps on the rux tab (a step at
`0` is off; timeouts are at most 28 days).

### Standing rules and watched channels

- **Standing rules** ("if anyone asks for X, warn them"): rux turns the order into a description,
  exceptions and keywords. The daemon compares every member message with the keywords; a hit is
  checked by the AI before rux acts (warn, time out, delete, kick or ban, with a short notice in
  the channel). One rule acts on one member at most once every 5 minutes.
- **Watched channels** start as `chat` and `bot-commands` (matched by name, so `💬│chat` counts);
  admins add and remove channels by telling rux. Every member message there is checked in batches
  against every rule and against the basic guidelines: scams and phishing, slurs, harassment,
  sexual content and advertising. Breaking a guideline deletes the message and warns the author
  (`RUX_WATCH_GUIDELINES` turns the guidelines off). When the AI is busy for long, messages are
  skipped rather than checked late.
- **Spam** is caught without AI in every channel rux can read: 7 messages within 10 seconds, the
  3rd copy of the same text within 2 minutes, 6 or more people and roles pinged, or 25 or more
  emoji. The spam is deleted and the author warned (the thresholds are `RUX_SPAM_*` in the `.env`).
- **Staff are never checked**: the server owner, anyone with Administrator, Manage Server, Kick,
  Ban, Timeout or Manage Messages, and rux moderators.

## Giveaways

- Entering needs a Discord account linked to a panel account; people who are not linked get a
  button to link it.
- "Keep out the winners of the last N giveaways" (N up to 10) uses the newest giveaways at the
  moment the giveaway is created; rux's reply names them.
- The draw runs at the end time: the daemon checks every 10 seconds, the scheduler every minute
  as a fallback. Winners are picked at random among entrants still linked and still in the
  server, and paid in credits under a key per draw, so a retried payout pays nobody twice. A
  payout that fails is retried every minute.
- Rerolls draw extra winners, and pay them too.

## Back up rux's tables

Moderator roles, standing rules, watched channels and the case log are set from Discord and
exist only in the panel's database:

| Table | Holds |
| --- | --- |
| `rux_moderator_roles` | Which Discord roles are rux moderators, and what rux added to them. |
| `rux_rules` | Standing rules. |
| `rux_watches` | Watched channels. |
| `rux_cases` | The case log: warnings (the warning steps count from here) and the timed bans rux still has to lift. |
| `rux_giveaways`, `rux_giveaway_entries` | Giveaways and their entries. |
| `rux_messages` | rux's conversation memory, pruned after 30 days. |
| `rux_watch_queue` | Messages waiting for a watched-channel check. |

Include them in your database backups, and restore them when you rebuild the panel. Without
them rux starts with no moderators, no rules, only the two default watched channels and no
warning history, and never lifts the temporary bans it already gave.

## Notes

- rux's prompts describe plugged.host, and its message checks treat plugged.host's sites and
  Discord invite as never a scam. Edit `src/Rux/Agent/RuxPrompt.php`,
  `src/Rux/Rules/ServerFacts.php` and `src/Rux/Rules/RuleService.php` in the plugin to describe
  your own service, or links to your own site may be judged as advertising. The settings page
  text about "noprofit.space admins" means panel root admins on a standalone panel.
- What rux posts on Discord is in English; set `RUX_LOCALE=de` for German.
- rux orders try a premium provider slot first, if one is set; message checks never use it.
  Provider rate limits are shared with neo when both use the same keys, so busy providers can
  delay rux too.
- Never put production's `RUX_BOT_TOKEN` in a dev panel's `.env`.
