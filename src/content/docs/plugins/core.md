---
title: Core
description: The plugin every other plugged.host plugin builds on - suspension, account deletion, panel hardening, error pages, node telemetry, navigation, the welcome tour and the doctor.
sidebar:
  order: 1
---

plugged-host-core is the base of the plugged.host plugins. It depends on no other plugin and every
other plugin requires it. It covers what a hosted panel needs whatever else you run: suspending
servers and telling their owners why, deleting accounts that still own servers, keeping the
console and the panel's forms working under real load, readable error pages, a probe of every
node each minute, a shorter sidebar, a first-login tour, the release number, and the
`plugged-host:doctor` command that checks the whole install.

## What it does

### Suspension

- **Suspend from the server list.** Admin › Servers gets a Suspend / Unsuspend row action next to
  Edit. Suspending asks for an optional reason (up to 1000 characters); unsuspending is one click.
  It needs the admin `update server` permission.
- **Every suspension is logged with its reason.** Each suspend and unsuspend, from the row action,
  Pelican's own edit page, the [abuse checks](/plugins/abuse/) or anything else, goes to the
  server's activity log with its source (an admin, the abuse scan, or the system) and the reason.
- **A page that explains it.** The owner and subusers of a suspended server land on a "Server
  suspended" page instead of pages whose buttons all fail. It says who suspended it and when, the
  admin's reason or what the abuse scan found, when the server will be deleted if the abuse purge
  has scheduled it, and has a "Get help on Discord" button. Anyone with the admin
  `update server` permission keeps the normal pages. A server parked by
  [limbo](/plugins/limbo/) shows limbo's restore page instead.

### Accounts

- **Delete a user who owns servers.** Pelican's delete button on Admin › Users › (user) is
  disabled while the user owns a server. Core adds a delete action that appears exactly then: it
  lists the servers, asks you to tick a box and type the username, deletes each server through
  Pelican (Wings removes the container, server databases are dropped), then the account. It also
  removes the activity log entries the user made, their notifications and sessions, which no
  foreign key cleans up. If a node doesn't answer, it stops at that server and says which one;
  "Delete even if a node does not respond" forgets such servers instead (for a node that is gone
  for good: their containers may keep running). It refuses the last root admin and your own
  account.
- **No self-service deletion.** The profile page has no delete button: an admin deletes accounts.
  With [plugged-host-noprofit](/plugins/noprofit/) enabled, people delete their account on
  noprofit.space instead, which removes the panel account and its servers.
- **Where people manage their account.** Other plugins send people to "manage your account" and
  "link Discord" through core. Standalone that is the panel's profile page and Pelican's own
  Discord OAuth (Admin › Settings › OAuth, with `https://panel.example.com/auth/oauth/callback/discord`
  as the Discord application's redirect).

### Allocations

- **Every server keeps a primary allocation.** A server cannot be saved without one. Its primary
  allocation cannot be detached, given to another server or deleted, and a locked allocation
  cannot be detached or deleted, except by the panel's own server deletion, transfer and build
  services. On MySQL/MariaDB, database triggers enforce the primary-allocation rule for anything
  that writes to the tables directly.
- **New allocations default to `0.0.0.0`.** The IP picker on the admin allocation forms (Node ›
  Allocations, Server › Allocations, Create Server) starts on `0.0.0.0`; players connect through
  the allocation's alias (the node's host name). An edit form keeps its stored value.
- **The real IP in the Network tab.** A server's Network page shows the address as before (the
  alias) followed by the IP it resolves to, for players whose launcher wants an IP.

### Nodes

- **Telemetry.** Every node's Wings is probed once a minute (`plugged-host:sample-nodes`):
  reachable or not, response time, CPU, memory and disk. The last 30 samples per node are kept in
  the cache. [Servers](/plugins/servers/) balances and pauses deployment from it,
  [storage](/plugins/storage/) counts failures for failover, and [status](/plugins/status/) shows
  the nodes from it. An emptied cache restarts the windows, which delays failover rather than
  triggering it.
- **Backups off per node.** With Wings' local backup driver, Pelican's backups land on the node's
  own disk. For a node that can't hold them, list it in `BACKUPS_DISABLED_NODES`: its servers'
  sidebar has no Backups page (its URL goes to the console)
  and new backups are refused everywhere: the Backups page, the client API, schedules and neo.
  Existing backups stay until deleted. The off-site mirror and failover don't use panel backups
  and keep working.
- **No mounts into server volumes.** A mount whose source is under a node's data directory,
  `/var/lib/pelican`, `/etc/pelican` or the Docker socket cannot be saved from the admin area or
  the application API, and such a mount is left out of the configuration Wings receives. The only
  exception is a [devbox](/plugins/devbox/)'s own game server volume, which its plugin creates.

### Panel hardening

- **The console survives.** On browsers without WebGL2 the terminal falls back to its plain
  renderer instead of staying blank. The console websocket reconnects by itself after sleep, a
  network change or a Wings restart. The power buttons start from the server's real state rather
  than "offline". A server that stops while the console is open no longer throws a "403 |
  Forbidden" modal over it. A console left in a background tab no longer fails with a 500 when
  the tab comes back. On phones the terminal font is smaller and the command input does no
  autocorrect.
