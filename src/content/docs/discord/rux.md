---
title: rux
description: Set up rux, the Discord moderation bot that takes orders in plain words, runs giveaways of credits and checks members' messages for spam and broken rules.
---

rux is the panel's moderation and toolbox bot on Discord. Admins tell it what to do in plain words,
by DM, by @mentioning it or with "hey rux": warn, time out or ban someone, run a giveaway of
credits, set a standing rule, watch a channel. Members of the roles admins make rux moderator
roles can have it moderate their server. rux also checks members' messages by itself: spam without
AI, and watched channels and standing rules with the AI. Admins set it up in Admin › Settings ›
Accounts › rux; Discord members only see what it posts.

> hey rux, make a giveaway of 500 credits for 2 winners that ends Friday at 18:00

> if anyone asks for new locations, warn them

> @Helpers can help with moderation, give them mod permissions

## What it does

### Who rux obeys

- **Admins**: Discord accounts linked to a panel admin (an account with the admin flag, not
  suspended or frozen) through the Discord Sign-in provider of
  [the Discord integration](/discord/integration/). Every tool, on every server rux works on.
- **Moderators**: members of a role an admin made a rux moderator role. The moderation tools only,
  only on that role's server, and never on staff.
- **Staff**: the server's owner, anyone whose roles may kick, ban, time out, manage messages or
  manage the server, and every rux moderator. Standing rules, watched channels and the spam check
  leave staff alone.

Moderator and staff are per server: a moderator of one server is nobody special on another. rux
ignores everyone else; in DMs it tells them once an hour that they are not allowed.

### Orders

- An order is a DM to rux, or a message on one of rux's servers that @mentions it, replies to it or
  calls it by name ("hey rux, …", "yo rux …", "rux, …"). Calls by name need the Message Content
  intent.
- One person gives at most **Orders per Minute** orders. An order sent while that person's last
  one in the same channel still runs is answered "still on your last order" and dropped.
- An order acts on the server it was written in. In a DM it acts on the main server (for a
  moderator, the first server they moderate) until they pick another one with "switch to" and the
  server's name. The pick is kept for a day.
- rux remembers the last **History** minutes of the conversation, reads the message an order
  replies to and its images, and makes at most **Steps per Order** model calls. An order ends
  within ten minutes.
- The answer is posted as a reply that never pings anyone.
- Cases, giveaways and rules have numbers ("case 12", "giveaway 3", "rule 5") that admins can
  refer to.

### What it can do

Everything acts on the order's server only: its members, channels, roles, cases, rules and
giveaways.

| Area | What rux does | Moderators |
|---|---|---|
| Members | Look up a member, warn, time out, kick, ban, unban, set a nickname, clear warnings, list cases and bans | Yes |
| Messages | Read a channel, delete messages, purge (among the last 500 messages) | Yes, in channels they can see |
| Channels | Slowmode (up to 6 hours), lock and unlock | Yes, except the mod log; they unlock only channels rux locked |
| Server | Role info, a server overview | Yes |
| Roles | Give or take a role | No |
| Posting | Send a message, edit one of rux's own messages, send a DM | No |
| Giveaways | Create, edit, end, cancel, reroll | List only |
| Credits | Give a user credits | No (Main Admin only) |
| Standing rules | Add, edit, remove, watch a channel, make a role a moderator role | List only |
| Servers | Pick the server a DM acts on (with more than one server) | Yes |

### Moderation

- Every action is a **case**: who ordered it (or rux itself, with the rule), on whom, why, for how
  long, and the message rux acted on. It is posted to the server's mod log and carries the order in
  Discord's audit log. The member gets a DM first for warnings, timeouts, kicks and bans.
- Moderators never act on staff, panel admins, themselves or the bot. When rux cannot tell whether
  someone is an admin, it leaves them alone.
- Warnings count per server. The **warning ladder** times a member out from **Timeout from
  Warning** on, and bans them from **Ban from Warning** on. When Discord refuses that step, the
  warning stays and its case says why.
- Bans are for good or for a while (1 minute to 10 years). rux lifts a timed ban itself, with a case
  of its own. A new ban replaces a running one. Timeouts last up to 28 days.
- Discord bulk deletes only messages from the last 14 days; older ones go one by one.
- rux never hands out a role that comes with rewards (boost roles, the two-boost role, roles managed
  by a bot) or @everyone.

### Giveaways

- The prize is always credits. A title can name the occasion but never promise anything else
  (memberships, tokens, resources, Nitro, roles); such a giveaway is refused.
- The post has an **Enter** button. Entering needs a linked Discord account; someone who is not
  linked gets a **Link** button. Someone already in can leave.
