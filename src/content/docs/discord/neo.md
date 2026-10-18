---
title: neo
description: Set up neo, the AI assistant of plugged-host-ai, with AI providers and usage limits on the panel, the chat in the panel, and neo on Discord.
---

neo is the AI assistant of [plugged-host-ai](/plugins/ai/). In the panel it carries out tasks on
a user's servers and account with that user's permissions; on Discord it answers account
questions as its own bot. Both run on AI providers you set on the panel. This page sets up the
providers and limits, turns on the chat, then puts neo on Discord.

## What you need

- plugged-host-ai enabled, with plugged-host-core and plugged-host-discord, and its tables:
  `sudo -u www-data php artisan migrate` in `/var/www/pelican`.
- An API key for at least one AI provider, reachable at a public `https` URL.
- A writable panel `.env`: the settings form writes the providers there.
- For neo on Discord: a panel with `APP_ENV=production` and the scheduler running.

## 1. Add an AI provider

Open Admin › Plugins › plugged.host AI › Settings, tab **neo**. Below "neo on this panel" are
three provider sections. Slot 1 is tried first; the others take over when it fails. Fill in
slot 1:

1. **Enabled**: on.
2. **Label**: a name, for example the model's (letters, digits, spaces and `._()-`).
3. **API format**: see the table below.
4. **Endpoint URL**: the API base. The format's path is added when it is missing.
5. **API key**: the provider's key (8 to 512 printable characters, no quotes, `$`, `#` or
   backslashes).
6. **Model**: the model ID exactly as your provider lists it.
7. **Save**, then press **Test provider 1**. It reports the answer time, the model, and
   whether tool calling works. neo needs tool calling to act; a provider that drops tools
   still works, with the tools described in the prompt instead.

### API formats

| API format | Use it for | Endpoint example | Key sent as |
| --- | --- | --- | --- |
| OpenAI-compatible (chat completions) | OpenAI, Groq, OpenRouter and any other API that speaks `/chat/completions` | `https://api.openai.com/v1`, `https://api.groq.com/openai/v1`, `https://openrouter.ai/api/v1` | `Authorization: Bearer <key>` |
| Anthropic Messages | Anthropic's API (Claude models) | `https://api.anthropic.com/v1` | `x-api-key: <key>`, with `anthropic-version: 2023-06-01` |
| Google AI Studio (Gemini API) | Gemini and Gemma models on Google AI Studio | `https://generativelanguage.googleapis.com/v1beta` | `x-goog-api-key: <key>` |

- OpenAI-compatible endpoints get `/chat/completions` appended, Anthropic endpoints `/messages`.
- For Google AI Studio, the panel builds `…/v1beta/models/<model>:generateContent` from the
  endpoint and the **Model** field (`/v1beta` is used when you give only the host). Never put
  the model or `?key=` in the URL: the key always goes in the header.
- Endpoints must be public `https` URLs. Localhost, private, link-local and CGNAT addresses are
  refused when you save or test, so a model server on the panel box or your LAN cannot be used
  directly.

### The other fields

