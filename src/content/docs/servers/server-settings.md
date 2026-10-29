---
title: Server settings
description: The server's Settings page for owners and subusers, with its icon, SFTP details, resizing, upgrades, software switch, behaviour, backup mails and deletion.
---

A server's settings are one page, **Settings**, with one section under another: Server Information,
SFTP Information, Resources (or Limits), Upgrades, Version, Behaviour, Notifications and Danger
Zone. Owners
and subusers see the sections their permissions allow; Settings shows in the server's sidebar for
anyone holding one of them. **Startup** and **VS Code** ([devboxes](/servers/devboxes/)) are pages
of their own with their own sidebar rows.

## What it does

### Sections

| Section | Shown when | Permission |
|---|---|---|
| Server Information | Always | Any of Settings' permissions; editing needs the ones below |
| SFTP Information | Always | `files.sftp` |
| Resources | Players Resize Servers is on, or the viewer is an admin | `settings.resize` |
| Limits | In place of Resources for whoever cannot resize | Any of Settings' permissions |
| Upgrades | Tokens are on and an upgrade is sold or runs on the server | `settings.upgrades` |
| Version | The server's game has two or more software choices, or it is a Minecraft server with a version variable | `settings.software` |
| Behaviour | Always | `settings.auto-start`, `settings.timezone`, `settings.auto-kill`, `settings.trash` |
| Notifications | Always | `backups.read` |
| Danger Zone | Always | `settings.install` or `settings.delete` |

Each section has an anchor, so `/server/<id>/settings#resources` opens the page at that section. The
anchors are `general`, `sftp`, `resources`, `upgrades`, `version`, `behaviour`, `notifications` and
`danger`.

### Server Information

- The server's icon, Server Name and Server Description. Name and description save when the field
  loses focus.
- The UUID and identifier (with copy buttons) and the hosting node.
- **Limits** (for those who cannot resize): CPU, memory, disk, and backups, databases and ports as
  "used / limit" ("Unlimited" for none). A count the viewer may not see shows the limit only.

### Server icon

- **Upload Icon** takes a PNG, JPEG, WebP or GIF, 64 to 4096 px a side, at most 2 MB. The user
  picks a square in the editor; the panel stores it as a 256 px WebP in the panel's storage.
- **Delete Icon** removes it, without a confirmation.
- Without an icon of its own, the server shows its game's icon (from the games catalog, see
  [Creating servers](/servers/create-server/)) with "Using Egg Icon". With neither, it shows no picture.
- The icon shows on Settings, on the server's card in the server list and on the server card in the
  server's sidebar.
- Deleting the server removes its icon file.

### SFTP Information

Rows for the connection (`host:port`), the username (`<user>.<server>`) and what to use as the
password: the account password when the account has one and password sign-in is not disabled for
it, otherwise an SSH key from Account › SSH Keys. **Launch in SFTP Client** opens the `sftp://` link.

### Resources

- The public plans as cards, the current one marked "Current plan". A plan larger than the server
  plus what the owner has left says "Exceeds your remaining allowance" and cannot be picked.
- **Advanced** sets CPU, memory and disk by hand. It starts on when the server's size is no plan.
  Each field shows what is left under it. **Save resources** sends the values.
- Each value may go up to the server's own size plus what the owner's allowance has left. The
  owner's allowance counts also when a subuser resizes.
- Shrinking always works, even for an account over its limit, so it can make room.
- Every value is at least 1. 0 (no limit) only stays where an admin set it; a user cannot set it.
- Growing also needs room on the server's node (memory and disk against the node's limits, as a
  deploy). When the node is full, the answer says to move the server first.
- The new limits go to Wings at once and apply to the running container.

### Upgrades

What the viewer can buy with their own tokens for this server: a keep-awake pass, a boost, extra
port, database and backup slots, and a card colour, each with its price, and what already runs
with its end and **Add** time. See [Server upgrades](/servers/server-upgrades/).

### Version

- **Server software**: the game's software choices from Admin › Settings › Hosting › Games, with the
  choice's description under the field. The current choice is read back from the game's variable;
  an unknown value counts as the first choice.
- **Minecraft version**: on a Minecraft server whose egg has a `MINECRAFT_VERSION`, `MC_VERSION` or
  `VANILLA_VERSION` variable. "Newest release" or one of the versions the chosen software offers.
  Choosing a version also sets `BUILD_NUMBER` back to `latest`.
