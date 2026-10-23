---
title: AI
description: neo, the AI assistant in the panel and on Discord, and rux, the Discord moderation and giveaway bot, on AI providers you configure on the panel.
sidebar:
  order: 14
---

plugged-host-ai holds the panel's AI. **neo** (always lowercase) is an agentic assistant: in the
panel it carries out tasks on a user's servers and account with that user's own permissions, and
on Discord it answers account questions as its own bot. **rux** is a second Discord bot for
moderation and credit giveaways, which admins command in plain language. Both run on up to three
AI provider slots you set on the panel, with failover between them.

## What it does

### neo in the panel

- **A chat on the app and server panels.** An "Ask neo" launcher opens a chat sheet (full screen
  on phones). On first use it shows a notice about what is sent to AI providers, and to which.
  Users can attach up to four images (PNG, JPEG, WebP or GIF, 10 MB each), see their 5-hour and
  weekly usage, reopen or delete earlier chats, minimize the chat while neo keeps working, and
  resize it.
- **Tools on a server:** server status, read the console, send a command, power actions (through
  the same start queue, waiting room and hibernation chain as the Start button), list, read,
  search, write and edit files, create folders, rename or move, compress, extract and delete,
  read and set startup variables, change the Docker image, reinstall, and list, create, restore
  and delete backups.
- **Tools elsewhere:** list servers on the dashboard and read logs shared on mclo.gs. With
  [plugged-host-servers](/plugins/servers/): account overview, create options, and create, resize,
  rename and delete servers. With [plugged-host-minecraft](/plugins/minecraft/): plugins, mods
  and modpacks from Modrinth and CurseForge, Geyser, and switching server software. Other plugins
  can register more tools.
- **Who can use it.** Any signed-in user on the dashboard. On a server: its owner, or a subuser
  the owner gave the **neo › access** permission. Admin rights do not open neo on other people's
  servers. A tool is only offered when the user holds the permission it needs, and permissions
  are checked again right before each action. A suspended, installing or transferring server is
  left alone.
- **Approvals.** Reading never asks. Changes (writes, deletes, console commands, power) wait for
  **Approve** / **Decline** in the chat unless the user turned on "Let neo make changes without
  asking". Deleting and killing always ask while the admin setting "Always ask before deleting or
  killing" is on. Deleting a server or spending tokens always asks.
- **Per-user switches** behind the gear icon in the chat: **Enable neo** (off shrinks the
  launcher to a small button that turns it back on), **Let neo make changes without asking**,
  usage with reset times, and delete history.
- **Model picker**, only while a provider slot is marked premium: "Other models" (counted 1x) or
  the premium slot, named after its label and counted at the premium multiplier. Only accounts
  with PlusPlus ([plugged-host-economy](/plugins/economy/)) can pick it.
- **Safety.** Passwords, tokens and keys in console output and files are masked before they reach
  a provider. Tool output is treated as untrusted. Every change is written to the server's
  activity log as `server:neo.*`.
- **Automatic log check** on the console of Minecraft servers (eggs tagged `minecraft`): the
  server's `logs/latest.log` (or the console's last lines) is uploaded to mclo.gs with secrets
  masked, and the problems mclo.gs recognises are shown above the console with **Ask neo to fix
  it**. A running server's log is uploaded at most every two minutes, and only when it changed.
  It needs console and file-content access on the server, has its own switch
  (`NEO_LOG_CHECK_ENABLED`) and never runs while neo is off.
- **It speaks for your panel.** neo's prompts name the panel (`APP_NAME`) and only describe what
  is enabled: Plus, PlusPlus, credits and tokens with plugged-host-economy, noprofit.space's
  terms with plugged-host-noprofit, the off-site mirror and node failover with
  plugged-host-storage, subdomains with the subdomains plugin. For human help neo names your
  Discord invite (`DISCORD_INVITE_URL`) or else `NEO_SUPPORT_URL`; it names the status page
  from [core](/plugins/core/)'s `STATUS_PAGE_URL`, the backups site from
  [storage](/plugins/storage/)'s `BACKUPS_PORTAL_URL`, and the legal and privacy contacts from
  `NEO_LEGAL_EMAIL` and `NEO_PRIVACY_EMAIL`. Whatever is left empty is left out.

### neo on Discord

