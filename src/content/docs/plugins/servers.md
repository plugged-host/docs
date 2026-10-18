---
title: Servers
description: Self-service server creation, locations, node choice, deployment pauses, transfers and the server settings page (plugged-host-servers).
sidebar:
  order: 2
---

plugged-host-servers lets users create, resize and move their own servers. Users pick a game, a
location and a size; the plugin picks the node, creates the ports and deploys the server within
the account's allowance. It also takes overloaded nodes out of rotation, moves servers between
locations with live progress, and adds a combined settings page to the server panel.

## What it does

- **Create server page** in the app panel (a **Create server** button in the server list
  toolbar). It has four steps on one page: game, location, plan and name. Minecraft servers
  also get a EULA checkbox. The page only lets a user in when they have an allowance. Every
  check runs again on the server when the user submits, so a tampered request can't get more
  resources or a locked location.
- **Locations** come from node tags. A node tagged with a two-letter country code (`fr`, `nl`,
  `us`, …) belongs to that location. Each location card shows a flag and a latency badge
  (the lowest median panel-to-node latency from core's node telemetry). A location whose nodes
  are all paused shows as **Full**.
- **Paid location tiers.** Nodes that also carry the `plus` tag form Plus locations, and nodes
  with the `premium` tag form Premium locations (a node with both counts as Premium). Plus
  locations need Plus, and Premium locations need PlusPlus, both sold by
  [Economy](/plugins/economy/). Tiers never share nodes: a free `nl` server never lands on a
  Plus node.
- **Plans** are preset sizes shown as tiles: Starter, Standard, Pro, Ultimate, Extreme, Master.
  A tile the account can't afford is greyed out. Users can also type their own CPU, memory and
  disk values.
- **Allowance.** What an account may use across all its servers is its plan from
  [Economy](/plugins/economy/): the default or Discord tier, plus resources bought in the store,
  plus the PlusPlus CPU bonus. There is no server count and there are no role limits. A
  server's own size always counts as available to it, so an account that is over its
  allowance can keep or shrink a server but can't grow one.
- **Node choice and balancing.** Inside a location, the plugin picks the node with the lowest
  average RAM and CPU use over the last few minutes. It skips nodes whose disk is nearly full
  and nodes under a deployment pause.
- **Deployment pauses.** Every minute, nodes over their load line stop taking new servers,
  transfers and queue moves. They open again once they calm down. Tags and the node's
  `public` flag are never changed.
- **Allocations** bind `0.0.0.0`. Their alias is the node's FQDN, which is the address players
  connect to. FiveM/RedM eggs (tag `cfx`) and eggs with a `TXHOST_TXA_PORT` or `SERVER_WEBPORT`
  variable get two consecutive ports, and the second port is written into that variable.
- **Add port** button on the server's Network page. It adds the next free port after the
  primary one, up to the server's allocation limit. Users can't remove the primary or a locked
  allocation.
- **Settings page** in the server panel. It has sections for name, description and icon; SFTP
  details; VS Code (with [Devbox](/plugins/devbox/)); resources (resize within the owner's
  allowance, pushed to Wings live); startup command, Docker image and variables; server software
  and version (when a game plugin such as [Minecraft](/plugins/minecraft/) provides it);
  notifications; and a danger zone (reinstall, delete).
- **Self-service transfers.** A **Transfer** page in the server panel lets the owner, or a
  subuser with the **Transfer** permission, move a server to another location. Admins get a
  Transfer button on the admin server page and a **Lighten the load** action on the admin node
  page.
- **PlusPlus expiry.** When an account's PlusPlus runs out, its servers move off Premium
  locations (same country first, Plus before free). CPU above the allowance comes off its
  servers evenly, but never below 25% on any one server.
- **Available Resources** admin page (Admin › Server group): combined and per-node CPU, memory
  and disk charts for the nodes the admin can see.
- **Client API** under `/api/client/provision`: `GET games`, `GET plans`, `GET locations` and
  `POST servers` (create). These run the same checks as the create page.
- **neo tools.** With [AI](/plugins/ai/) enabled, neo can list create options, create, resize,
  rename and delete servers under the same rules.
- **Activity log** entries for transfers (`server:transfer.*`), plus database notifications to
  owners and admins when a move ends.

### Locations and node tags

A node is a deployment target only when all of these hold:

1. Its `public` flag is on (Pelican ignores non-public nodes for automatic deployment).
2. It has one of the tags in **Node tags** (`UCS_DEPLOYMENT_TAGS`), or that setting is empty.
3. It has a country-code tag, which names its location.
4. It has room for the server in Pelican's own allocated-resource sums (including
   over-allocation).

