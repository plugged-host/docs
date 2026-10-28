---
title: neo on Discord
description: Run neo as a bot on your Discord server that answers account questions for anyone, linked or not, with its own bot, limits and settings.
---

neo on Discord answers account questions on your Discord server: signing in, linking Discord, the
allowance, credits and tokens, memberships, locations and where to get help. Anyone may ask, linked
or not. It is account support, not server support: for a problem with one server it sends people
to [neo](/ai/neo/) in the panel, and it never changes anything. It runs as the panel's **Assistant
Bot**, a Discord bot of its own, on neo's models and limits. Admins set it up in Admin › Settings ›
Accounts › Discord and Admin › Settings › AI › neo on Discord; Discord members talk to it.

## What it does

### What it answers

- Every DM.
- On the server of [the Discord integration](/discord/integration/) (never another): a message that
  @mentions the bot, replies to one of its messages or, with **Answer When Called by Name** on,
  starts with its name ("hey neo, …", "neo: …"; the bot's username and display name both count).
- A screenshot without text counts as a question, and so does a mention in reply to someone else's
  message.
- It ignores bots, webhooks, system messages (joins, pins) and itself. One Discord account may send
  it **Messages per Minute** messages; the ones over it are ignored.

### Who is asking

- A Discord account linked to a panel account (through the Discord Sign-in provider) uses that
  account's neo limits and membership, shared with neo in the panel.
- A Discord account nobody linked gets windows of its own at **neo on Discord Without a Linked
  Account (% of These Limits)** of neo's limits (Admin › Settings › AI › neo). At 0, only linked
  accounts get answers.
- Discord answers always use the default model: a model the user picked in the panel's chat does
  not apply here.
- When a window is used up, the bot says when it resets. Someone not linked is also told where to
  link Discord (Account › OAuth Links on the panel) for the full limits.

### One answer

- A conversation is one person in one channel or DM. Messages sent while neo is still answering are
  answered together next, in one answer.
- The bot shows "is typing…" while it works. It makes at most **Steps per Answer** model calls,
  waits for busy models for up to two minutes, and has five minutes for the whole answer.
- The answer is posted as a reply to the last message, split into messages of at most 1900
  characters. It never pings anyone, the person it replies to included.
- In a DM, for a Discord account linked to a panel account that is not suspended, neo can look up
  that account: its overview (balances, allowance, memberships), its servers, and the options for a
  new server. These lookups only read. In a public channel it has no lookups and does not repeat
  account details.
- Moderation is not neo's job: that is [rux](/discord/rux/).

When it cannot answer, it posts a fixed line:

| When | Line |
|---|---|
| neo cannot think, models stay busy, the time is up | I can't answer right now, sorry. Try again in a few minutes, or ask the staff here if it's urgent. |
| Something broke | Something went wrong on my side. Try again in a moment. |
| The model said nothing | Sorry, I don't have an answer to that. Ask in the server and a human can help. |
| A window is used up | You've used up your limit for now. It resets (time). |
| A window is used up, not linked | You've used up the limit for Discord accounts that aren't linked. It resets (time). Link your Discord to an account on (panel name) for the full limits: (link) |

### Images

- Up to four images per answer: the messages' attachments, then those of the messages they reply
  to.
- Only PNG, JPEG, WebP and GIF of at most 10 MB from Discord's own CDN. They are fetched when the
  answer starts and shrunk to at most 1568 px a side.
- A model that cannot see images gets a note instead. Only the answer that reads them sees them.

### Memory

An answer remembers up to **Answers Remembered** earlier answers in the same conversation from the
last **Remember Answers For (Minutes)**, only ones that finished normally. Stored messages are
deleted after neo's **Keep Conversations (Days)**, like the panel's chats.

## Requirements

- A Discord application with a bot of its own for neo, separate from the Invite and Boost Bot and
  rux.
- [The Discord integration](/discord/integration/) on with a Server ID.
- [neo](/ai/neo/) switched on with at least one usable model. Otherwise the bot answers that it
  cannot answer right now.
- The **Discord Sign-in** provider on the Discord tab, for people to link. Without it everyone counts
  as not linked.
- The **Message Content Intent** only for Answer When Called by Name. Discord sends the text of DMs,
  mentions and replies to the bot without it.

## Setup

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create a **New
   Application** for neo. Open **Bot**, click **Reset Token** and copy the token. Turn on **Message
   Content Intent** under Privileged Gateway Intents only if you will use name calls.
2. Invite the bot to your server with the `bot` scope and the permissions View Channels, Send
   Messages, Send Messages in Threads, Embed Links and Read Message History:

   ```text
   https://discord.com/oauth2/authorize?client_id=<application id>&scope=bot&permissions=274877991936
   ```

3. Admin › Settings › Accounts › Discord: the integration on with your **Server ID**, **Assistant
   Bot** on, and the token in **Assistant Bot Token**. Save. Within about 15 seconds, Bot Status shows
   `Assistant bot: connected as <name>`.
4. Admin › Settings › AI › neo: neo on, with a model ([neo setup](/ai/neo/#setup)). Set the share for
   Discord accounts nobody linked under Usage Limits.
5. Admin › Settings › AI › neo on Discord: set the settings below and save.
6. DM the bot a question. It answers.

## Settings

Admin › Settings › AI › neo on Discord. The switch and token are the Assistant Bot's on the Discord
tab; the models, limits and how long messages are kept are neo's.

| Setting | Default | What it does |
|---|---|---|
| Answer When Called by Name | Off | Also answers messages that start with the bot's name. Needs the Message Content Intent |
| Messages per Minute | 6 | Messages one Discord account may send it a minute (1 to 60) |
| Steps per Answer | 6 | Model calls one answer may take, lookups included (2 to 20) |
| Remember Answers For (Minutes) | 60 | How old a remembered answer may be (1 to 1440) |
| Answers Remembered | 6 | How many earlier answers are remembered (0 to 20). 0: none |

Related settings elsewhere:

| Setting | Where | What it does |
|---|---|---|
| Assistant Bot, Assistant Bot Token | Admin › Settings › Accounts › Discord | Runs the bot |
| neo on Discord Without a Linked Account (% of These Limits) | Admin › Settings › AI › neo › Usage Limits | The share for Discord accounts nobody linked (default 50) |
| Keep Conversations (Days) | Admin › Settings › AI › neo | How long stored messages are kept (default 30) |

## Background tasks

They run on the instance with `APP_PRIMARY=true` only, where the bot connects.

| Task | When | What it does |
|---|---|---|
| `recover_neo_discord_messages` | Every minute | Answers a message that waited more than a minute (its worker failed); gives up messages that waited more than 15 minutes |
| `prune_neo_discord_messages` | Daily at 04:50 UTC | Deletes stored messages older than neo's Keep Conversations (Days) |

## Notes

- The bot asks Discord for its intents when it connects, so a change of **Answer When Called by
  Name** applies only to its next connection: after the panel restarts, or after you switch the
  Assistant Bot off, save, wait until Bot Status no longer lists it, and switch it on again.
- With name calls on and the Message Content Intent off in the Developer Portal, Discord refuses the
  intent and the bot connects without it: DMs, mentions and replies work, name calls do not.
- Messages sent while the bot is off are never answered later. A message given up after 15 minutes
  is not answered either.
- Member text and the message it replies to reach the model marked as untrusted data, so a message
  cannot give neo orders.
- With noprofit.space connected and running neo, it decides who is linked and meters these answers
  with its own limits. See [noprofit.space](/accounts/noprofit/).