- **Daemon errors as notifications.** When Wings refuses an action (disk full while
  decompressing, a missing file), the user gets a notification with Wings' message instead of a
  "500 Server Error" modal, and such expected errors stay out of the error log.
- **Forms that stay rendered.** Tabs, selects and other components that sometimes stayed hidden
  after navigating inside the panel are brought back without a reload.
- **The API always answers JSON.** Every `/api` request gets JSON, whatever its `Accept` header,
  so a missing or wrong API key is a 401 rather than a redirect to the login page.
- **Sessions that last.** Every signed-in session keeps a valid "remember me" cookie, so the
  console's frequent requests never land signed out. Duplicate session cookies left by an older
  cookie domain are cleared.
- **Safe mail.** Values echoed into mail templates (a server name, for example) can no longer
  turn into links or images.
- **A usable owner picker.** The Owner field on Admin › Servers › Create/Edit lists up to 1000
  users instead of 50 and searches after 250 ms instead of a second.
- **One server list.** The client server list always shows every server the user can reach (own
  and shared); its My / Others' / All tabs are hidden.
- **Labelled buttons.** On the client and server panels, actions show their label next to the
  icon instead of Pelican's icon-only buttons. The admin panel stays as Pelican ships it.

### Error pages

Pelican's error pages are replaced by standalone ones in the theme's colours, which work even when
the panel's assets don't: 4xx and 5xx pages with a short explanation and a "Back to the panel"
button, and a maintenance page for `artisan down` and any other 503 that checks again on its own
(after the `Retry-After` of `artisan down --retry=N`, or 30 seconds). Each shows the release at
the bottom. The pages for a 403 or 400 keep the reason the panel gives; a 500 shows its detail only
to root admins.

### Navigation

- **Admin sidebar groups.** Dashboard, then Servers (Servers, Nodes, Eggs, Available Resources,
  Abuse), Users (Users, Roles), Announcements & status, Subdomains, Panel (Settings, Plugins,
  Health, Panel Logs) and a collapsed Advanced group (API Keys, Webhooks, Database Hosts, Backup
  Hosts, Mounts). Entries from plugins that aren't installed simply don't appear.
- **A shorter server sidebar.** The pages people open every day stay on top in a fixed order
  (Console, Files, the Minecraft and FiveM pages, Backups, Settings); the rest (FiveM's
  Artifacts and Enhanced pages, Subdomains, Network, Databases, Schedules, Users, Transfer,
  Activity, Open in Admin) fold into a "More" group that starts collapsed. Pages from other
  plugins keep their own place below the everyday ones. Every page still opens by URL.
- **Hidden entries.** You choose sidebar entries to hide per panel (see Settings). Pelican's
  server Settings and Startup pages are always hidden: the [servers](/plugins/servers/) plugin's
  combined Settings page replaces them.
- **Panel name in the top bar.** Without [Theme v2](/plugins/theme-v2/) (which removes the top
  bar), the panel's name is shown beside the logo.

### Welcome tour

The first time someone signs in to the client panel they are sent to the server list, where a
tour dims the page and points at each part in turn: the sidebar, their usage and balance, the
account menu, Create server and the server cards. The second part runs the first time they open a
server's console: console, power buttons, address, the server sidebar, Settings and the way back.
"Replay the welcome tour" in the account menu starts it again. Changing `TOUR_VERSION` shows it
once more to everyone; `TOUR_ENABLED=false` turns it off immediately.

### Release version

