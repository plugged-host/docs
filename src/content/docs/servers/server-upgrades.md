---
title: Server upgrades
description: What users buy with tokens for one server (a keep-awake pass, a boost, extra port, database and backup slots, short subdomain names, a card colour) and how to price them.
---

Server upgrades are extras a user buys with tokens for one server: a pass that keeps limbo away, a
boost of memory and CPU for a day, one more port, database or backup slot, a short subdomain name,
and a colour for the server's card. Users buy them in the server's Settings › Upgrades; admins set
the prices and terms in Admin › Settings › Economy › Server Upgrades. Every upgrade is on by
default and is sold only while [tokens](/economy/credits-and-tokens/) are on.

## What it does

### The upgrades

| Upgrade | Default price | Runs | What it does |
|---|---|---|---|
| Keep awake | 3 tokens | 7 days | [Limbo](/starts/limbo/) does not stop, park or delete the server for being idle while it runs. Sold only while limbo is on |
| Boost | 3 tokens | 24 hours | +2048 MiB memory and +100 % CPU on top of the server's own limits, outside the allowance. Sold only while the node has room for it |
| Extra port | 2 tokens | 30 days | One more port than the server's limit, at most 3 at once |
| Extra database | 2 tokens | 30 days | One more database than the server's limit, at most 3 at once |
| Extra backup slot | 2 tokens | 30 days | One more backup than the server's limit, at most 3 at once |
| Short subdomain name | a deposit of 15 tokens for 3 characters, 30 for 2 | while the subdomain exists | Refunded when the subdomain is deleted, like every [subdomain](/servers/subdomains/) deposit |
| Card colour | 2 tokens | for good | A thin line along the top of the server's card in the server list, in one of ten colours. Changing it later is free |

### Buying

- The server's Settings › **Upgrades** section says how many tokens the viewer has, then lists one
  row per upgrade that runs ("Runs until …", with **Add 7 days · 3 tokens**) and one per offer
  (**Buy · 2 tokens**, or why it cannot be bought now), the card colour last. It shows while
  something is sold or runs.
- The owner buys, or a subuser with `settings.upgrades`. **Whoever buys pays with their own
  tokens.** A subdomain deposit is the exception: it is always the owner's.
- Every purchase is confirmed first with its price and the buyer's balance. A balance that does not
  cover it turns the confirmation into **Earn tokens**, which opens Account › Tokens.
- A purchase is sent with the price the user saw: a price that changed since buys nothing, and the
  section shows the new one.
- Buying a keep-awake pass or a boost while one runs adds its time to the end. An extra slot is
  renewed on its own row (**Add 30 days**); **Buy** adds another one, up to At Most per Server.
- A parked server can get only a keep-awake pass and the card colour.
- The Network, Databases and Backups pages offer one more slot once the server's limit is reached
  ("Port limit reached. Add one more port for 30 days · 2 tokens."), to whoever may add one there.

### The boost

- The boost reaches the running container at once, without a restart. The game may need its own
  restart to use more memory (a Java server reads its heap size when it starts); the row says so.
- The server card, the console and the graphs show the boosted limits. Admin › Servers shows the
  server's own limits.
- It is sold only while the server's node has room for it:
  - the node takes new servers (not paused for its load or by an admin; a pause for disk does not
    count);
  - the memory given to the node's servers that are not parked, plus the boost, fits the node, as
    for a resize;
  - the node's newest [telemetry](/nodes/telemetry/) sample (at most 3 minutes old) stays under the
    deployment pause line ([placement](/nodes/placement/), 85 % by default, lower on a small node)
    with the boost added.

  Otherwise the row says the node is busy and its button is off.
- A server without a memory and a CPU limit is not offered one. Making a running boost longer needs
  no new check.
- When it ends, Wings gets the server's own limits again and applies them to the running container.

### Extra slots

An extra slot raises the server's own limit by one while it runs, so Admin › Servers shows the
raised limit. When it ends, the limit goes back down by one. **Nothing is deleted**: a server over
its limit keeps its ports, databases and backups and cannot add more until it is under the limit
again.

### Keep awake