- An admin can keep out the winners of the last 0 to 10 giveaways.
- Limits: **Most Credits per Winner**, **Most Winners per Giveaway**, **Longest Giveaway**; it ends
  at least a minute from now. A giveaway is refused while nothing can pay it (credits off).
- At the end, winners are drawn at random among the entries that are still linked and still in the
  server, and pinged in the channel. Reroll draws more winners the same way.
- Each winner's credits go into their balance once. A winner who unlinked waits until they link
  again; waiting payouts are retried for 90 days.

### Credit gifts

Only the Discord accounts in **Main Admin (Gives Credits)** can have rux give someone credits, at
most **Most Credits per Gift** at once. A retried order gives nothing twice. Gifts and giveaways are
the only things rux gives.

### Standing rules

- An admin's order like "if anyone asks for new locations, warn them" becomes a standing rule: what
  breaks it, what looks close but does not, its keywords, what rux does (warn, time out, delete,
  kick, ban), whether the message is deleted, what the member is told and in which channels.
- A member message that hits a rule's keywords is checked by the AI. On a clear break rux acts as
  the rule says, logs "rule #5" in the audit log and says so in the channel, so the member sees it
  even with DMs closed.
- One rule acts on the same member at most once per **Rule Cooldown**.
- Removing a rule switches it off; it stays for its cases.

### Watched channels

- "Watch #support" has every member message in that channel checked by the AI, in batches, against
  the standing rules and, while **Watched Channels Also Enforce the Basic Guidelines** is on, the
  basic guidelines: scams and phishing, slurs and hate, harassment, sexual or gore content,
  advertising. A message that breaks a guideline is deleted and its author warned.
- The checks treat your own sites as yours, never as adverts: **Our Own Sites**, a server's **Its
  Own Sites**, the panel's address and the Discord invite.
- When no model can answer at all, watching pauses for ten minutes and the waiting messages are
  dropped unchecked.

### Spam

While **Catch Spam Automatically** is on, rux checks every channel without AI:

- **Flooding**: the Flooding: Messages-th message within Flooding: Seconds.
- **Repeats**: the Repeats: Messages-th copy of the same text within Repeats: Seconds, in any
  channel. The first copy stays.
- **Mentions in One Message** or more people and roles pinged, or **Emoji in One Message** or more
  emoji.

Every caught message is deleted and the member is warned at most once per Rule Cooldown (30 seconds
at least) per server; within the cooldown the spam is only deleted. The warning is a case, counts
towards the warning ladder and is said in the channel.

### More than one server

rux works on the main server and up to nine more, with one bot. Each server has its own rules,
watched channels, moderator roles, warnings, cases, giveaways, mod log and giveaway channel. Admins,
the Main Admin list and credits are the same everywhere. Removing a server stops rux there.

## Requirements

- A Discord application with a bot for rux, with the **Message Content Intent** on. Without it rux
  connects without it: DMs and @mentions work, "hey rux", standing rules, watched channels and the
  spam check do not.
- [The Discord integration](/discord/integration/) on with a Server ID, and its **Moderation Bot**
  switched on with rux's token.
- The **Discord Sign-in** provider set on the Discord tab, and each admin's Discord account linked
  in Account › OAuth Links. Without it nobody is an admin.