The release is the plugins' `VERSION` file plus the commit the plugins checkout is on, for example
`v2.2.0.9b53c14`, read from `.git` on every request without running git. It appears at the foot
of every panel page (replacing Pelican's footer), on the error pages, in `plugged-host:doctor`, in
the status export, and as the version of every plugged.host plugin in Admin › Plugins. See
[Versions](/reference/versions/).

### Shared hooks

Other plugins build on core rather than on each other: the start chain (one hook in front of every
server start, where [limbo](/plugins/limbo/), the [queue](/plugins/queue/) and the
[ad room](/plugins/ads/) decide whether a start goes ahead), the node telemetry above, the
suspended-server page, the plugin dependency check and the doctor. Core also creates the
`cache` and `cache_locks` tables Laravel's `database` cache store needs, and while the panel's
cache store is a database one it deletes expired rows every hour.

## Requirements

- No other plugin. Works with [Theme v2](/plugins/theme-v2/) (optional).
- A queue worker and the scheduler (see [Queue and scheduler](/panel/queue-and-scheduler/)): the
  node probe, the doctor's heartbeats and the cache cleanup run on the scheduler.
- The panel's assets rebuilt after installing the plugins: core's stylesheet is part of
  Pelican's Vite build (see [Install the plugins](/panel/plugins/#rebuild-the-assets)).

## Setup

Core needs no setup beyond [installing the plugins](/panel/plugins/) and running the migrations.
Then check the install:

```bash
cd /var/www/pelican
sudo -u www-data php artisan plugged-host:doctor
```

## Settings

Admin › Plugins › plugged.host Core › Settings.

### Welcome tour

| Setting | Default | What it does |
|---|---|---|
| Show the welcome tour (`TOUR_ENABLED`) | `true` | Sends users who haven't seen the tour to the server list and runs it there. `false` stops it for everyone at once. |
| Tour version (`TOUR_VERSION`) | `2` | Change it to show the tour again to everyone who has already seen it. Leave it for wording fixes. |

### Backups

| Setting | Default | What it does |
|---|---|---|
| Backups off on (`BACKUPS_DISABLED_NODES`) | empty | Nodes (stored as comma-separated node IDs) whose servers get no Backups page and cannot make new backups. Existing backups stay. |

### Sidebar visibility

| Setting | Default | What it does |
|---|---|---|
| Admin / App / Server panel (`NAV_HIDDEN_ITEMS`) | the server panel's Mounts page and Webhooks | Sidebar entries to hide, one picker per panel. Stored as one comma-separated list of page and resource class names. The pages stay reachable by URL. Entries of a plugin that is currently disabled are kept when you save. |

### Only in `.env`

| Setting | Default | What it does |
|---|---|---|
| `PLUGGED_HOST_RELEASE` | unset | Overrides the release shown everywhere, for a deploy without `.git`, e.g. `v2.2.0.9b53c14`. |
| `SESSION_REMEMBER_COOKIE` | empty | Gives the "remember me" cookie its own name (letters, digits, `_`, `-`, up to 64). Set it on a panel whose host name is under another Laravel app's cookie domain (a dev panel under the production panel's domain), or the browser hands it the other app's cookie. |

## Commands

| Command | What it does |
|---|---|
| `plugged-host:doctor` `{plugin?}` | Check that the plugged.host plugins have what they need and are healthy. Lists the plugins with what each requires and works with, then runs every enabled plugin's checks, or only one plugin's (`plugged-host:doctor plugged-host-storage`). Exits non-zero when a check fails. |
| `plugged-host:sample-nodes` | Probe every node's Wings once and record reachability, latency and load. Prints one line per node. |

On the scheduler:

| Task | How often |
|---|---|
| `plugged-host:sample-nodes` | every minute |
| Scheduler tick for the doctor | every minute |
| Queue heartbeat for the doctor (a small queued job) | every 5 minutes |
| Delete expired cache rows and locks, only while the cache store is `database` | hourly |

## Doctor checks

| Check | Result |
|---|---|
| Plugin requirements | fails when an enabled plugin requires one that is off, naming both |
| Volume mounts | warns about a mount into a server volume that is user-mountable, attached to an egg or node, or not a devbox's own volume |
| Scheduler (cron schedule:run) | fails when the scheduler hasn't ticked for 3 minutes, and prints the crontab line |
| Queue worker | fails when no queued job has been taken for 15 minutes |
| Nodes reachable from the panel | warns about nodes that didn't answer the last probe, or have no sample from the last 150 seconds |

## Notes

- **The allocation migration can stop.** On install, every existing server is given a primary
  allocation (its own, or the first free one on its node). If a server has none and its node has
  no free allocation, the migration fails with that server's ID: add an allocation to the node and
  run it again.
- **Triggers need privileges.** On MySQL/MariaDB that migration also creates three triggers. The
  database user needs the `TRIGGER` privilege (Pelican's usual `ALL PRIVILEGES` on its database
  includes it). With binary logging on, MySQL/MariaDB also want `SUPER` or
  `log_bin_trust_function_creators=1` to create a trigger.
- **Rebuild after a panel upgrade.** A Pelican upgrade replaces `public/build`. Rebuild the assets
  right away: with the release's own manifest, which has no entries for the plugins, panel pages
  fail (see [Updating](/panel/updating/#upgrading-pelican)).
- **plugged.host wording and links.** Some text is written for plugged.host: the tour's copy (it
  names plugged.host, the Resource Store, Plus and tokens), the 5xx and maintenance pages' status
  link (`https://status.plugged.host`), the maintenance page's Discord button
  (`DISCORD_INVITE_URL` from the [Discord plugin](/plugins/discord/)) and the suspended page's
  help button (`NEO_SUPPORT_URL` from the [AI plugin](/plugins/ai/)). Both default to
  plugged.host's Discord when unset. Change the copy in the plugin's `lang/` files, or turn the
  tour off.
- **An ad on the maintenance page.** The maintenance page shows an A-ADS ad slot while
  `ADS_ENABLED` (the [ads plugin](/plugins/ads/)'s switch) is true, which is its default. Set
  `ADS_ENABLED=false` if you don't run ads.
- **Mounts you made yourself.** If you used Pelican mounts into `/var/lib/pelican` or
  `/etc/pelican` before installing core, Wings stops receiving them. The doctor's "Volume
  mounts" check lists them.
