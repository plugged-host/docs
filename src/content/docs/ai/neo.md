---
title: neo
description: Set up neo, the panel's AI assistant that reads a server's console and files and acts on them with the user's own permissions, with its model slots, providers, limits and approvals.
---

neo is the assistant in the panel's chat. It reads a server's console and files, finds out what is
wrong and fixes it, using the user's own permissions and asking before it changes anything unless
the user lets it go ahead. On the account it answers account questions, creates and resizes
servers and explains the panel. Users open it from the **Ask neo** button in the corner of the
dashboard; admins give it AI models and limits in Admin › Settings › AI › neo. The same models also
run [neo on Discord](/ai/neo-discord/) and [rux](/discord/rux/).

## What it does

### Who can use it

- The chat appears once neo is switched on and has at least one usable model (or noprofit.space
  runs it). Otherwise the button is hidden.
- On the account's pages, the chat is the account's. On a server's pages it is that server's chat,
  for the server's owner and for subusers with the `neo.access` permission. An admin who is neither
  does not get neo on someone else's server. There is no chat in the admin area, on the sign-in
  pages or for a suspended account.
- Each user has their own switches in the chat's settings (the gear): **Enable neo** (on by
  default), **Let neo make changes without asking** (off by default) and their model.
- The first time, the chat shows a notice ("Before you start") saying what is sent to which AI
  providers. The user has to accept it before chatting.

### Conversations

- Each place (the account, or one server) has one open chat per user. **New chat** moves it to
  **Earlier chats**, which lists the 50 latest chats of that place.
- A user can delete one chat, or all of their chats at once. Chats nobody wrote in for **Keep
  Conversations (Days)** are deleted every night.
- Messages take up to 4 images (PNG, JPEG, WebP or GIF up to 20 MB), shrunk to 1568 px. Only models
  that see images get them; the others get a note in their place.
- A turn keeps running while the chat is minimized or the user moves between pages. The button then
  says Working…, Needs you or Done.
- The Minecraft log check's **Ask neo** button opens the server's chat and has neo read the log
  first ([Minecraft](/games/minecraft/)).

### What neo can do

neo works through tools. Each tool needs the same permission as the matching page, so neo can do
nothing the user could not do there. A server chat offers a tool only when the user holds its
permission (Minecraft tools only on Minecraft servers).