- At least one AI model in Admin › Settings › AI › neo ([neo](/ai/neo/#setup)). rux calls neo's
  models directly: neo does not have to be switched on, and no neo limits apply. For watched
  channels and standing rules, at least one model must be open to everyone.
- Credits on (Admin › Settings › Economy) for giveaways and gifts.

## Setup

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create a **New
   Application** for rux. Open **Bot**, click **Reset Token** and copy the token. Under **Privileged
   Gateway Intents**, turn on **Message Content Intent** and save.
2. Admin › Settings › Accounts › Discord: switch **Discord** on with your **Server ID**, switch on
   **Moderation Bot** and paste the token into **Moderation Bot Token**. Pick the **Discord
   Sign-in** provider if you have not ([setup](/discord/integration/#setup)). Save.
3. Every admin who should give orders links Discord in Account › OAuth Links.
4. Admin › Settings › AI › neo: add at least one model, open to everyone ([neo setup](/ai/neo/#setup)).
5. Admin › Settings › Accounts › rux: the top of the page lists what still stops rux. Fill in the
   **Bot** section (main server, time zone, language) and the **Mod Log Channel ID**, then save.
6. Once the token is saved, the page shows an **Invite link** per server. Open each and add the
   bot. It asks for the `bot` and `applications.commands` scopes and these permissions: View Channels, Send
   Messages, Send Messages in Threads, Embed Links, Read Message History, Manage Messages, Pin
   Messages, Manage Channels, Kick Members, Ban Members, Moderate Members (time out), Manage Roles,
   Manage Nicknames and Manage Server.
7. In each server's Settings › Roles, drag rux's role above the roles of the members it should act
   on and the roles it should hand out. Discord lets a bot act only below its own highest role.
8. DM rux "hey" from a linked admin account. It answers.

The page shows the moderation bot's state: starting, refused (wrong token, intents not allowed,
closed), online without the Message Content intent, or `rux is online, connected as <name>`.

## Settings

Admin › Settings › Accounts › rux. Channel, server and user ids are Discord ids: turn on Developer
Mode in Discord (User Settings › Advanced) and right-click › Copy ID.

### Bot

| Setting | Default | What it does |
|---|---|---|
| Name | `rux` | What members call it and what it calls itself. Letters, digits, `-` and `_`, up to 32 |
| Main Discord Server ID | The Discord tab's Server ID | The main server; DMs act on it until someone picks another |
| Time Zone | `UTC` | The zone rux reads and writes every time in (an IANA name like `Europe/Berlin`) |
| Language | English | The language rux posts in: English or German |
| Orders per Minute | 6 | Orders one person may give a minute (1 to 120) |
| Steps per Order | 8 | Model calls one order may take (2 to 30) |
| History | 30 | Minutes of conversation an order remembers (1 to 1440) |

### Giveaways and Moderation

| Setting | Default | What it does |
|---|---|---|
| Default Giveaway Channel ID | Empty | On the main server; used when an order names no channel |
| Mod Log Channel ID | Empty | On the main server; every action is posted here |
| Most Credits per Winner | 10000 | 1 to 1000000 |
| Most Winners per Giveaway | 25 | 1 to 500 |
| Longest Giveaway | 60 | Days, 1 to 365 |
| Main Admin (Gives Credits) | Empty | Up to 20 Discord user ids that may have rux give credits. Empty turns gifts off |
| Most Credits per Gift | 10000 | 1 to 1000000 |

### More Discord Servers

Up to nine, each with:

| Setting | What it does |
|---|---|
| Server ID | Its Discord server id (not the main one, each once) |
| Name | Whose server it is in rux's prompts, such as `example.com`. Empty: the panel's name |
| What It Is | Completes "(name) is …", such as "a free VPS host". Empty: a free game server host |
| Default Giveaway Channel ID, Mod Log Channel ID | Its own channels |
| Its Own Sites | More domains the checks treat as this host's own, on top of Our Own Sites |

### Warnings

| Setting | Default | What it does |
|---|---|---|
| Timeout from Warning | 3 | From this warning on, each new one also times the member out (0 turns it off, up to 100) |
| Timeout Length | `24h` | A duration like `24h` or `7d`, at most `28d` |
| Ban from Warning | 5 | From this warning on, each new one bans the member for a while (0 turns it off) |
| Ban Length | `24h` | A duration; rux lifts the ban afterwards |

### AI

The section lists the models rux uses for orders and for checks, in order.

| Setting | Default | What it does |
|---|---|---|
| Watched Channels Also Enforce the Basic Guidelines | On | Scams, slurs, harassment, sexual content and advertising: deleted and warned |
| Catch Spam Automatically, in Every Channel | On | The spam check, without AI |
| Flooding: Messages, Flooding: Seconds | 7, 10 | 2 to 100 messages within 1 to 600 seconds |
| Repeats: Messages, Repeats: Seconds | 3, 120 | 2 to 100 copies within 1 to 3600 seconds |
| Mentions in One Message | 6 | 2 to 100 |
| Emoji in One Message | 25 | 2 to 500 |
| Rule Cooldown | 300 | Seconds between two actions of one rule on the same member (0 to 86400) |
| Our Own Sites | Empty | Up to 20 domains (`example.com`, with its subdomains) that are never a scam or an advert |

## Background tasks

Runs on the instance with `APP_PRIMARY=true` only.

| Task | When | What it does |
|---|---|---|
| `rux` | Every 10 seconds | Draws due giveaways and lifts timed bans; once a minute restarts orders that lost their worker; once a day deletes rux's stored messages older than 30 days |

## Notes

- rux's AI: orders try the models open only to members first, then the others. Message checks
  (watched channels, standing rules) never use the members-only models: when the others cannot
  answer, the message is not checked. A busy AI is waited out for up to two and a half minutes per
  order.
- Without any usable model the page says rux cannot think, and orders are answered that the AI is
  unavailable.
- rux keeps every order, its answers and the tools' output for 30 days, so the next order of a
  conversation remembers it.
- Member text reaches the AI marked as untrusted data, so a message cannot give rux orders.
- With noprofit.space connected, rux's admins are noprofit.space's admins, giveaways and gifts are
  paid to noprofit.space balances, rux can take its models from noprofit.space, and its settings can
  be kept there (then shown read-only on this page). See [noprofit.space](/accounts/noprofit/).