| Field | Default | Use |
| --- | --- | --- |
| Max output tokens | 4096 | Longest answer (256 to 128,000). |
| Timeout (seconds) | 30 | Per call (5 to 90). |
| Daily token cap | 0 | Tokens per day (UTC) before the slot is skipped until tomorrow; `0` = no cap. |
| Sees images | by format | Screenshots go to slots that see images first; the others get a note instead. Starts on for Anthropic and Google AI Studio and off for OpenAI-compatible; switch it on for an OpenAI-compatible vision model. |
| Premium model (PlusPlus) | off | See [The premium model](#3-the-premium-model-optional). |
| Extra headers | `{}` | A JSON object of extra headers, for example `{"User-Agent": "…"}`. Authorization, API-key, host and content headers cannot be set. For Anthropic, `{"anthropic-version": "…"}` replaces the default version. |
| Extra request fields | `{}` | A JSON object merged into each request, for example `{"reasoning_format": "hidden"}` (at most 2 KB, 3 levels). Core fields (model, messages, tools, max tokens …) cannot be overridden. Google AI Studio only takes `generationConfig`, `safetySettings` and `cachedContent`, for example `{"generationConfig": {"temperature": 0.7}}`. |

Each slot's section shows its tokens used today and, after an error, until when it is skipped.
The settings land in the `.env` as `NEO_P1_*`, `NEO_P2_*` and `NEO_P3_*`; the full list is on
the [plugin page](/plugins/ai/#tab-neo-provider-1-2-and-3).

### How failover works

Slots are tried in order. A slot that fails is skipped for a while:

- 10 minutes after an authentication error (HTTP 401, 403, 404);
- after a rate limit or outage (429, 5xx), for as long as the provider asks (`Retry-After`),
  otherwise for **Cooldown after a failure** (60 seconds);
- not at all after "request too large" (400, 413, 422): the next slot tries it;
- never longer than 15 minutes.

A slot that reached its daily cap is skipped until midnight UTC. One turn may spend at most the
**Time budget per turn** across all slots. When every slot is cooling down for longer than
`NEO_MAX_BUSY_WAIT` (60 seconds), neo says it is unavailable instead of busy.

Before giving a slot tools, neo asks it once with a tiny call whether a tool gets through, and
keeps the answer for 6 hours (`NEO_TOOLS_PROBE=false` skips the check). Some gateways replace the
tools of a request with their own; for those, neo writes its tools into the prompt.

## 2. Set the usage limits

The **Usage limits** section on the same tab caps how much each account may use. Usage is
plain tokens (input and output, every model the same) per account, in two windows. A window
opens with the account's first call when none is running and resets once its length has passed.
The limit is checked before a call and charged after it, so one call may go slightly over.

| Setting | Default | What it does |
| --- | --- | --- |
| Short window, tokens per short window | 5 hours, 3,000,000 | The tight limit that stops bursts. |
| Long window, tokens per long window | 7 days, 15,000,000 | The weekly ceiling. |
| neo on Discord without a linked account | 50 % | Unlinked Discord accounts get windows of their own at this share. |
| Premium model usage | 2 | A premium-slot turn counts this many times its tokens. |
| Cooldown after a failure | 60 s | See failover above. |
| Time budget per turn | 80 s | At most 95. |
| Concurrent model calls | 4 | Panel-wide. Each call holds a PHP worker while it waits. |
| Gateway enabled | on | Off refuses every neo turn. rux keeps its AI. |

With [plugged-host-economy](/plugins/economy/), Plus and PlusPlus raise an
account's limits by the percentages set there (125 % and about 156 % by default). Users see
their windows as two bars in the chat and get told when a window resets.

On top of the windows, each user may send `NEO_MESSAGES_PER_MINUTE` (10) messages and run
`NEO_TOOLS_PER_MINUTE` (60) tools per minute (`.env` only).

## 3. The premium model (optional)

Mark one or more slots **Premium model (PlusPlus)** to offer a better, more expensive model:

- The chat then shows a model picker: "Other models" or the premium model, named after the
  slot's label. Only accounts with PlusPlus (plugged-host-economy) can pick it; without
  economy, nobody can.
- Turns that asked for it try the premium slots first and fall back to the others. They count
  at the **Premium model usage** multiplier.
- Everything else (other chats, neo on Discord, rux's message checks) never reaches a premium
  slot. rux's orders do try it first.

## 4. Turn on the chat

In the **neo on this panel** section of the same tab:

1. Switch on **Enable neo**.
2. Tell neo where people get help:
   - **Human support link**: used when the Discord plugin has no invite URL. While
     `DISCORD_INVITE_URL` is set, neo sends people to your Discord server with that invite
     instead.
   - **Legal contact email** and **Privacy contact email**: the addresses neo gives for legal
     complaints and for privacy requests.

   Any of them left empty is left out of what neo says.
3. **AI providers named to users**: your providers as free text, for example `OpenAI and
   Anthropic`. They appear in the notice users accept on first use and under the chat's
   settings. Empty: a general sentence about the providers this panel uses (with
   plugged-host-noprofit, the providers noprofit.space uses).
4. Leave **Mask secrets before sending**, **Always ask before deleting or killing** and
   **Automatic log check** on. The log check uploads Minecraft server logs to mclo.gs and shows
   what it finds above the console.
5. Save.

The "Ask neo" launcher now appears on the dashboard and on every server page for its owner.
Owners decide which subusers may use neo on their server: the subuser editor has a **neo** group
with an **access** permission. neo only ever does what the user's other permissions allow.

The other values in this section:

- **Steps per message** (25): model calls neo may make for one message before it must answer.
- **Context budget** (24,000 tokens): how much conversation is re-sent with every call. Both
  decide what one question costs against the user's limits.
- **Keep conversations** (30 days): older chats and their images are deleted daily.

neo's prompts name your panel (`APP_NAME`) and only describe the plugins that are enabled. The
status page they name is core's `STATUS_PAGE_URL` and the backups site storage's
`BACKUPS_PORTAL_URL`; both are left out while unset.

Each neo step runs inside a web request and can take up to the turn's time budget, so keep the
web server's FastCGI read timeout above it. Pelican's nginx configuration uses 300 seconds.

To try neo from the terminal as a user (`--server` takes a server's short UUID, `--approve`
approves every action):

```bash
sudo -u www-data php artisan plugged-host-ai:neo-chat <username> "What is using the most disk?" --server=<uuid_short>
```

## neo on Discord

neo can also answer on your Discord server, as its own bot. There it is account support for
anyone, linked or not: DMs, @mentions, replies to neo, and messages starting with "hey neo". In
a DM with someone whose Discord is linked to a panel account, it can look up that account
(read-only). For a problem with a server, it sends people to neo in the panel.

### Create the application

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create a
   **New Application**, for example "neo".
2. Open **Bot** and click **Reset Token**. Copy the token.
3. Optionally switch on **Message Content Intent** under Privileged Gateway Intents. It is only
   needed for "hey neo" in channels; DMs, @mentions and replies work without it. Without it neo
   connects anyway and tries again with it every 6 hours.

### Fill in the settings

Open Admin › Plugins › plugged.host AI › Settings, tab **neo on Discord**:

1. Switch on **neo on Discord is on**.
2. Paste the **Bot token**.
3. Check **Discord server id**: it defaults to the membership bot's server (`DISCORD_GUILD_ID`).
4. Save.

The scheduler starts neo's daemon within a minute. It only runs when all of these hold; the tab's
status box and `--status` name whatever is missing:

- `APP_ENV=production` (there is no override for neo);
- the switch is on, and a token and a server ID are set;
- neo has a usable provider (step 1);
- the `neo_bot_messages` table exists.

### Invite it

Get the invite link from the status command (or the tab's status box once neo can run):

```bash
sudo -u www-data php artisan plugged-host:neo-bot-supervise --status
```

The link uses scope `bot` and permissions `274877991936`: View Channels, Send Messages, Send
Messages in Threads, Embed Links and Read Message History. neo moderates nothing, so it needs no
more.

### Test it

Ask neo as a Discord user without going through Discord. The answer is metered like a real
message; `--dm` answers as in a DM, where account lookups are offered. This works on any panel
with a provider set, production or not:

```bash
sudo -u www-data php artisan plugged-host:neo-bot-ask <discord user id> "how do I get more memory?" --dm
```

### How it behaves

- Six messages per person per minute reach neo (`NEO_BOT_MESSAGES_PER_MINUTE`); bots are
  ignored. Several messages in a row are answered together.
- A Discord account linked to a panel account uses that account's limits, shared with the chat.
  An unlinked one gets windows of its own at the unlinked share. When a window is used up, neo
  says when it resets.
- One conversation per person per channel or DM; the last hour is replayed
  (`NEO_BOT_HISTORY_MINUTES`). Messages are deleted with the chats after the retention period.
- neo on Discord never uses the premium model.
- For human help it points to the staff in your Discord server's public channels, with the
  invite (`DISCORD_INVITE_URL`, else `NEO_SUPPORT_URL`), and gives the legal and privacy emails
  when they are set.
- People link Discord through the panel's Discord sign-in ([Membership bot](/discord/membership-bot/#2-use-it-as-the-panels-discord-sign-in));
  neo points unlinked users there.

### Day to day

```bash
sudo -u www-data php artisan plugged-host:neo-bot-supervise --status
sudo -u www-data php artisan plugged-host:neo-bot-supervise --stop      # stays down until --start
sudo -u www-data php artisan plugged-host:neo-bot-supervise --start
sudo -u www-data php artisan plugged-host:neo-bot-supervise --restart
```

The log is `storage/logs/neo-bot.log`. The daemon is replaced by itself when the token or server
ID changes. Its restart timings are plugged-host-discord's
[supervisor settings](/plugins/discord/#gateway-daemon--supervision).

:::danger
Never put production's `NEO_BOT_TOKEN` in a dev panel's `.env`. Give a dev panel its own Discord
application if it needs one.
:::