| Tool | Permission | Risk | What it does |
|---|---|---|---|
| `server_status` | None | Read | State, CPU, memory and disk against the limits, uptime, address, node, what blocks the server |
| `console_read` | `control.read-console` | Read | The console's last lines (up to 100) |
| `send_command` | `control.console` | Write | One console command on a running server, with the lines that followed |
| `power` | `control.start`, `control.stop`, `control.restart` | Write; kill is destructive | Start, stop, restart or kill. A start goes through the [start gates](/starts/start-gates/) |
| `list_files`, `search_files` | `files.read` | Read | List a folder; find files by name |
| `read_file` | `files.read-content` | Read | A text file, up to 400 lines per call |
| `edit_file` | `files.read-content`, `files.create` | Write | Replaces an exact piece of text in a file |
| `write_file` | `files.create` | Write | Creates or replaces a file (up to 256 KiB) |
| `create_directory` | `files.create` | Write | Creates a folder |
| `rename_file` | `files.update` | Write | Renames or moves a file or folder |
| `compress_files`, `decompress_file` | `files.archive` | Write | Packs files into a `.tar.gz`; extracts an archive |
| `delete_files` | `files.delete` | Destructive | Deletes up to 20 files or folders |
| `get_startup` | `startup.read` | Read | Startup command, image and variables (secret ones masked) |
| `set_startup_variable` | `startup.update` | Write | Sets one editable variable, checked like the startup page |
| `set_docker_image` | `startup.docker-image` | Write | Switches to one of the egg's images |
| `reinstall_server` | `settings.install` | Destructive | Runs the install script again, keeping the files |
| `list_backups` | `backups.read` | Read | The backups and the backup limit |
| `create_backup` | `backups.create` | Write | Starts a backup (locked only with `backups.update`) |
| `restore_backup` | `backups.read`, `backups.restore` | Critical | Restores a backup over the files |
| `delete_backup` | `backups.read`, `backups.delete` | Destructive | Deletes a backup that is not locked |
| `rename_server` | `settings.rename` | Write | Renames the server |
| `resize_server` | `settings.resize` | Write | Resizes within the allowance, or to a plan's size |
| `delete_server` | `settings.delete` | Critical | Deletes the server and its backups after the exact name is given |
| `minecraft_info` | `minecraft.content`, `settings.software` or `minecraft.bedrock` | Read | Software, version, content sources, modpacks, Geyser |
| `search_content`, `content_versions`, `list_installed_content` | `minecraft.content` | Read | Search Modrinth, CurseForge or SpigotMC; a project's builds; the installed jars |
| `install_content`, `toggle_content` | `minecraft.content` | Write | Installs a plugin or mod; disables or enables a jar |
| `remove_content` | `minecraft.content` | Destructive | Deletes up to 20 plugin or mod jars |
| `install_geyser` | `minecraft.bedrock` | Write | Installs or updates Geyser and Floodgate |
| `install_modpack` | `minecraft.content`, `settings.software` | Destructive | Installs a modpack on a stopped server |
| `switch_server_software` | `settings.software` | Destructive | Switches the Minecraft software or version and reinstalls |
| `list_servers` | None | Read | The user's servers (account chat only) |
| `account_overview` | None | Read | Balances, the allowance and what is used, memberships |
| `list_create_options` | Account `servers.deploy` | Read | Games, plans and locations for a new server |
| `create_server` | Account `servers.deploy` | Write; critical when it accepts a EULA | Creates a server like the [create page](/servers/create-server/) |
| `read_mclogs` | None | Read | A log on mclo.gs: its problems, suggested fixes and errors |

- Server tools (except `server_status`) refuse while the server is suspended, installing or its
  install failed, restoring a backup or its restore failed, moving, hibernating, or on a node in
  maintenance.
- Tool output has secrets masked and is cut at 12,000 characters. neo refuses to write the mask back
  into a file or variable.
- Every change is in the activity log as `server:neo.<event>` (or `user:neo.<event>` for account
  actions), such as `server:neo.file.edit` or `user:neo.server.create`.

### Approvals

Every tool call has a risk, a one-line summary and, for writes and console commands, a preview.

| Risk | Runs |
|---|---|
| Read | At once |
| Write | After the user approves, unless they let neo make changes without asking |
| Destructive | After the user approves; also with "without asking" while **Always Ask Before Deleting or Killing** is on |
| Critical | Always after the user approves |

The user approves one call, all waiting calls, or declines one (neo is told so). Stopping a turn
skips everything still waiting.

### Models and limits

- Each **model slot** is one model people can pick by its label in the chat (the picker shows with
  two models or more). A turn runs on the picked model only, with no failover to another. Turns
  nobody picked a model for go to the models open to everyone, in slot order, skipping one that
  failed.
- A slot can be open to everyone, to members of the first membership (and the second), or to the
  second membership only. Memberships are set up in Admin › Settings › Economy
  ([credits and tokens](/economy/credits-and-tokens/)).
- Usage is input plus output tokens per account, times the model's **Usage Multiplier**, counted in
  a short window and a long window. A window starts with the first message after the last one
  ended. The limit is checked before a turn and charged after it, so one turn may go over.
- Memberships raise the limits by their percentages. A slot's **Daily Token Cap** limits that model
  for the whole panel per UTC day.
- When a limit stops a turn, the chat says which one and when it resets, with **Try again**.

### What neo knows

neo's instructions are written from the panel's settings: the panel's name and address, the
allowance and plans, locations, credits, tokens and memberships, the start queue, idle servers,
backups and failover, subdomains, devboxes, Minecraft and FiveM, the Discord server, and the help
link and contacts set here. A feature that is off is never mentioned, and neo names no host,
service or link the settings do not give. It answers in the user's language.

