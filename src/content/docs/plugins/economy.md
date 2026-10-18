---
title: Economy
description: Credits, tokens, Plus and PlusPlus, the Resource Store and the plans every account starts with (plugged-host-economy).
sidebar:
  order: 3
---

plugged-host-economy holds the panel's two currencies and what they buy. **Credits** buy CPU,
memory and disk in the Resource Store. **Tokens** buy Plus and PlusPlus. The plugin also defines
each account's plan: the resources it may use across all its servers.
[Servers](/plugins/servers/) enforces that plan when users create or resize servers.

## What it does

- **Two currencies that can't be exchanged.** Each has a balance per user and a ledger of every
  change.
  - **Credits** come from Discord invite and boost rewards ([Discord](/plugins/discord/)),
    starting credits and admin adjustments. They buy resources and can pay for PlusPlus.
  - **Tokens** come from completing a sponsored Linkvertise link on the Tokens page, plus an
    optional free daily grant. They buy Plus and PlusPlus. Other plugins spend them too: waking
    a hibernated server ([Limbo](/plugins/limbo/)) and subdomains
    ([Third-party plugins](/plugins/third-party/)).
- **Plans.** Every account starts on a tier: the **default** tier, or the **Discord** tier while
  its linked Discord account is in your Discord server (needs [Discord](/plugins/discord/)).
  Resources bought in the store are added on top, and so is the PlusPlus CPU bonus. There is no
  ceiling: the price curve is the brake.
- **Resource Store** (app panel, `/store`). One row per resource, with a meter showing what the
  servers use, the rest of the plan, and where prices get steep. Each row offers 1, 2 or 4 steps.
  The page also shows the credit history.
- **Plus page** (app panel, `/plus`; the old `/token-store` redirects there). It compares Free,
  Plus and PlusPlus and sells both.
- **Tokens page** (app panel, `/tokens`). It shows the token balance, today's earning cap, the
  recent ledger, and one earn link per configured provider. The earn provider (Linkvertise) is
  set up in the [Ads](/plugins/ads/) settings.
- **Starting credits** for every new account, when you set them.
- **Clawbacks.** When a Discord reward is reversed (an invited member left) and the balance
  can't cover it, the plugin can sell bought resources back at their current price. It only
  takes headroom no server is using. The rest is carried as debt.
- **Economy tab on the admin user page**: both balances, with **Set credits** and **Set tokens**.
- **"Get more resources" cards** on the Resource Store and the server-installing page: the
  Discord tier, Discord invites and the store, each hidden once claimed.
- **Topbar balances**: the numbers [Theme v2](/plugins/theme-v2/) shows in the topbar.
- **Client API** under `/api/client/economy`: `GET balances`, `GET transactions` (recent
  tokens), and `POST store/purchase` (`resource` = `cpu`, `memory` or `disk`, plus `amount`).
- **No ads for PlusPlus.** The plugin registers PlusPlus as an ad exemption with
  [Ads](/plugins/ads/), which removes every ad surface for those users at once.

### Plus and PlusPlus

**Plus** is bought once with tokens and kept for good. **PlusPlus** needs Plus. It is bought for a
number of days with tokens or credits, and buying again before it ends adds to the time left.

| | Free | Plus | PlusPlus |
|---|---|---|---|
| Locations | Free | Free and Plus | Free, Plus and Premium |
| Place in the start queue ([Queue](/plugins/queue/)) | Normal place | Ahead of everyone without Plus | At the front |
| Ads ([Ads](/plugins/ads/)) | All | No in-game ads; banners refresh more slowly | None at all |
| CPU | The plan | The plan | The plan + `PLUSPLUS_CPU_BONUS` |
| neo usage ([AI](/plugins/ai/)) | 100% | `PLUS_AI_PERCENT` | Plus × `PLUSPLUS_AI_PERCENT` (156% by default) |

With [Devbox](/plugins/devbox/) enabled and migrated, the Plus page also lists VS Code on the
server with each tier's devbox resources.

When PlusPlus runs out, [Servers](/plugins/servers/) moves servers off Premium locations and
takes CPU above the allowance off the servers evenly. That runs every 5 minutes.

Users see Plus and PlusPlus under your panel's name (`APP_NAME`): with
`APP_NAME="Example Host"` the page is "Example Host Plus". The same goes for its menu entry,
notifications, ledger lines, the Tokens page, the admin Economy tab and the settings.

The Plus page writes the PlusPlus term from the day settings. Whole weeks read as weeks, anything
else as days: with the defaults it says "a week, or credits for two weeks", and with
`PLUSPLUS_TOKEN_DAYS=3` it says "3 days, or credits for two weeks". With credits switched off
it shows only the token term. The FAQ's answer about paying with credits follows
`PLUSPLUS_CREDIT_DAYS` the same way.