While a pass runs, limbo leaves the server alone: it is not stopped, parked, or deleted after being
parked. When limbo stops an idle server, the owner gets a notification with what a pass costs and
**Keep it awake**, and the console offers the pass while the server is off. A parked server's limbo
page offers it too: there it keeps the server from being deleted, and from being parked again once
it is restored.

### Short subdomain names

A subdomain's deposit is the larger of its usual deposit and the short name's: 15 tokens for 3
characters, 30 for 2. The create form shows the deposit as the name is typed. A rename to a short
name that needs a bigger deposit than the subdomain has is refused: add it as a new subdomain
instead.

### Ending and reminders

- 48 hours before a keep-awake pass or an extra slot ends, whoever bought it gets the notification
  "… ends soon" with what adding time costs and **Add time** ([notifications](/accounts/notifications/)),
  once per end date. When the buyer has no access to the server any more, the owner gets it. A boost
  is shorter and gets none.
- What ran out ends within a minute: an extra slot's limit goes back down and a boost comes off.

### Activity

Server activity: `server:upgrade.buy`, `server:upgrade.renew`, `server:upgrade.color` and
`server:upgrade.end`. The buyer's token history shows "Server upgrade".

## Requirements

- Tokens on (Admin › Settings › Economy › Tokens). With tokens off nothing is sold; what runs keeps
  running until its end.
- [Limbo](/starts/limbo/) on for keep-awake passes, and [subdomains](/servers/subdomains/) set up
  for short names.
- [Node telemetry](/nodes/telemetry/) for boosts: a node without a recent sample is not offered one.
- Stock Wings is enough.

## Setup

Nothing to set up: with tokens on, every upgrade is sold at the defaults below. To change a price
or a term, or to stop selling an upgrade, open Admin › Settings › Economy › Server Upgrades, change
it and save.

## Settings

Admin › Settings › Economy › Server Upgrades, one part per upgrade.

| Setting | Default | What it does |
|---|---|---|
| Sell Keep-Awake Passes | on | Sells the keep-awake pass, only while limbo is on |
| Keep Awake: Tokens, Days | 3, 7 | The price, and how long one pass runs (1 to 365 days) |
| Sell Boosts | on | Sells the boost, only while the node has room for it |
| Boost: Tokens, Hours | 3, 24 | The price, and how long one boost runs (1 to 720 hours) |
| Boost: Memory (MiB) | 2048 | Memory added to the server's limit. 0 to 1048576 |
| Boost: CPU (%) | 100 | CPU added to the server's limit; 100 is one thread. 0 to 6400 |
| Sell Extra Ports, Sell Extra Databases, Sell Extra Backup Slots | on | Sells one more of the server's limit while it runs |
| Extra Port, Database, Backup Slot: Tokens, Days | 2, 30 | The price, and how long one runs (1 to 365 days) |
| Extra Port, Database, Backup Slot: At Most per Server | 3 | How many may run at once on one server. 1 to 50 |
| Bigger Deposit for Short Names | on | Subdomains of 3 characters or fewer take at least this deposit |
| 3 Characters (Tokens), 2 Characters (Tokens) | 15, 30 | The least deposit of a 3 and a 2 character name |
| Sell Card Colours | on | Sells a card colour, bought once per server |
| Card Colour: Tokens | 2 | Its price |

## Permissions

| Permission | Kind | Allows |
|---|---|---|
| `settings.upgrades` | Server (subuser) | The Upgrades section, and buying upgrades for the server with their own tokens |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `settle_upgrades` | every minute | Ends what ran out (limits back down, boosts off) and sends the ends-soon notifications |

Background tasks run only on the panel instance with `APP_PRIMARY=true`.

## Notes

- Placement, moves and resizes count a node's paid limits only. A boost is checked against the
  node when it is bought; a server moved while boosted takes its boost along unchecked.
- When a boost ends while the game uses more memory than the server's own limit, the container may
  be stopped for running out of memory.
- An admin who lowers a server's limit while an extra slot runs sets the limit with the slot
  included. When the slot ends, one is taken off whatever the limit is then.
- With [noprofit.space](/accounts/noprofit/) connected nothing changes: tokens are always the
  panel's own.