- **Change and reinstall** writes the choice to the variable, takes the choice's startup command
  and image (or the egg's defaults) and reinstalls the server without deleting its files. The server
  is not started afterwards; the next start goes through the [start gates](/starts/start-gates/).
- Software and version can change in one go. A switch is refused while a Minecraft setup or a modpack
  install is running on the server ([Minecraft](/games/minecraft/)).

### Startup

The Startup page shows the startup command with a copy button, the startup command picker (the
egg's commands, and **Custom Startup** for a command of one's own, see
[Custom startup commands](/servers/startup-commands/)), the Docker image and **Server Variables**.
Each field saves when it loses focus; there is no Save button.

**Enable Preview** shows the command with its values filled in: `{{SERVER_MEMORY}}`, `{{SERVER_IP}}`
and `{{SERVER_PORT}}` from the server and its primary port (127.0.0.1 and 0 without one), then each
egg variable with the server's value or its default. Variables hidden from users, and secret ones,
show as `[hidden]`. Unknown `{{…}}` stay as written. **Disable Preview** goes back.

### Behaviour

Auto-Start, Timezone, Auto-Kill (with "Seconds until auto-kill") and "Use custom trash settings"
(Retention and Clear at Disk Usage) in one form. Each part shows with its own permission; the trash
part only while Admin › Settings › Hosting › Server › Allow Changing Trash Settings is on. One
**Save** sends only the parts that changed.

### Notifications

Two switches per person and server, saved at once:

- **Manual Backup Notifications**: backups made on the Backups page.
- **Scheduled Backup Notifications**: backups made by a schedule.

When a backup finishes, successful or failed, the owner and the subusers with `backups.read` who
turned that kind on get the `backup_completed` mail, with a link to the Backups page, and a
[panel notification](/accounts/notifications/). System backups send none.

### Danger Zone

- **Reinstall Server** runs the egg's install script again. Its dialog can delete all files first.
- **Delete Server**, when Players Delete Servers is on (admins always): the user types the
  server's name to confirm. The server is deleted as an admin deletes it, not forced: when Wings
  refuses, nothing is deleted. Its backups go with it, except its system backups while deleted
  servers are held: the newest one stays downloadable from the owner's Backups page
  ([Backups](/servers/backups/)).
- A suspended or installing server cannot be deleted from here.

### Stuck installs

An install that has run for 30 minutes is probably stuck (Wings refused the server, or the node lost
it). The console's installing banner then says so and offers:

- **Reinstall** (`settings.install`): drops whatever install Wings still runs and installs again,
  keeping the files. When Wings refuses that too, the server stays installing and the error shows.
- **Delete Server** (`settings.delete`, deleting allowed): deletes the server without waiting for
  its node to agree, since Wings often does not know it, or its node is gone. Files Wings may still
  keep for it stay on the node.

A server whose install failed offers the same Delete Server button on its block screen. The 30
minutes count from the server's creation or its last activity, whichever is newer.

## Requirements

- Resizing and deleting need the switches in Admin › Settings › Hosting › Games.
- Version needs software choices in the games catalog, or a Minecraft egg with a version variable.
- Backup mails need working mail settings (Admin › Settings › Mail).
- Stock Wings is enough.

## Setup

1. Admin › Settings › Hosting › Games: turn on **Players Resize Servers** and **Players Delete
   Servers** if owners should do either, and save.
2. For software switching, add software choices to the game (see
   [Creating servers](/servers/create-server/#setup)).
3. Optional: Admin › Settings › Mail › Mail Templates: edit `backup_completed`, the backup mail.

## Settings

| Setting | Default | What it does |
|---|---|---|
| Hosting › Games › Players Resize Servers | off | Shows Resources to owners and subusers with `settings.resize` |
| Hosting › Games › Players Delete Servers | off | Allows Delete Server for those with `settings.delete` |
| Hosting › Server › Allow Changing Trash Settings | on | Shows the trash part of Behaviour |

## Permissions

Server permissions, for subusers. The owner has all of them.

| Permission | Allows |
|---|---|
| `settings.rename` | Changing the name and description |
| `settings.change-icon` | Uploading and deleting the server's icon |
| `settings.resize` | Changing CPU, memory and disk within the owner's allowance |
| `settings.upgrades` | Buying [server upgrades](/servers/server-upgrades/) with their own tokens |
| `settings.software` | Switching the software or Minecraft version, which reinstalls the server |
| `settings.timezone`, `settings.auto-start`, `settings.auto-kill`, `settings.trash` | The parts of Behaviour |
| `settings.install` | Reinstalling, and starting a stuck install over |
| `settings.delete` | Deleting the server, when users may delete servers |
| `settings.transfer` | Moving the server ([Moving servers](/servers/moving-servers/)) |
| `files.sftp` | SFTP Information |
| `backups.read` | Notifications, and backup counts under Limits |
| `startup.read` | The Startup page and its preview |

## Notes

- Activity entries: `server:settings.resize` (old and new sizes), `server:settings.software`,
  `server:settings.update-icon`, `server:settings.delete-icon`, `server:settings.notifications`,
  `server:settings.install-retry`, and `server:delete` on the account.
- A resize and a create of the same owner never run at the same time; a second one is refused
  until the first is done.
- A subuser with only `startup.read` sees Startup in the sidebar and no Settings.
- With noprofit.space connected, SFTP takes the noprofit.space password and the row says so, and the
  allowance comes from the account's noprofit.space plan. See [noprofit.space](/accounts/noprofit/).