### How store prices work

Each resource is sold in steps (for example 1024 MB of memory). A step's price depends on how
much of the resource the account already has, measured against the plan's **limit**
(`COMPUTE_MAX_*`):

- **Up to the limit**, a step costs its share of the way there: half the step price at half the
  limit, never less than half, and the full step price at the limit.
- **From the limit to 125% of it**, the price climbs smoothly to 4× the step price.
- **Past 125%**, it doubles every further 5% of the limit.

A purchase costs the area under that curve, so buying four steps at once costs the same as four
single steps. The curve's shape (50% floor, 125% soft limit, 4× multiplier, 5% doubling) is fixed
in the config file and has no `.env` key. One purchase can be at most 50 steps.

### How admins grant credits and tokens

Open Admin › Users, edit the user and open the **Economy** tab. **Set credits** and **Set
tokens** ask for the new balance and an optional note (a ticket number is enough). The
difference is written to the ledger as an adjustment, "Adjusted by *admin* — *note*", so the
balance and its history always agree. Setting a balance to its current value writes nothing.
Anyone who may edit the user may adjust their balances. Balances go up to 1,000,000,000.

There is no screen for granting Plus or PlusPlus. To give someone Plus, set their token balance
to the price and let them buy it.

## Requirements

- `plugged_host.requires`: `plugged-host-core`.
- `plugged_host.optional`: `plugged-host-discord` (the Discord tier and credit rewards),
  `plugged-host-ads` (Linkvertise settings for earning tokens, and the PlusPlus ad exemption),
  `plugged-host-queue` (queue priority for Plus and PlusPlus), `plugged-host-devbox` (devbox
  lines on the Plus page).
- [Servers](/plugins/servers/) requires this plugin. Without it nobody has an allowance.
- The tables `user_credits`, `credit_transactions`, `user_tokens`, `token_transactions`,
  `token_claims` and `user_memberships` (run the migrations). The first migration also creates
  `ads_start_gate_events`, which the [Ads](/plugins/ads/) start gate writes to.

## Setup