A typical node's tags are `deploy, nl`. A Plus node's tags are `deploy, nl, plus`. Don't pick a
two-letter country code as your deployment tag: every tag that is a country code is read as a
location.

:::caution
Don't remove a node's country tag to drain it. Transfers, failover, limbo and the location list
all read that tag. Let the deployment pause handle overloaded nodes, or turn off the node's
`public` flag.
:::

### How a node is picked

For a new server, a transfer or a PlusPlus move, the plugin:

1. Takes the viable public nodes with a deployment tag.
2. Keeps only the chosen location and tier.
3. Drops paused nodes.
4. Drops nodes whose disk use is above **Stop placing servers above** (90% by default). If that
   would leave no node at all, the disk filter is skipped, unless **Refuse nodes that cannot
   be measured** is on.
5. Sorts the rest by a score: the weighted average of RAM % and CPU % over the last
   `NODES_BALANCE_WINDOW_MINUTES` minutes, from core's per-minute node telemetry. A node with no
   samples uses a live reading. A node that doesn't answer goes last. Near-equal scores are
   tied at random.
6. On the first node that works, reuses a free allocation in the deployment port ranges or
   creates one with the node FQDN as alias. The allocation is reserved for 10 minutes so two
   creates can't take the same port.

If Wings rejects a create, the plugin asks once more. If Wings refuses again, the server row is
removed, so it never sits at "installing" forever.

### Deployment pauses

`plugged-host:deploy-pause` runs every minute on core's node telemetry and decides, per node,
whether it takes new servers:

- **The line** is the start queue's busy threshold, `START_QUEUE_THRESHOLD_PERCENT` (85% by
  default, see [Queue](/plugins/queue/)), on RAM or CPU. A **small node** (under 34 GB of RAM or
  under 9 threads) gets a line 10 points lower, so 75% by default. Disk is not part of the
  pause; the disk guard above handles it.
- **Over the line:** paused at once.
- **Paused for load:** it opens again as soon as both the current reading and the average of the
  last 5 readings are under the line.
- **No answer** 3 readings in a row: paused. It opens on the first answer under the line.
- If the scheduler or the telemetry stops, the stored state expires after 15 minutes and every
  node takes servers again. The pause fails open.

Admin › Nodes shows the reason under a paused node's name, for example "Deployment paused: RAM 88%
(line 85%)". A location keeps its card while its nodes are paused; it only shows **Full**
when every node in it is paused. Moves that must land somewhere (failover, waking from limbo)
still use paused nodes as a last resort.

### Transfers

A user picks a location, never a node. The plugin picks the node inside it by the same rules as
creation and keeps the server's port numbers where the new node has them free. The copy itself
is Wings' own checksummed transfer of the server files and its local backups. The plugin handles
everything around it:

- The server is marked as transferring first, so nobody starts it mid-move. Then it is stopped
  cleanly, and killed only after the stop timeout.
- Progress (bytes, speed, ETA) is read live from the source node's websocket and shown on the
  Transfer page. A strip on every other page of that server links to it while the move runs.
- A failed attempt frees its ports and retries on another node of the same location, up to the
  attempt limit. A copy with no bytes moving for the stall time is aborted.
- A move that gives up starts the server again on its old node, in its old power state.
- After the move, port locks and notes carry over, egg `*PORT` variables that held an old port
  follow it, subdomains are repointed, and the server starts if it was running.
- Nothing on the old node is deleted by this plugin. Pelican deletes the old copy only after the
  new node has verified it.

The states are `preparing`, `stopping`, `copying`, `finalizing`, `starting` and `completed`,
plus `retrying`, `rollback`, `failed`, `cancelled` and `stuck`. **Stuck** means the new node may
hold a copy that Wings never reported, so the plugin leaves the decision to an admin. The
**Transfers** tab on the admin server page shows the move, the nodes tried and raw Wings errors,
with **Cancel** and, for a stuck move, **Release** (keep the server on its old node). If Wings
settles a stuck move later on its own, the plugin picks that up.