## Requirements

- An API key for at least one AI provider with one of the supported API formats:

  | API Format | For | Endpoint URL example | The key is sent as |
  |---|---|---|---|
  | OpenAI-compatible (chat completions) | OpenAI, Groq, OpenRouter, most gateways | `https://api.openai.com/v1` | `Authorization: Bearer` |
  | Anthropic Messages | Claude models | `https://api.anthropic.com/v1` | `x-api-key`, with `anthropic-version: 2023-06-01` |
  | Google AI Studio (Gemini API) | Gemini and Gemma models | `https://generativelanguage.googleapis.com/v1beta` | `x-goog-api-key` |

- Endpoints must be public `https` addresses. `localhost`, `.localhost` and `.internal` names and
  internal addresses (`APP_BLOCKED_CIDRS`) are refused, so a model on your own network does not
  work.
- A model that supports tool calls works best. **Check Tool Support** describes the tools in the
  prompt for one that drops them.

## Setup

1. Create an API key at your AI provider.
2. Admin › Settings › AI › neo › AI Providers and Limits › **Add a Model**:
   - **Label** (the name in the picker) and **Description**;
   - **Who May Pick It**: Everyone for the first model;
   - **API Format**, **Model** (the model id your provider documents) and **Endpoint URL** (the API
     base from the table above; the format's path is added when missing; for Google AI Studio the
     model comes from the Model field, never the URL);
   - **API Key**: the key from step 1. It is stored encrypted and never shown again.
3. Save, then press **Test Provider 1**. It asks the model for "OK" and shows the time, the model and
   the tokens, or the error. It does not count against anyone's limits.
4. Under neo on This Panel, switch on **Enable neo**. Set **Human Support Link**, **Legal Contact
   Email**, **Privacy Contact Email** and **AI Providers Named to Users** (shown in the first-use
   notice, such as "OpenAI and Anthropic").
5. Under Usage Limits, set the short and long windows and their token limits. Save.
6. Open a server, press **Ask neo**, accept the notice and ask something.

Add more slots the same way. A slot shows under its title whether it is usable, its tokens today,
until when it is skipped after an error, and its last error of the past day.

## Settings

Admin › Settings › AI › neo.

### neo on This Panel

| Setting | Default | What it does |
|---|---|---|
| Enable neo | Off | Master switch. Off: neo is hidden and refuses every request |
| Steps per Message | 25 | Model calls for one message before neo must answer (1 to 100) |
| Context Budget (Tokens) | 24000 | How much conversation is sent with each call (4000 to 400000). Every call counts against the user's limits |
| Messages per Minute | 10 | Messages one user may send a minute (1 to 600) |
| Tool Runs per Minute | 60 | Tool calls neo may run for one user a minute (1 to 600) |
| Keep Conversations (Days) | 30 | Chats nobody wrote in for this long are deleted (1 to 3650) |
| Human Support Link | Empty | Where neo sends people for human help (`https://` or `http://`). Empty: no link |
| Legal Contact Email | Empty | Given for legal complaints. Empty: none |
| Privacy Contact Email | Empty | Given for privacy requests. Empty: none |
| AI Providers Named to Users | Empty | Named in the first-use notice. Empty: a general sentence |
| Always Ask Before Deleting or Killing | On | Overrides a user's "without asking" for destructive calls |

### AI Providers and Limits

Up to 6 model slots.

