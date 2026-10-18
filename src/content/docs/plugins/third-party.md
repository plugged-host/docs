---
title: Third-party plugins
description: The three community Pelican plugins in the repository - Announcements, Subdomains (with plugged.host's changes) and Mclogs Uploader - their licences and setup.
sidebar:
  order: 17
---

Three plugins in the repository are not plugged.host's own. They come from the Pelican community
plugins ([github.com/pelican-dev/plugins](https://github.com/pelican-dev/plugins), listed on
[hub.pelican.dev](https://hub.pelican.dev)) and keep their own licence, the **GPL-3.0** (each
folder has its `LICENSE`), while the plugged.host plugins are MIT.

| Plugin | Author | Version | Ships | plugged.host changes |
|---|---|---|---|---|
| `announcements` | Boy132 | 1.1.0 | enabled | none |
| `subdomains` | Boy132 and HarlequinSin | 2.2.0 (follows the plugged.host release) | enabled | many, see below |
| `mclogs-uploader` | Boy132 | 1.0.1 | disabled | none |

## Announcements

Panel-wide banners for maintenance notices and news, managed under Admin › Announcements (in the
Announcements & status group of [core's admin sidebar](/plugins/core/#navigation)).

- Each announcement has a title, an optional body, a type (info, success, warning, danger) that
  sets its colour, an optional icon, an optional link (label and URL), the panels it shows on
  (Admin Area, Client Area, Server List; empty means all), and an optional "valid from" and
  "valid to". The form shows a live preview.
- An announcement can also go out by email, to every user or to the ones you pick, when you create
  it or later with the send action on its row. The mail is queued, so it needs the
  [queue worker](/panel/queue-and-scheduler/) and the panel's mail settings.
- Roles get an "announcement" permission group (view, create, update, delete, and send mails), so
  you can let staff publish announcements without other admin rights.

Its `plugin.json` points at the plugin hub for updates, so Pelican can offer newer versions of it.

## Subdomains

Players get `play.example.com` instead of `node1.example.com:25565`: server owners create
subdomains of your domains, and the plugin writes the DNS records on Cloudflare. plugged.host's
version adds Minecraft and FiveM SRV records chosen by egg, subdomains for servers whose allocation
binds `0.0.0.0`, token deposits, Discord requirements and a settings page. Its `plugin.json` has no
update URL, so the panel never offers to replace it with the upstream version, which has none of
these changes.

### What it does

- **A Subdomains page on the server**, in the server sidebar's "More" group, for the eggs in
  "Supported Egg IDs", or, while that is empty, every egg the plugin recognises as Minecraft: Java
  Edition or FiveM / RedM (see "Which game an egg is" below). The owner picks a name (letters,
  digits and hyphens, 2 to 63 characters) and, with more than one domain, the domain. The page lists each subdomain with its state
  ("Processing" for the first 3 minutes, then "Active"), its type, its deposit, and what players type
  to connect (`connect play.example.com` for FiveM).
- **The records.** Every subdomain gets an A record (AAAA for an IPv6 address), never proxied by
  Cloudflare. Game servers also get SRV records, so players need no port:
  - Minecraft: `_minecraft._tcp.<name>`.
  - FiveM and RedM: `_cfx._udp.<name>` and `_cfx._tcp.<name>`.
  - Others, when the egg's features include `srv-factorio`, `srv-rust`, `srv-mumble`,
    `srv-scpsl` or `srv-teamspeak`.

  An SRV record points at the node's SRV target (or its FQDN) on the server's primary port. Every
  record carries the comment "Created by <panel name> Subdomains (... Server #id)", with the
  panel's `APP_NAME` cut to 32 characters. When a subdomain is deleted, leftover records for its
  server are removed too when they carry that comment under the current panel name (or the older
  "Created by plugged.host Subdomains" one). Records with any other comment are left alone, so
  rename the panel only after deleting subdomains you want cleaned up.
- **Which game an egg is.** In this order: the egg IDs in "Minecraft Egg
  IDs" and "FiveM Egg IDs"; the egg's `srv-*` features (`srv-minecraft`, `srv-fivem` or
  `srv-cfx`, and the others above); the egg's tags (`cfx` is FiveM / RedM, `minecraft` is
  Minecraft: Java Edition unless the egg is also tagged `bedrock` or `proxy`, or has "bedrock" in
  its name); and finally the egg's name (containing "minecraft" but not "bedrock", or
  "fivem"/"redm").
- **Servers on `0.0.0.0`.** The A record gets the allocation's IP when it is a real one; otherwise
  the first of the allocation's alias, the node's SRV target and the node's FQDN that is an IP or
  resolves to one. A server with none gets no Subdomains page.
- **Limits.** Each server may have "Default Subdomain Limit" subdomains, or its own limit: Admin ›
  Servers › (server) › Subdomains › Change limit (`0` uses the default). Admins can also create
  subdomains for a server there.
- **Token deposits.** With [plugged-host-economy](/plugins/economy/) and tokens enabled, each
  subdomain costs a deposit in the owner's tokens, rising with each subdomain on the server (1st,
  2nd, 3rd, then every further one). The deposit is refunded when the subdomain or its server is
  deleted. Without economy, subdomains are free.
- **Discord requirements.** Optionally the server owner must have linked Discord, and be a member
  of your Discord server, before creating a subdomain. The server check only applies while
  [plugged-host-discord](/plugins/discord/) is enabled. The page links to that plugin's invite
  (`DISCORD_INVITE_URL`) when one is set.
- **Follows the server.** When [plugged-host-servers](/plugins/servers/) moves a server to another
  node, its records are updated. Deleting a server deletes its subdomains and their records.
- **Subusers** need the server's Network permissions: read to see the page, create, update and
  delete for the matching actions.
- **Client API:** `GET /api/client/servers/{server}/subdomains` lists a server's subdomains,
  read-only.
- **Admin pages**: Admin › Subdomains › Domains (your Cloudflare zones) and SRV Targets (a host
  name per node for SRV records, default the node's FQDN).

### Requirements

- [plugged-host-core](/plugins/core/). Works with [economy](/plugins/economy/) (deposits),
  [discord](/plugins/discord/) (the Discord checks) and [servers](/plugins/servers/) (transfers).
- Your domains on Cloudflare, with node host names that are not proxied.

### Set it up

1. **Create a Cloudflare API token.** In the Cloudflare dashboard: My Profile › API Tokens ›
   Create Token › Create Custom Token. Give it these permissions:

   | Type | Item | Access |
   |---|---|---|
   | Zone | Zone | Read |
   | Zone | DNS | Edit |

   Under Zone Resources include only the zones players should get subdomains of. Optionally, under
   Client IP Address Filtering, allow only the panel's IP. Create the token and copy it.
2. **Paste it** into Admin › Plugins › plugged.host Subdomains › Settings › Cloudflare API Token
   and save.
3. **Add your domains**: Admin › Subdomains › Domains › New. Enter the zone exactly as it is on
   Cloudflare (`example.com`). The panel looks up its zone ID; "Is synced" shows it worked. If
   not, fix the token and press Sync on the row.
4. **Check which eggs get subdomains.** With the egg ID fields left empty, every Minecraft: Java
   Edition and FiveM / RedM egg gets the page and its SRV records, recognised by its features,
   tags or name. Fill in "Supported Egg IDs", "Minecraft Egg IDs" or "FiveM Egg IDs" only to
   pick eggs by ID; look the IDs up in Admin › Eggs.
5. **Decide on the Discord requirements** (see the notes), the limits and the deposits.
6. Optionally set an **SRV target** per node in Admin › Subdomains › SRV Targets, when SRV records
   should point at another host name than the node's FQDN.

### Settings

Admin › Plugins › plugged.host Subdomains › Settings.

| Setting | Default | What it does |
|---|---|---|
| Cloudflare API Token (`SUBDOMAINS_CLOUDFLARE_TOKEN`) | empty; falls back to `CLOUDFLARE_TOKEN` | The token the plugin uses for Cloudflare. Never shown again: leave the field empty to keep it. The New button on Domains appears once a token is set. |
| Default Subdomain Limit (`SUBDOMAINS_DEFAULT_LIMIT`) | `3` | Subdomains per server when the server has no limit of its own. 1 to 50. |
| Supported Egg IDs (`SUBDOMAINS_SUPPORTED_EGGS`) | empty | Comma-separated egg IDs whose servers get the Subdomains page. Every other egg has none. Empty: every egg recognised as Minecraft: Java Edition or FiveM / RedM. |
| Require Linked Discord Account (`SUBDOMAINS_REQUIRE_DISCORD`) | `true` | The server owner must have linked Discord. |
| Require Discord Server Membership (`SUBDOMAINS_REQUIRE_DISCORD_GUILD`) | `true` | The server owner must be a member of your Discord server. Only applies while plugged-host-discord is enabled. |
| Subdomain Blacklist (`SUBDOMAINS_BLACKLIST`) | a list of reserved names, below | Names nobody can take. A `*` matches the rest of a name (`test*`). |
| 1st Subdomain Cost (`SUBDOMAINS_TOKEN_COST_1`) | `1` | Deposit in tokens for a server's first subdomain. 0 to 1000. |
| 2nd Subdomain Cost (`SUBDOMAINS_TOKEN_COST_2`) | `3` | For the second. |
| 3rd Subdomain Cost (`SUBDOMAINS_TOKEN_COST_3`) | `8` | For the third. |
| 4th+ Subdomain Cost (`SUBDOMAINS_TOKEN_COST_DEFAULT`) | `15` | For every further one. |
| Minecraft Egg IDs (`SUBDOMAINS_MINECRAFT_EGGS`) | empty | Eggs that get a Minecraft SRV record, whatever their features, tags or name. Empty: recognised as described above. |
| FiveM Egg IDs (`SUBDOMAINS_FIVEM_EGGS`) | empty | Eggs that get the FiveM SRV records. Empty: recognised as described above. |

The default blacklist:

```text
www,panel,admin,api,auth,login,billing,client,node*,dash*,status,cp,webmail,mail,email,smtp,pop,
imap,ns*,dns*,vpn,ssl,secure,autodiscover,ftp,ssh,sftp,pma,mysql,database,proxy,gateway,cloud*,
dev,stage,staging,test,prod,internal,support,help,shop,store,docs,legal,terms,privacy,cdn,assets,
static,app,bot,discord,fivem,minecraft,mc
```

### Notes

- **The server check needs plugged-host-discord.** Membership is only known from the Discord
  plugin's records, so while that plugin is disabled "Require Discord Server Membership" is
  skipped. "Require Linked Discord Account" also accepts a Discord link made through Pelican's
  own Discord OAuth.
- **Your invite link.** The Discord message links to the Discord plugin's invite
  (`DISCORD_INVITE_URL`). With none set, it names your Discord server without a link.
- **Proxy and Bedrock eggs.** An egg tagged `minecraft` and `proxy` (Velocity, BungeeCord) only
  counts as Minecraft: Java Edition when its name contains "minecraft", and a Bedrock egg never
  does. With empty egg ID fields such eggs get no Subdomains page. List them in "Supported Egg
  IDs" to give them subdomains (an A or AAAA record), and a proxy egg also in "Minecraft Egg IDs"
  for the SRV record.
- **Names are checked on Cloudflare too.** A name already used by a record in the zone (made by
  hand, for instance) is refused, and a failed write is rolled back, the deposit included.
- **Don't proxy the records.** The plugin always creates DNS-only records; game traffic can't go
  through Cloudflare's proxy.

## Mclogs Uploader

Adds an upload button to the console header of a running server. It takes the console log Wings
keeps for the server, uploads it to [mclo.gs](https://mclo.gs) and shows the link, which the owner
can share when asking for help. plugged.host ships it disabled; the [AI plugin](/plugins/ai/) has
its own mclo.gs log check.

| Setting | Default | What it does |
|---|---|---|
| Only for Minecraft eggs? (`MCLOGS_UPLOADER_ONLY_MINECRAFT_EGGS`) | `false` | Show the button only on servers whose egg has the `minecraft` tag. |

The log becomes a paste on mclo.gs, a third-party service: anyone with the link can read it.