A user can't start a move while the server is suspended, installing, restoring a backup,
running a backup, already moving, or inside the cooldown after its last finished move.

Admins skip the self-service switch, the cooldown, suspension and tier checks. They may pick a
specific node and choose whether the server starts on arrival. **Lighten the load** on the admin
node page queues a batch of moves to a chosen node, either stopped servers or the busiest running
ones, with at most `TRANSFERS_BATCH_PARALLEL` running at once per source node.

One background process drives all moves: `plugged-host-servers:transfers`. The first move starts
it, and the scheduler starts it again every minute while there is work. It holds a lock file
(`storage/framework/plugged-host-transfers.lock`) so only one runs, hands over to a fresh process
every 10 minutes, and exits when idle. It also adopts transfers started outside the plugin (for
example Pelican's own admin transfer, or limbo).

## Requirements

- `plugged_host.requires`: `plugged-host-core`, `plugged-host-economy`. Without Economy nobody
  has an allowance, so nobody can create servers.
- `plugged_host.optional`: `plugged-host-ai` (neo tools), `plugged-host-ads` (the ad slot on
  the create page).
- Nodes with a country-code tag and a deployment tag, and a node FQDN that players can reach.
  See [Wings](/nodes/wings/).
- The scheduler and core's node sampler (`plugged-host:sample-nodes`, every minute). Balancing
  and deployment pauses read that telemetry. See
  [Queue worker and scheduler](/panel/queue-and-scheduler/).
- The deployment pause line comes from [Queue](/plugins/queue/)'s
  `START_QUEUE_THRESHOLD_PERCENT`, even when the queue plugin is disabled.
- The `server_relocations` and `allowance_cuts` tables: run the migrations. The Transfer page,
  the admin Transfers tab and the watcher stay hidden until `server_relocations` exists. While
  it is missing, Pelican's own Transfer button stays as it is.

## Setup

1. Tag your nodes: a deployment tag of your choice (for example `deploy`), the country code, and
   `plus` or `premium` for paid tiers. Make sure each node is public and its FQDN resolves to it.
2. In Admin › Plugins › plugged.host Servers › Settings, set **Node tags** to your deployment
   tag. Optionally set **Ports** (for example `25565-25665`) and **Allowed eggs**.
3. Set the plans every account starts with in [Economy](/plugins/economy/).
4. Run the migrations:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan migrate --force
   ```

5. Check the result:

   ```bash
   sudo -u www-data php artisan plugged-host:deploy-pause
   sudo -u www-data php artisan plugged-host:doctor
   ```

To hide an egg from the create page without deleting it, give the egg the tag `hidden`. Existing
servers on it keep working.

## Settings

Admin › Plugins › plugged.host Servers › Settings. Every value is stored in the panel's `.env`.

### Limits

These apply to every server the plugin creates.

| Setting | Default | What it does |
|---|---|---|
| Default database limit, `UCS_DEFAULT_DATABASE_LIMIT` | `0` | Databases a new server may have. |
| Default allocation limit, `UCS_DEFAULT_ALLOCATION_LIMIT` | `0` | Ports a new server may have. A server always gets at least 1, or 2 for two-port eggs. |
| Default backup limit, `UCS_DEFAULT_BACKUP_LIMIT` | `0` | Backups a new server may have. |

### User Settings

| Setting | Default | What it does |
|---|---|---|
| Can users update servers?, `UCS_CAN_USERS_UPDATE_SERVERS` | `true` | The owner (or an admin who may update the server) can resize it on the Settings page within the owner's allowance. |
| Can users delete servers?, `UCS_CAN_USERS_DELETE_SERVERS` | `false` | The owner (or an admin who may delete it) gets a Delete button on the Settings page. neo's delete tool follows this too. |

### Deployment Settings

| Setting | Default | What it does |
|---|---|---|
| Node tags, `UCS_DEPLOYMENT_TAGS` | empty | Comma-separated. Only nodes with at least one of these tags get new servers. Empty allows every public node. |
| Ports, `UCS_DEPLOYMENT_PORTS` | empty | Comma-separated ports and ranges (`25565,30000-30100`) that new allocations may use. Empty falls back to Pelican's client allocation range (`PANEL_CLIENT_ALLOCATIONS_RANGE_START`/`_END`), then to 1024-65535. |
| Allowed eggs, `UCS_ALLOWED_EGGS` | empty | Comma-separated egg IDs offered on the create page. Empty offers every egg not tagged `hidden`. |

### Node pressure

Measured live from Wings, not from allocated sums. A node that doesn't answer reads as "no
reading", and the disk guard lets it through unless strict mode is on. Memory and CPU are not
set here: a node over the [Queue](/plugins/queue/)'s **Busy threshold**
(`START_QUEUE_THRESHOLD_PERCENT`) gets a deployment pause, with a lower line on small nodes.

| Setting | Default | What it does |
|---|---|---|
| Stop placing servers above, `NODES_STORAGE_PERCENT` | `90` | Disk use (%) above which a node gets no new servers or transfers. Values outside 1-100 fall back to the default. |
| Refuse nodes that cannot be measured, `NODES_STORAGE_GUARD_STRICT` | `false` | Off: if the disk filter would leave no node, it is skipped, so a monitoring blip can't empty the pool. On: no reading means no deployment. |

### Plus & Premium locations

| Setting | Default | What it does |
|---|---|---|
| Premium node tag, `UCS_PREMIUM_TAG` | `premium` | Tag that makes a node a Premium node. |
| Plus node tag, `UCS_PLUS_TAG` | `plus` | Tag that makes a node a Plus node. A node with both tags is Premium. |

### Server transfers

| Setting | Default | What it does |
|---|---|---|
| Let users move their servers, `TRANSFERS_ENABLED` | `true` | Shows the Transfer page to owners and subusers with the Transfer permission. Admin moves and the start queue's offer don't depend on it. |
| Time between moves, `TRANSFERS_COOLDOWN_HOURS` | `6` | Minimum hours between two finished user or queue moves of one server. `0` turns it off. 0-720. |
| Attempts, `TRANSFERS_MAX_ATTEMPTS` | `3` | Nodes tried before a move gives up. 1-10. |
| Stop timeout, `TRANSFERS_STOP_TIMEOUT` | `90` | Seconds a clean stop gets before the server is killed. 10-900. |

### Only in `.env`

These have no field in the form. Set them in `.env` and clear the config cache (see
[Configuration](/panel/configuration/)).

| Setting | Default | What it does |
|---|---|---|
| `NODES_DEPLOY_PAUSE_ENABLED` | `true` | Turns deployment pauses on or off. |
| `NODES_DEPLOY_PAUSE_SMALL_MEMORY_GB` | `34` | A node with less RAM than this (GB) is small. |
| `NODES_DEPLOY_PAUSE_SMALL_THREADS` | `9` | A node with fewer threads than this is small. |
| `NODES_DEPLOY_PAUSE_SMALL_OFFSET` | `10` | How many points lower a small node's line is. |
| `NODES_DEPLOY_PAUSE_AVERAGE_MINUTES` | `5` | Minutes of readings whose average must also be under the line before a paused node opens. |
| `NODES_DEPLOY_PAUSE_UNREACHABLE_AFTER` | `3` | Missed readings in a row before a node is paused for not answering. |
| `NODES_BALANCE_ENABLED` | `true` | Off: nodes inside a location are tried in random order instead of coolest first. |
| `NODES_BALANCE_WINDOW_MINUTES` | `5` | Minutes of telemetry the balancing score averages. |
| `NODES_BALANCE_CPU_WEIGHT` | `1.0` | Weight of CPU % in the score. |
| `NODES_BALANCE_MEMORY_WEIGHT` | `1.0` | Weight of RAM % in the score. |
| `TRANSFERS_STALL_MINUTES` | `10` | Minutes with no bytes moving before a copy counts as stalled and is aborted. |
| `TRANSFERS_FINALIZE_MINUTES` | `20` | Minutes the new node gets to confirm after the last byte (it may still be pulling the image). |
| `TRANSFERS_BATCH_PARALLEL` | `2` | Lighten the load: moves running at once per source node. |
| `UCS_PROVISION_LOCK_WAIT` | `30` | Seconds a create or resize waits for the account's provisioning lock before it fails as busy. |

`NODES_HOT_PERCENT` (the old **Node is busy above** field) and `UCS_PREMIUM_COST` are no longer
read. A leftover line in `.env` does nothing and can be deleted.

### Only in the config file

`config/plugged-host-servers.php` in the plugin holds two lists with no `.env` key. A plugin
update replaces the file, so keep a copy of your changes.

- **`plans`**: the preset tiles (`id`, `label`, `cpu` in %, `memory` and `disk` in MB). The
  defaults run from Starter (100%, 2 GB, 10 GB) to Master (600%, 24 GB, 100 GB).
- **`catalog`**: per-egg software types, keyed by **egg UUID**. Each type names the egg variable
  to set (`MC_SOFTWARE`), the startup command key and the Docker image key to deploy with. An
  egg with types gets the EULA checkbox, `eula.txt` written after install, and the Server
  software section on the Settings page. The shipped entry is for the Minecraft: Java Edition
  egg that [Minecraft](/plugins/minecraft/) ships (`egg/egg-minecraft-java.json`, types Purpur,
  Fabric, NeoForge, Forge). Import that egg with `plugged-host:minecraft-setup` and the entry
  works as it is. To use another egg instead, replace the UUID, startup keys and image keys with
  its own, or its servers get none of these.

## Commands

All run as `sudo -u www-data php artisan <command>` from `/var/www/pelican`.

| Command | What it does |
|---|---|
| `plugged-host:deploy-pause [--show]` | Re-evaluates every node and prints its size, line, RAM, CPU and state. `--show` prints the stored states without measuring. |
| `plugged-host-servers:transfers [--status] [--max=600]` | The transfer watcher. `--status` lists running moves and exits. `--max` is how many seconds it runs before handing over (at least 30). |
| `plugged-host:plusplus-expire [--dry-run]` | Moves servers off Premium locations and trims CPU for accounts whose PlusPlus ran out. |
| `plugged-host:allowance-cuts [--dry-run]` | Brings servers down to fit allowances that were lowered. Only plugged-host-noprofit creates these. |
| `plugged-host:trim-memory <plan> [--apply]` | Takes memory off users' servers evenly, from a plan file written by noprofit.space. Without `--apply` it only shows what would happen. Not used on a standalone panel. |

On the scheduler:

| Task | How often | Runs when |
|---|---|---|
| `plugged-host:deploy-pause` | every minute | `NODES_DEPLOY_PAUSE_ENABLED` is on |
| `plugged-host-servers:transfers` | every minute | there is a move or an unfinished Pelican transfer |
| `plugged-host:plusplus-expire` | every 5 minutes | Economy's memberships table exists |
| `plugged-host:allowance-cuts` | every 5 minutes | the `allowance_cuts` table exists |

## Doctor checks

`plugged-host:doctor` (see [Doctor](/panel/doctor/)) runs two checks for this plugin:

- **Deployment pauses**: warns when any node hasn't been evaluated in the last 3 minutes, which
  means the scheduler or the node telemetry isn't running. Otherwise it lists paused nodes and
  why.
- **Lowered allowances**: fails when the `allowance_cuts` table is missing, warns when a lowered
  allowance has waited more than 15 minutes, and otherwise reports when the last one was carried
  out.

## Notes

- The create page and the API only offer a location with room for the requested size. **No
  capacity for the selected resources** means no open node in that location can fit it.
- An account with no plan (Economy returns none) sees no Create server button.
- Resizing pushes the new limits to Wings right away. If Wings can't be reached, the server
  picks them up at its next restart.
- Creates and resizes of one account run one at a time under a lock, so two requests can't spend
  the same allowance. A request that waits longer than `UCS_PROVISION_LOCK_WAIT` (30 seconds by
  default) fails as busy.
- Plus and PlusPlus are named after your panel (`APP_NAME`) in what this plugin shows users: the
  notification when PlusPlus ends, the message for a locked location, and neo's tools.
- Transfers change the server's address (the new node's FQDN and possibly other ports). Owners
  are told the new address when the move completes.
- The transfer watcher runs `php artisan` in the background as the panel user. If moves sit at
  "preparing", check that the scheduler runs and look at
  `plugged-host-servers:transfers --status`.
- With plugged-host-noprofit enabled, the allowance comes from noprofit.space. A lower base
  there then takes resources off the servers evenly: CPU never below 25%, memory never below
  1024 MB, and disk never below what the server stores plus 1 GB.