| Setting | Default | What it does |
|---|---|---|
| Enabled | On | Off: the slot is skipped |
| Label, Description | Empty | The model's name and one line under it in the picker |
| Who May Pick It | Everyone | Everyone, the first membership (and the second), or the second only |
| API Format | OpenAI-compatible | OpenAI-compatible, Anthropic Messages or Google AI Studio |
| Model | Empty | The model id the API knows |
| Endpoint URL | Empty | The API base or the full URL, public `https` only |
| API Key | Empty | Stored encrypted; leave empty to keep it, or **Remove the Stored Key** |
| Max Output Tokens | 4096 | 256 to 128000 |
| Timeout (Seconds) | 30 | How long one call may take (5 to 300) |
| Daily Token Cap | 0 | Tokens a day for this slot; once reached it is skipped until the next UTC day. 0: no cap |
| Sees Images | By API format | Google AI Studio and Anthropic yes, OpenAI-compatible no, unless set |
| Usage Multiplier | 1 | A turn on this model counts this many times its tokens (1 to 10) |
| Extra Headers (JSON Object) | Empty | Up to 16 headers, 2048 bytes in all; not the key, content type or host |
| Extra Request Fields (JSON Object) | Empty | Up to 4096 bytes, 4 levels; not the fields the panel sets |

- Header values whose name contains `key`, `token`, `auth`, `secret`, `cookie` or `session` show as
  `••••`. Leave `••••` to keep the stored value.
- An Anthropic slot's `anthropic-version` extra header replaces the default `2023-06-01`.
- Google AI Studio only takes `generationConfig`, `safetySettings` and `cachedContent` as extra
  request fields.

### Usage Limits

| Setting | Default | What it does |
|---|---|---|
| Gateway Enabled | On | Off: neo answers nothing while it runs on this panel's models |
| With (first membership) (%) | 125 | The first membership's limits, in % of the windows (100 to 1000) |
| With (second membership) (%) | 125 | What the second membership adds on top of the first (125 on 125 makes 156%) |
| neo on Discord Without a Linked Account (% of These Limits) | 50 | The share Discord accounts nobody linked get (0 to 100). 0: neo on Discord answers linked accounts only |
| Short Window (Hours) | 5 | 1 to 168 |
| Tokens per Short Window | 3000000 | 0: nobody can use neo |
| Long Window (Days) | 7 | 1 to 90 |
| Tokens per Long Window | 15000000 | 0: nobody can use neo |
| Cooldown After a Failure (Seconds) | 60 | How long a model that failed is skipped (1 to 3600). A rejected key is skipped for 10 minutes |
| Longest Wait (Seconds) | 60 | When every model is skipped for longer, neo reports an outage instead of waiting (1 to 600) |
| Time Budget per Turn (Seconds) | 80 | The longest one answer may take, every try included (10 to 300) |
| Concurrent Model Calls | 4 | Model calls in flight at once for the whole panel (1 to 64) |
| Check Tool Support | On | Asks each model once (kept 6 hours) whether tools reach it |

## Permissions

| Permission | Kind | What it allows |
|---|---|---|
| `neo.chat` | Account (API key scope) | Chatting with neo and changing its preferences |
| `neo.access` | Server (subuser) | Using neo on this server. neo then acts with the subuser's other permissions, nothing more |
| `settings.read` | Admin role | Seeing the slots' status |
| `settings.update` | Admin role | Changing the settings and testing a slot |

## Background tasks

Runs on the instance with `APP_PRIMARY=true` only.

| Task | When | What it does |
|---|---|---|
| `prune_neo_conversations` | Daily at 04:45 UTC | Deletes chats older than Keep Conversations (Days) |

## Notes

- Tool output (files, console) reaches the model marked as untrusted data, so text in a file or the
  console cannot give neo orders. neo still only does what the user's permissions allow.
- What users type and what neo reads from their servers goes to the AI provider of the model that
  answers. Name your providers in **AI Providers Named to Users**.
- A rejected API key shows as the slot's last error and skips the slot for 10 minutes. Use **Test
  Provider** after changing a key.
- rux uses these slots too, without neo's limits: orders try members-only models first, message
  checks only use models open to everyone. Keep at least one slot open to everyone.
- With noprofit.space connected and running neo, neo takes its models and limits from
  noprofit.space and the slots here are not used. See [noprofit.space](/accounts/noprofit/).