- **Account support, as its own bot.** Anyone may ask, linked or not, about their account and how
  your service works. For a problem with a server it sends people to neo in the panel.
- **When it answers:** DMs, @mentions, replies to neo, and messages that start with "hey neo" or
  "neo" (this needs the Message Content intent). Bots are ignored; six messages per minute per
  person reach it. Several messages in a row are answered together.
- **What it sees.** In a DM with someone whose Discord is linked to a panel account it can look
  that account up with read-only tools: account overview, list servers and create options. In
  public channels it has no tools. It changes nothing.
- **Limits.** Every answer counts against neo's usage limits: a linked Discord account uses its
  panel account's windows (shared with neo in the panel), an unlinked one gets windows of its own
  at a share of the limits (50 % by default).
- **Memory.** One conversation per person per channel or DM; the last hour is replayed.

### rux

- **Plain-language orders** from admins by DM, @mention or "hey rux": "make a giveaway that ends
  on the 4th at 5pm for 500 credits, don't let the last 2 winners join", "if anyone asks for new
  locations, warn them", "give @Helpers mod permissions".
- **Giveaways** posted with an **Enter** button, drawn at the end time among entrants who are
  still linked and still in the server, and paid in credits through plugged-host-discord.
  Edit, end early, cancel, reroll, list, and keep out the winners of the last N giveaways.
- **Moderation:** look up a member, warn, time out (up to 28 days), kick, ban, unban, set
  nicknames, read, delete and purge messages, lock channels and set slowmode, clear warnings, the
  case log, the ban list, role permissions, manage roles, send messages and DMs, edit and pin
  messages, and a server overview. Every action is a case, posted to the mod log channel when one
  is set, and the member gets a DM with the reason.
- **Warning steps:** by default the 3rd and 4th warning also time the member out for 24 hours,
  the 5th and every later one bans them for 24 hours; rux lifts the ban itself.
- **Standing rules** ("if anyone asks for X, warn them"): rux turns the order into keywords, the
  daemon matches every member message against them, and the AI confirms a hit before rux acts.
- **Watched channels** (`chat` and `bot-commands` to begin with): every member message is checked
  in batches against the rules and against basic guidelines (scams, slurs, harassment, sexual
  content, advertising).
- **Spam guard without AI**, in every channel rux can read: floods, repeated messages, mass
  mentions and emoji walls are deleted and the author is warned.
- **Credits for one person** (`give_credits`), only on the order of the Discord accounts you list
  as main admins.
- **Moderators:** members of a role an admin made a rux moderator role may order moderation only,
  never against staff, admins, other moderators or themselves.
- **Your own sites.** Every message check knows your sites, which are never a scam or an advert:
  the panel's and the status page's host names, the Discord invite, noprofit.space with
  plugged-host-noprofit, and the domains you list in "Our own sites" (`RUX_TRUSTED_DOMAINS`).
  rux's prompts name the panel (`APP_NAME`) and the account portal.
- **One bot for the server.** With a token for rux, [plugged-host-discord](/plugins/discord/)
  uses rux's bot too, so rux is also the [membership bot](/discord/membership-bot/#use-rux-as-the-membership-bot)
  (invites, boosts, the 2-boost role, its slash commands).

### Shared

- **One provider chain** for neo and rux: up to three slots tried in order, with cooldowns after
  failures, per-slot daily token caps, image-capable slots tried first for screenshots, and a
  check whether a provider passes tools through (if not, the tools are written into the prompt).
- **Both bots run as gateway daemons** started and watched by the scheduler, with the same
  supervisor as the [membership bot](/plugins/discord/#gateway-daemon) (file lock, heartbeat,
  backoff, sticky stop, bounded log). Slow work (an answer, an order, a rule check) runs in a
  separate worker process so the daemon keeps its connection alive. On Discord both show as
  watching the panel's name (`APP_NAME`).

## Requirements

- `plugged_host.requires`: plugged-host-core, plugged-host-discord.
- `plugged_host.optional`:
  - plugged-host-economy: Plus and PlusPlus raise neo's limits, PlusPlus unlocks the premium
    model, and rux's giveaways and credit gifts are paid in its credits.
  - plugged-host-servers: neo's account and server-management tools.
  - plugged-host-ads: neo is hidden on the start waiting room.
- An API key for at least one AI provider with a public `https` endpoint: any OpenAI-compatible
  API, Anthropic's Messages API, or Google AI Studio's Gemini API.
