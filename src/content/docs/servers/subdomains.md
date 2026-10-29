---
title: Subdomains
description: How users give their server a name like play.example.com, with DNS records the panel writes in your Cloudflare zone, and how to set up the token and domains.
---

Users give their server a name like `play.example.com` under the domains you offer. The panel
writes the DNS records (an A or AAAA record, and SRV records where the game uses them) in the
domain's Cloudflare zone, points them at wherever the server runs, and follows the server when it
moves. Users manage them on the server's **Subdomains** page; admins set up the Cloudflare token
and the domains, and can see and delete any server's subdomains.

## What it does

### Which servers get subdomains

The egg's features decide what a server gets. A server whose egg has none of these has no
Subdomains page.

| Egg | Records | Players join with |
|---|---|---|
| A Minecraft: Java Edition server (not a proxy), or the feature `srv-minecraft` | A + `_minecraft._tcp` SRV | `play.example.com` |
| `cfx` (FiveM, RedM), or `srv-fivem` / `srv-cfx` | A + `_cfx._udp` and `_cfx._tcp` SRV | `connect play.example.com` |
| `srv-mumble`, `srv-teamspeak` | A + `_mumble._tcp` / `_ts3._udp` SRV | `play.example.com:<port>` |
| `srv-factorio`, `srv-rust`, `srv-scpsl` | A + `_factorio._udp` / `_rust._udp` / `_scpsl._udp` SRV | `play.example.com:<port>` |
| `subdomain` | A only | `play.example.com:<port>` (no port for 80 and 443) |

See [Minecraft](/games/minecraft/) for which eggs count as Minecraft servers.

### The address

The A record (AAAA for IPv6) points at:

1. the server's primary port's IP, when it is not `0.0.0.0` or a loopback address;
2. for a port on `0.0.0.0`, the first of these that resolves: the port's alias, the node's **SRV
   Target** (Admin › Nodes › a node), the host of the node's public URL, or of its URL.

The SRV records name the node's SRV Target or URL host when that is a host name, otherwise the
subdomain itself. Records are DNS only (not proxied through Cloudflare) with automatic TTL.

The records follow the server by themselves, in the background:

- after a [move](/servers/moving-servers/) to another node;
- after a [failover](/nodes/failover/) or a [limbo](/starts/limbo/) restore to another node;
- after the primary port changes, by the owner or an admin.

A subdomain whose records could not be updated keeps its old ones. **Write Records Again** on the
Subdomains page writes them for the current address.

### Records in a shared zone

Every record carries the comment `Created by <panel name> Subdomains (Server <first 8 of its uuid>)`.
Before writing, the panel checks the zone: a record of the same name and type that is not this
subdomain's own refuses the subdomain ("is used by another record"), so records you made by hand are
never overwritten. Deleting a subdomain removes its own records, and any other record of those names
whose comment marks it as the panel's for this server.

A subdomain is written in one go: when Cloudflare refuses a record, the records already made for it
are removed again, the subdomain is not created and its tokens come back. A failed rename keeps the
old name.

### Limits and tokens

- A server may have **Subdomains per Server** subdomains (3), or its own limit (Admin › Servers › a
  server › Subdomains; empty follows the setting, 0 allows none).
- While tokens are on (Admin › Settings › Economy › Tokens), the server's owner pays a deposit for
  each subdomain, by how many the server already has: 1, 3, 8, then 15 tokens. The price is kept with
  the subdomain and refunded when it is deleted: by the user, by an admin, with its domain, or with
  the server. Changing the prices later does not change refunds of existing subdomains. See
  [Credits and tokens](/economy/credits-and-tokens/).