1. Run the migrations:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan migrate --force
   ```

2. In Admin › Plugins › plugged.host Economy › Settings, set the tiers, limits and step prices
   under **Plans & store prices**, and the starting credits for new accounts.
3. Set the Plus and PlusPlus prices, or turn **Sell Plus and PlusPlus** off.
4. To let users earn tokens, set up Linkvertise in the [Ads](/plugins/ads/) settings
   (**Tokens — Earning**), or set a free daily grant here.

With plugged-host-noprofit enabled, plans, limits and store prices come from noprofit.space
instead, the **Plans & store prices** section is hidden, and credits are kept in sync with
noprofit.space.

## Settings

Admin › Plugins › plugged.host Economy › Settings. Every value is stored in the panel's `.env`.

### Plans & store prices

Only shown while this panel sets the plans (plugged-host-noprofit disabled). CPU is in %, memory
and disk in MB.

| Setting | Default | What it does |
|---|---|---|
| Default tier: CPU, `COMPUTE_DEFAULT_CPU` | `400` | CPU every account starts with. |
| Default tier: memory, `COMPUTE_DEFAULT_MEMORY` | `12288` | Memory every account starts with. |
| Default tier: disk, `COMPUTE_DEFAULT_DISK` | `51200` | Disk every account starts with. |
| Discord tier: CPU, `COMPUTE_DISCORD_CPU` | `400` | CPU while the account's linked Discord account is in your server. Replaces the default tier, it doesn't add to it. |
| Discord tier: memory, `COMPUTE_DISCORD_MEMORY` | `16384` | Memory on the Discord tier. |
| Discord tier: disk, `COMPUTE_DISCORD_DISK` | `51200` | Disk on the Discord tier. |
| Limit: CPU, `COMPUTE_MAX_CPU` | `600` | Where a CPU step reaches its full price. Not a cap. |
| Limit: memory, `COMPUTE_MAX_MEMORY` | `24576` | Where a memory step reaches its full price. Not a cap. |
| Limit: disk, `COMPUTE_MAX_DISK` | `102400` | Where a disk step reaches its full price. Not a cap. |
| CPU sold per step, `COMPUTE_CPU_STEP` | `50` | CPU (%) in one step. `0` stops selling CPU. |
| Memory sold per step, `COMPUTE_MEMORY_STEP` | `1024` | Memory (MB) in one step. `0` stops selling memory. |
| Disk sold per step, `COMPUTE_DISK_STEP` | `5120` | Disk (MB) in one step. `0` stops selling disk. |
| CPU step price, `COMPUTE_CPU_PRICE` | `100` | Credits for one CPU step at the limit. |
| Memory step price, `COMPUTE_MEMORY_PRICE` | `150` | Credits for one memory step at the limit. |
| Disk step price, `COMPUTE_DISK_PRICE` | `75` | Credits for one disk step at the limit. |
| Starting credits for new accounts, `CREDITS_STARTING_BALANCE` | `0` | Credits added when a user account is created (while credits are on). |

### Credits & Resource Store

| Setting | Default | What it does |
|---|---|---|
| Enable credits & resource store, `CREDITS_ENABLED` | `true` | Off closes the Resource Store page and the purchase API, stops paying PlusPlus with credits, and grants no starting credits. Balances are kept. |
| Repossess purchased resources on clawback, `CREDITS_RECLAIM_RESOURCES` | `true` | When a reversed reward can't be covered by the balance, sell bought resources back at today's price, only out of unused headroom. Off leaves resources alone and carries the whole rest as debt. |

### Tokens

| Setting | Default | What it does |
|---|---|---|
| Enable tokens, `TOKENS_ENABLED` | `true` | Off hides every token surface (including the Tokens page) and stops selling Plus and PlusPlus for tokens. Balances are kept. |
| Free tokens per day, `TOKENS_DAILY_GRANT` | `0` | Tokens each user gets once a day, the first time their balance is read that day. `0` means tokens must be earned. |

### Plus & PlusPlus

The section title starts with your panel's name (`APP_NAME`).

| Setting | Default | What it does |
|---|---|---|
| Sell Plus and PlusPlus, `MEMBERSHIP_ENABLED` | `true` | Off stops selling and hides the Plus page. What people already have keeps working. |
| Plus (tokens, once), `PLUS_TOKEN_COST` | `25` | Price of Plus in tokens. |
| PlusPlus CPU bonus (%), `PLUSPLUS_CPU_BONUS` | `50` | CPU added to the account's allowance while PlusPlus runs. 0-1000. |
| Plus neo (AI) usage (% of free), `PLUS_AI_PERCENT` | `125` | neo limits for Plus, as a percentage of the free limits. 100-1000. |
| PlusPlus neo (AI) usage (% of Plus), `PLUSPLUS_AI_PERCENT` | `125` | Applied on top of Plus (125 × 125 = 156%). 100-1000. |
| PlusPlus price in tokens, `PLUSPLUS_TOKEN_COST` | `10` | Tokens for one PlusPlus period paid in tokens. |
| Days for the token price, `PLUSPLUS_TOKEN_DAYS` | `7` | Days that period lasts. The Plus page shows it as weeks when it is a whole number of weeks, otherwise as days. |
| PlusPlus price in credits, `PLUSPLUS_CREDIT_COST` | `150` | Credits for one PlusPlus period paid in credits. |
| Days for the credit price, `PLUSPLUS_CREDIT_DAYS` | `14` | Days that period lasts. Shown on the Plus page the same way. |

The settings for earning tokens (`ADS_START_LINKVERTISE_*`, `ADS_START_CLAIM_TTL`) belong to the
Ads plugin; see [Ads](/plugins/ads/). The earn page reads them even when the Ads plugin is
disabled.

## Commands

| Command | What it does |
|---|---|
| `plugged-host:credits-reset --dry-run` | Shows what a reset would change. |
| `plugged-host:credits-reset --force` | Sets every credit balance and every Discord invite counter to zero and deletes the tracked invite joins. Bought resources, boost counters and the ledger are kept, and the reset is written into the ledger per user. Without `--dry-run` or `--force` it refuses to run. Token balances are not touched. |

Run as `sudo -u www-data php artisan <command>` from `/var/www/pelican`. The plugin puts nothing
on the scheduler; the PlusPlus expiry runs in [Servers](/plugins/servers/).

## Notes

- `COMPUTE_MAX_*` is not a cap. An account can buy past it; each step just costs more.
- Lowering a tier doesn't shrink existing servers on a standalone panel. The account is shown as
  over its allowance and can't grow servers until it is back under. With plugged-host-noprofit,
  a lower base takes resources off the servers (see [Servers](/plugins/servers/)).
- With a price of `0`, Plus or PlusPlus is free, even with tokens switched off.
- The store's hint about inviting people to "our Discord server" is text in the plugin's
  `lang/en/strings.php` (and `lang/de/`), not a setting.
- Never change a balance in the database directly. The ledger's `balance_after` column would
  stop matching. Use the Economy tab.