- For the bots: one Discord application each for neo and rux, a panel with
  `APP_ENV=production`, and the PHP CLI requirements of the
  [membership bot](/discord/membership-bot/#before-you-start).

## Setup

1. Run `sudo -u www-data php artisan migrate` so the `neo_*` and `rux_*` tables exist.
2. Set up a provider and switch neo on: [neo](/discord/neo/).
3. Optionally put neo on Discord ([neo](/discord/neo/#neo-on-discord)) and set up
   [rux](/discord/rux/).

## Settings

Admin › Plugins › plugged.host AI › Settings has three tabs. Everything is stored in the panel's
`.env`. Secrets (API keys, bot tokens) are never shown again: leave the field empty to keep the
stored value. neo on Discord and rux pick up changes within a minute.

### Tab "neo": neo on this panel

| Setting | Default | What it does |
| --- | --- | --- |
| Enable neo `NEO_ENABLED` | `false` | Master switch. While off, the chat is hidden and every request is refused. |
| Steps per message `NEO_MAX_STEPS` | `25` | Model calls neo may make for one user message before it must answer (1 to 30). |
| Context budget (tokens) `NEO_CONTEXT_TOKENS` | `24000` | How much conversation is re-sent with every call (4,000 to 200,000). Every call counts against the user's limits. |
| Keep conversations (days) `NEO_RETENTION_DAYS` | `30` | Panel chats, their images and neo's Discord messages older than this are deleted daily (1 to 365). |
| Human support link `NEO_SUPPORT_URL` | empty | Where neo sends people for human help when the Discord plugin has no invite URL. While `DISCORD_INVITE_URL` is set, neo sends them to your Discord server with that invite instead. With neither, neo names no link. |
| Legal contact email `NEO_LEGAL_EMAIL` | empty | The address neo gives for legal complaints (abuse, copyright, illegal content). Empty: neo names none. |
| Privacy contact email `NEO_PRIVACY_EMAIL` | empty | The address neo gives for privacy complaints and data requests. Empty: neo names none. |
| AI providers named to users `NEO_PROVIDER_DISCLOSURE` | empty | Free text naming your providers in neo's first-use notice and the note under its chat settings, for example `OpenAI and Anthropic` (at most 255 characters). Empty: a general sentence about the providers this panel uses; with plugged-host-noprofit, the providers noprofit.space uses (Groq, and Anthropic through a proxy). |
| Mask secrets before sending `NEO_REDACT_SECRETS` | `true` | Passwords, tokens and keys in console output and files become `••••` before they reach a provider. |
| Always ask before deleting or killing `NEO_ALWAYS_CONFIRM_DESTRUCTIVE` | `true` | Overrides a user's "without asking" choice for deletes and kill. |
| Automatic log check `NEO_LOG_CHECK_ENABLED` | `true` | Uploads Minecraft server logs to mclo.gs and shows what it finds above the console. Never runs while neo is off. |

### Tab "neo": Provider 1, 2 and 3

One section per slot (`{n}` is 1, 2 or 3). Slot 1 is tried first. **Test provider {n}** sends a
one-shot call and reports the time, the model and whether tool calling works.

| Setting | Default | What it does |
| --- | --- | --- |
| Enabled `NEO_P{n}_ENABLED` | `false` | Use this slot. A slot is only used with an endpoint, a key and a model. |
| Label `NEO_P{n}_LABEL` | empty | Its name in the settings and logs, and the premium model's name in the chat. |
| API format `NEO_P{n}_DRIVER` | `openai` (slots 1, 2), `anthropic` (slot 3) | `openai` (OpenAI-compatible chat completions), `anthropic` (Anthropic Messages) or `gemini` (Google AI Studio). |
| Endpoint URL `NEO_P{n}_ENDPOINT` | empty | The API base or full URL; the format's path is added when missing. Must be a public `https` URL. |
| API key `NEO_P{n}_API_KEY` | empty | The provider's key. "Remove the stored key" clears it. |
| Model `NEO_P{n}_MODEL` | empty | The model ID as the provider names it. |
| Max output tokens `NEO_P{n}_MAX_TOKENS` | `4096` | Most tokens one answer may have (256 to 128,000). |
| Timeout (seconds) `NEO_P{n}_TIMEOUT` | `30` | How long one call may take (5 to 90). |
| Daily token cap `NEO_P{n}_DAILY_TOKEN_CAP` | `0` | Tokens this slot may use per day (UTC); then it is skipped until tomorrow. `0` = no cap. |
| Sees images `NEO_P{n}_VISION` | unset | Screenshots go to these slots first; the others get a note instead. Unset: on for `gemini` and `anthropic`, off for `openai`. |
| Premium model (PlusPlus) `NEO_P{n}_PREMIUM` | `false` | Answers only chats where a PlusPlus user picked the premium model, and rux's orders first. Everything else skips it. |
| Extra headers `NEO_P{n}_EXTRA_HEADERS_B64` | `{}` | A JSON object of extra request headers, stored base64-encoded. Auth headers are set for you and cannot be overridden. |
| Extra request fields `NEO_P{n}_EXTRA_BODY_B64` | `{}` | A JSON object merged into each request (at most 2 KB, 3 levels), stored base64-encoded. Core fields (model, messages, tools …) cannot be overridden. |

### Tab "neo": Usage limits

| Setting | Default | What it does |
| --- | --- | --- |
| Gateway enabled `NEO_GATEWAY_ENABLED` | `true` | Off refuses every neo turn (rux keeps its AI). |
| Short window (hours) `NEO_SHORT_WINDOW_HOURS` | `5` | Length of the short window (1 to 168). |
| Tokens per short window `NEO_SHORT_TOKENS` | `3000000` | Tokens (input + output) one account may use per short window. |
| Long window (days) `NEO_LONG_WINDOW_DAYS` | `7` | Length of the long window (1 to 31). |
| Tokens per long window `NEO_LONG_TOKENS` | `15000000` | Tokens one account may use per long window. |
| neo on Discord without a linked account `NEO_DISCORD_UNLINKED_PERCENT` | `50` | Unlinked Discord accounts get windows of their own at this share of the limits. |
| Premium model usage `NEO_PREMIUM_MULTIPLIER` | `2` | A turn a premium slot answered counts this many times its tokens (1 to 10). |
| Cooldown after a failure `NEO_DEFAULT_COOLDOWN` | `60` | Seconds a failing slot is skipped when the provider gives no retry time (1 to 3600). |
| Time budget per turn `NEO_CHAIN_DEADLINE` | `80` | Seconds one turn may spend across all slots (10 to 95). |
| Concurrent model calls `NEO_MAX_CONCURRENT` | `4` | neo model calls in flight at once, panel-wide (1 to 50). Each one holds a PHP worker. |

### Tab "neo on Discord"

| Setting | Default | What it does |
| --- | --- | --- |
| neo on Discord is on `NEO_BOT_ENABLED` | `false` | Master switch for the bot. |
| Bot token `NEO_BOT_TOKEN` | empty | The token of neo's own Discord application. |
| Discord server id `NEO_BOT_GUILD_ID` | `DISCORD_GUILD_ID` | The server neo answers on. |

### Tab "rux"

| Setting | Default | What it does |
| --- | --- | --- |
| rux is on `RUX_ENABLED` | `false` | Master switch for the bot. |
| Bot token `RUX_BOT_TOKEN` | empty | The token of rux's own Discord application. plugged-host-discord uses it too, instead of `DISCORD_BOT_TOKEN`. |
| Discord server id `RUX_GUILD_ID` | `DISCORD_GUILD_ID` | The server rux moderates. |
| Time zone `RUX_TIMEZONE` | `Europe/Paris` | rux reads and writes every time in this zone. Members see Discord timestamps in their own zone. |
| Default giveaway channel id `RUX_GIVEAWAY_CHANNEL_ID` | empty | Used when an order names no channel. |
| Mod log channel id `RUX_MOD_LOG_CHANNEL_ID` | empty | Every moderation action is posted here. |
| Most credits per winner `RUX_GIVEAWAY_MAX_CREDITS` | `10000` | Upper limit per winner for one giveaway. |
| Most winners per giveaway `RUX_GIVEAWAY_MAX_WINNERS` | `25` | Upper limit of winners. |
| Main admin (gives credits) `RUX_CREDIT_GRANTERS` | empty | Discord user IDs, comma separated, who may have rux give someone credits. Empty turns `give_credits` off. |
| Most credits per gift `RUX_CREDIT_MAX` | `10000` | Upper limit for one `give_credits`. |
| Timeout from warning `RUX_WARN_TIMEOUT_AT` | `3` | From this warning on, each new warning also times the member out. `0` = off. |
| Timeout length `RUX_WARN_TIMEOUT` | `24h` | Like `24h` or `2d12h`; at most 28 days. |
| Ban from warning `RUX_WARN_BAN_AT` | `5` | From this warning on, each new warning bans the member for a while. `0` = off. |
| Ban length `RUX_WARN_BAN` | `24h` | How long; rux lifts the ban afterwards. |
| Watched channels also enforce the basic guidelines `RUX_WATCH_GUIDELINES` | `true` | Scams, slurs, harassment, sexual content and advertising in watched channels: deleted and warned. |
| Catch spam automatically `RUX_SPAM` | `true` | The spam guard, in every channel rux can read. |
| Our own sites `RUX_TRUSTED_DOMAINS` | empty | Domains, comma separated (for example `example.com`), that the message checks treat as yours, never a scam or an advert. Each includes its subdomains. The panel's and the status page's host names, the Discord invite and, with plugged-host-noprofit, noprofit.space always count. |

### Only in `.env`

| Setting | Default | What it does |
| --- | --- | --- |
| `NEO_MESSAGES_PER_MINUTE` | `10` | Chat messages per user per minute. |
| `NEO_TOOLS_PER_MINUTE` | `60` | Tool calls per user per minute. |
| `NEO_TOOL_OUTPUT_CHARS` | `12000` | Characters of one tool result the model sees. |
| `NEO_MAX_READ_BYTES` | `1048576` | Largest file neo reads. |
| `NEO_MAX_WRITE_BYTES` | `262144` | Largest file neo writes. |
| `NEO_CONSOLE_LINES` | `80` | Console lines read by default. |
| `NEO_TOOLS_PROBE` | `true` | Ask each slot once (the answer is kept 6 hours) whether tools reach the model. Off: always send tools. |
| `NEO_MAX_BUSY_WAIT` | `60` | When every slot is cooling down for longer than this (seconds), neo reports an outage instead of "busy". |
| `NEO_BOT_MAX_STEPS` | `6` | Model calls per answer on Discord. |
| `NEO_BOT_HISTORY_MINUTES` | `60` | How far back neo on Discord remembers a conversation. |
| `NEO_BOT_MESSAGES_PER_MINUTE` | `6` | Messages per Discord user per minute that reach neo. |
| `NEO_BOT_GATEWAY_INTENTS` | `37377` | Guilds, guild messages, direct messages and message content. |
| `RUX_LOCALE` | `en` | Language of what rux posts (`en` or `de`). |
| `RUX_GIVEAWAY_MAX_DAYS` | `60` | Longest a giveaway may run. |
| `RUX_MAX_STEPS` | `8` | Model calls per order. |
| `RUX_HISTORY_MINUTES` | `30` | How far back rux remembers a conversation with an admin. |
| `RUX_RULE_COOLDOWN` | `300` | Seconds before one rule acts on the same member again; also how often the spam guard warns one member. |
| `RUX_MESSAGES_PER_MINUTE` | `6` | Orders per Discord user per minute that reach rux. |
| `RUX_SPAM_FLOOD_MESSAGES`, `RUX_SPAM_FLOOD_SECONDS` | `7`, `10` | The 7th message within 10 seconds is spam. |
| `RUX_SPAM_DUPLICATES`, `RUX_SPAM_DUPLICATE_SECONDS` | `3`, `120` | The 3rd copy of the same text within 120 seconds is spam. |
| `RUX_SPAM_MENTIONS` | `6` | A message pinging this many people and roles is spam. |
| `RUX_SPAM_EMOJI` | `25` | A message with this many emoji is spam. |
| `RUX_GATEWAY_INTENTS` | `37377` | Guilds, guild messages, direct messages and message content. |
| `RUX_GATEWAY_IDLE_TIMEOUT` | `90` | Seconds of silence from Discord after which rux's daemon reconnects. |

The daemons' restart timings, log size, run-as user and PHP binary are plugged-host-discord's
[supervisor settings](/plugins/discord/#gateway-daemon--supervision), and its "Automatic
restarts" switch stops the supervision of all three daemons.

## Commands

Run as `sudo -u www-data php artisan …` in `/var/www/pelican`.

| Command | What it does |
| --- | --- |
| `plugged-host-ai:neo-chat {user} {message} [--server=] [--approve] [--new]` | Ask neo as a panel user (ID or username) and print the transcript. `--server` takes a server's short UUID, `--approve` approves every action, `--new` starts a fresh conversation. |
| `plugged-host-ai:neo-prune` | Delete neo conversations (panel and Discord) older than the retention period. |
| `plugged-host:neo-bot-supervise [--status] [--start] [--stop] [--restart] [--force]` | Keep neo's Discord daemon running. `--status` shows whether it can run (and what blocks it), whether it runs, the invite link and the log. `--stop` keeps it down until `--start`. |
| `plugged-host:neo-bot-ask {discord_id} {message} [--dm] [--name=] [--new]` | Ask neo on Discord as a Discord user, from the terminal. Metered like a real message. `--dm` answers as in a DM, where account lookups are offered. Works on any panel with a provider set. |
| `plugged-host:neo-bot-gateway` | neo's gateway daemon (started by the supervisor). |
| `plugged-host:neo-bot-handle {message}` | Answers one stored Discord message (started by the daemon). |
| `plugged-host:rux-supervise [--status] [--start] [--stop] [--restart] [--force]` | The same for rux. |
| `plugged-host:rux-ai` | Show the provider chain rux uses for orders and for message checks. |
| `plugged-host:rux-tick` | Draw due giveaways, retry payouts, refresh entry counts, lift bans that ran out, restart stalled orders and the watched-channel check. |
| `plugged-host:rux-gateway` | rux's gateway daemon (started by the supervisor). |
| `plugged-host:rux-handle {message}` | Carries out one order (started by the daemon). |
| `plugged-host:rux-watch` | Checks the queued messages from watched channels (started by the daemon or the tick). |
| `plugged-host:rux-rule-check {hit}` | Checks one keyword hit against the standing rules (started by the daemon). |
| `plugged-host:rux-spam {caught}` | Deletes caught spam and warns its author (started by the daemon). |

On the scheduler (times in the panel's time zone):

| Task | When |
| --- | --- |
| `plugged-host:neo-bot-supervise` | every minute |
| `plugged-host:rux-supervise` | every minute |
| `plugged-host:rux-tick` | every minute |
| `plugged-host-ai:neo-prune` | daily at 03:40 |
| rux's conversation memory older than 30 days is deleted | daily at 04:17 |

## Doctor checks

The plugin registers no checks of its own. `plugged-host:doctor` lists it, and core's "Plugin
requirements" check fails while plugged-host-discord is off. Check the bots with
`plugged-host:neo-bot-supervise --status` and `plugged-host:rux-supervise --status`; the
"Runnable" line names everything still missing. With plugged-host-noprofit enabled, that
plugin's doctor check covers neo's gateway secret.

## Notes

- **What the prompts assume.** neo's prompts describe your host as a free game and app server
  host with no uptime guarantee, and rux's as a free game server host. With plugged-host-economy,
  neo also says that buyers of an old one-time location unlock got Plus and that old priority
  passes were refunded. If that is not your host, edit the plugin's
  `resources/views/prompts/*.blade.php` (neo) and `src/Rux/Agent/RuxPrompt.php`,
  `src/Rux/Rules/RuleService.php` and `src/Rux/Watch/WatchService.php` (rux).
- **Endpoints must be public.** The settings form and the provider test refuse localhost,
  private, link-local and CGNAT addresses, so a model server on the panel box or your LAN cannot
  be used directly.
- **Long calls.** A neo step runs inside a web request and can take up to the turn's time budget
  (95 seconds at most). Keep the web server's FastCGI read timeout above that.
- **The bots only run on the production panel.** neo on Discord and rux refuse to start unless
  `APP_ENV=production`; there is no override. Give a dev panel its own Discord applications and
  never production's tokens.
- **No limits on rux.** rux's AI use counts against the providers' keys directly, never against
  anyone's neo limits. Provider rate limits are shared with neo when both use the same keys.
- **Back up the `rux_*` tables.** Moderator roles, standing rules, watched channels, cases and
  giveaways are set from Discord and live only there.
- With plugged-host-noprofit enabled, neo's providers, limits and metering, rux's admins and its
  payouts come from noprofit.space instead, and this tab edits them there.