- **Short names** take a bigger deposit while Admin › Settings › Economy › Server Upgrades › Bigger
  Deposit for Short Names is on: at least 15 tokens for a name of 3 characters and 30 for 2, or the
  usual deposit when that is higher. The create form's deposit follows the name as it is typed, so
  the price shows before Create. A rename to a short name that needs a bigger deposit than the
  subdomain has is refused: add it as a new subdomain. See [Server upgrades](/servers/server-upgrades/#short-subdomain-names).
- A subuser with `subdomains.create` spends the owner's tokens. Only the owner sees the balance.
- Names are 2 to 63 lowercase letters, digits and hyphens, not starting or ending with a hyphen.
  Each name is unique per domain.
- Built-in blocked names include `www`, `panel`, `admin`, `api`, `mail`, `status`, `node*`, `ns*`,
  `dns*`, `cloud*`, `dash*` and other common service names. **Blocked Names** adds your own.
- Admin › Settings › Accounts › Discord can require the owner to have linked their Discord account,
  or to be in your Discord server, for new subdomains. See [Discord](/discord/integration/).

### The Subdomains page

- The title with how many subdomains are used of the limit ("2 of 3 used") under it.
- A plus button in the table's toolbar creates a subdomain (with `subdomains.create`). It is
  disabled with "Subdomain limit reached", or with the reason the server cannot have one.
- Columns: Name (a click copies it), Status ("Processing" with minutes left for the first three
  minutes, then "Active"), Type (Minecraft, FiveM / RedM, Standard or another SRV service), Deposit
  (while tokens are on), Connect With (a click copies it). Row actions: Write Records Again and Edit
  (`subdomains.update`), Delete (`subdomains.delete`).
- **Create Subdomain**: the deposit and, for the owner, their balance; the Name with the domain as
  its suffix; the Domain when there are several.
- **Edit Subdomain** renames it; saving the same name writes the records again.
- **Delete** says what happens and how many tokens go back.
- When no subdomain can be made, the page says why: subdomains not set up, the game not supported,
  no domain yet, no address to point at, or the Discord requirement.

## Requirements

- A domain whose DNS is on Cloudflare (the domain's nameservers point at Cloudflare).
- A Cloudflare API token with **Zone › Zone › Read** and **Zone › DNS › Edit** on that zone.
- Eggs with one of the features above. Without them, servers have no Subdomains page.
- A reachable address for each server: a public IP on its primary port, or, for ports on `0.0.0.0`,
  a port alias or node SRV Target or node URL that resolves to the node's public address.
- Stock Wings is enough.

## Setup

1. In Cloudflare, add the domain you want subdomains under (for example `example.com`) as a zone and
   point its nameservers at Cloudflare.
2. Cloudflare › My Profile › API Tokens › **Create Token** › **Create Custom Token**:
   - Permissions: **Zone › Zone › Read** and **Zone › DNS › Edit**.
   - Zone Resources: **Include › Specific zone › example.com** (or all zones of the account, if you
     will offer several domains).
   - Create it and copy the token.
3. Admin › Settings › Hosting › Subdomains: paste the token into **Cloudflare API Token**, turn on
   **Subdomains**, adjust the limit, deposits and blocked names, and save.
4. Admin › Domains › **Add Domain**: type the domain exactly as its Cloudflare zone is named
   (`example.com`). It shows **Linked** once the token sees the zone; a domain the token does not see
   is refused.
5. Optional: Admin › Nodes › a node › **SRV Target**: the host name SRV records should point to,
   such as `node1.example.com`. Empty uses the node's address.
6. Check that the eggs users use have a matching feature (Minecraft and FiveM eggs are recognised
   by themselves; add `subdomain` or an `srv-*` feature to others).

When a domain's zone moves to another Cloudflare account, give the panel a token for that account
and use **Look Up the Zone Again** on Admin › Domains.

## Settings

### Admin › Settings › Hosting › Subdomains

| Setting | Default | What it does |
|---|---|---|
| Subdomains | off | Servers get a Subdomains page; needs the token too |
| Cloudflare API Token | none | Stored encrypted; leave empty to keep the stored one |
| Subdomains per Server | 3 | Unless a server has its own limit (0 to 100) |
| First Subdomain | 1 | Token deposit for a server's first subdomain (0 is free) |
| Second Subdomain | 3 | For its second |
| Third Subdomain | 8 | For its third |
| Every Further Subdomain | 15 | For each one after that |
| Blocked Names | none | Names nobody may take, on top of the built-in ones; comma or line separated, `*` matches anything (`test*`) |

Users are offered subdomains only while both **Subdomains** is on and a token is set.

### Admin › Settings › Accounts › Discord

| Setting | Default | What it does |
|---|---|---|
| Linked Discord Required | off | The owner needs a linked Discord account for new subdomains; existing ones stay |
| Server Membership Required | off | The owner needs to be in your Discord server for new subdomains |

## Permissions

Server permissions, for subusers:

| Permission | Allows |
|---|---|
| `subdomains.read` | Viewing the server's subdomains |
| `subdomains.create` | Adding subdomains; the owner pays the tokens |
| `subdomains.update` | Renaming subdomains and writing their records again |
| `subdomains.delete` | Deleting subdomains; the tokens go back to the owner |

Admin role permissions:

| Permission | Allows |
|---|---|
| `domains.read`, `domains.create`, `domains.delete` | Viewing, adding and deleting domains (deleting removes every subdomain under it) |
| `domains.update` | Looking a domain's zone up again |
| `servers.subdomains` | A server's Subdomains tab: viewing and deleting its subdomains, and its limit |

## Notes

- Deleting a domain deletes its subdomains first: records removed, tokens refunded.
- A private IP on a server's primary port is written as it is. Bind users' ports to the
  public address, or to `0.0.0.0` with an alias or SRV Target that resolves publicly.
- The page shows "Processing" for the first three minutes after a subdomain is made, while the new
  records spread.
- Activity: `server:subdomain.create`, `.update`, `.delete` on the server; `server:subdomains.limit`,
  `server:subdomain.delete`, `domain:create`, `domain:sync` and `domain:delete` in the admin log.
  Deposits and refunds show on the owner's Tokens page.
- The deposit uses the panel's own tokens and works the same with or without noprofit.space.
