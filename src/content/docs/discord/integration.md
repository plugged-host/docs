---
title: Discord integration
description: Link panel accounts to Discord, add a tier for members of your Discord server, pay credits for boosts and invites, and run the panel's Discord bots.
---

The Discord integration ties your Discord server to the panel. Users link their Discord account,
being in the server adds a tier to their allowance, every boost level pays credits once, and
friends they invite who stay pay credits too. A bot records who joined through whose invite and
answers `/invites`, `/topinvites` and `/setboost`. The same settings tab holds the tokens of the
panel's two other bots: [neo on Discord](/ai/neo-discord/) and [rux](/discord/rux/). Users see
Account › Discord Rewards; admins set everything up in Admin › Settings › Accounts › Discord.

## What it does

### Linking

- A user's Discord account is the one they link in Account › OAuth Links, through the OAuth
  provider you pick as **Discord Sign-in**. One Discord account per panel account.
- Admin › Users shows a **Discord** column with the linked account's name (its id in the tooltip,
  a click copies it). The user search also finds users by Discord id or name.

### Membership and the Discord tier

- The panel asks Discord whether each linked account is in your server: every five minutes for
  the 250 accounts checked longest ago, when the bot sees a join, leave or member update, when a
  user presses **Check for new rewards**, and when a server owner adds a subdomain.
- Members get the **Discord Tier** (CPU, memory, disk) added to their allowance, where the
  allowance has a limit.
- Losing the tier records an [allowance cut](/servers/allowance-cuts/), so the user's servers give
  back what is over, like any smaller allowance. This happens when the member leaves the server,
  when they unlink Discord (at the next check; the allowance itself drops at once) and when you
  lower the tier (every member who owns a server gets a cut of the difference).
- Only Discord answering "unknown member" counts as having left. A timeout, a Discord outage, a
  rate limit or a refused token changes nothing, so an outage never takes a tier away.

### Boost rewards

- Discord says whether a member boosts, not how often. The boost level is 0 while not boosting, 2
  with the **Two-Boost Role** or after `/setboost` set 2, else 1.
- Each level pays once per Discord account and once per panel account: level 1 pays **One Boost**,
  level 2 pays **Two Boosts** minus One Boost (Two Boosts is the total). Stopping and boosting again
  pays nothing new.
- A member who stops boosting loses the two-boost role.

### Invite rewards

- The bot keeps every invite code's use count. When someone joins, the code whose count went up is
  the one they used, and its creator is the inviter. Vanity URLs, widget joins and joins the bot
  missed count for nobody.
- A join counts when the Discord account was at least **Minimum Account Age** days old and it is
  not the inviter's own account. It pays **Credits per Invite** after **Hold** hours, once the panel
  has checked with Discord that the member is still there. A member who left by then pays nothing.
- Joins of inviters who have not linked Discord yet wait until they link.
- With **Take Back** on, a paid invite whose member leaves later is taken back from the inviter's
  balance. What the balance cannot cover is owed and comes off their next invite rewards (Owed back
  on the page).
- Coming back counts as a new join through the invite used this time. A taken-back invite can pay
  again, a paid one cannot.
- Once an hour the panel asks Discord about the members still counted and records the leaves the
  bot missed while it was offline.

### The Discord Rewards page

Account › Discord Rewards (in the account menu while the integration is on) shows:

- without a link: what Discord earns and where to link, with **Join the Discord server**;
- with a link: the credits earned on Discord, the linked name, whether it is in the server and what
  the tier adds, and **Check for new rewards** (once a minute per account);
- **Invite friends**: the rules, then Paid, Waiting (with the next payout), Left the server, Did not
  count and Owed back;
- **Boost the server**: the two levels and which ones were paid;
- the reward history.

Without credits (Admin › Settings › Economy) the page counts invites and boosts and leaves out the
amounts and the history.

### Bot commands

The **Invite and Boost Bot** adds three slash commands to your server. Replies are embeds in the
panel's name; credit amounts show only while credits are on.

| Command | Who | What it does |
|---|---|---|
| `/invites [user]` | Everyone | A member's invites and rewards (yours when left out) |
| `/topinvites [limit]` | Everyone | The members who brought the most people (up to 25) |
| `/setboost user count` | Administrators | Sets how often a member boosts (0, 1 or 2): gives or takes the two-boost role and pays the levels a linked account reaches |

`/setboost` is hidden from members without Discord's Administrator permission, and the panel checks
that permission again when it runs. A member Discord does not show as boosting stays at 0, and the
reply says so. The commands are created or updated one by one by name, so commands other software
made on the same application stay.

### The bots and the gateway

The panel runs up to three bots, each with its own switch, all off by default:

| Bot | Token | Runs | Gateway intents |
|---|---|---|---|
| Invite and Boost Bot | Bot Token | Invites, joins, leaves, boosts, the commands above | Guilds, Server Members, Guild Invites |
| Assistant Bot | Assistant Bot Token | [neo on Discord](/ai/neo-discord/) | Guilds, Guild Messages, Direct Messages; Message Content with name calls on |
| Moderation Bot | Moderation Bot Token | [rux](/discord/rux/) | Guilds, Guild Messages, Direct Messages, Message Content |

- The bots connect only on the panel instance with `APP_PRIMARY=true` (the default). The
  `discord_gateway` task checks every 15 seconds which bots should run, connects them and closes
  the ones you switched off or whose token or server changed.
- Bots that share a token share one connection, with their intents added up.
- A wrong token or refused intents stop the bot. It tries again after an hour, or at once when you
  change its token or the Server ID.
- When Discord refuses a privileged intent (Server Members or Message Content is off in the
  Developer Portal), the bot reconnects without both: joins and leaves are missed, and rux only
  reads DMs and @mentions, until you turn the intent on.
- **Bot Status** at the bottom of the tab shows each running bot: `connected as <name>`,
  `connecting`, or refused with the reason (the token is wrong, the intents are not allowed,
  Discord closed the connection, or Server Members intent off).

### Subdomains

Two switches gate new [subdomains](/servers/subdomains/) on Discord:

- **Linked Discord Required**: a server's owner needs a linked Discord account.
- **Server Membership Required**: the owner's Discord account must be in your server. Needs the Bot
  Token; ignored without it.

They are checked when a subdomain is created. The server's Subdomains page shows the reason and
closes adding. Existing subdomains stay, and renaming them is not gated.

## Requirements

- A Discord application with a bot in your server (Discord Developer Portal). The Bot Token is
  needed for every membership check, the tier, boosts and Server Membership Required. Without it
  the panel only links accounts.
- The **Server Members Intent** on that bot, for joins, leaves and invites.
- An OAuth provider for Discord (Admin › OAuth Providers) picked as Discord Sign-in. It can use the
  same application as the bot. Without it users cannot link, and nothing is checked or paid.
- Credits on (Admin › Settings › Economy, see [credits and tokens](/economy/credits-and-tokens/))
  for any reward to be paid. Without them invites and boosts are counted only.
- The Invite and Boost Bot switched on for invite rewards and the commands. Membership checks and
  the tier work without it.

## Setup

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create a **New
   Application** (or use an existing one).
2. Open **Bot**, click **Reset Token** and copy the token. Under **Privileged Gateway Intents**,
   turn on **Server Members Intent** and save.
3. Open **OAuth2** and copy the **Client ID** and the **Client Secret** (Reset Secret if you have
   none).
4. In the panel, Admin › OAuth Providers › Create, fill in:

   | Field | Value |
   |---|---|
   | Name | Discord |
   | Client Id, Client Secret | From step 3 |
   | Auth URL | `https://discord.com/oauth2/authorize` |
   | Token URL | `https://discord.com/api/oauth2/token` |
   | Info URL | `https://discord.com/api/users/@me` |
   | Scopes | `identify`, `email` |
   | Identifier Path | `$.id` |
   | Email Path | `$.email` |
   | Username Path | `$.username` |
   | Avatar URL Template | Optional: `https://cdn.discordapp.com/avatars/{$.id}/{$.avatar}.png` |
   | Link Viewable to User, Link Manageable by User | On |
   | Enabled | On |

   The Identifier Path must point at the Discord user id: every check and payout matches on it.
   Save. Upstream's [OAuth guide](https://calagopus.com/docs/additional/setting-up-oauth/) explains
   the other fields.
5. The provider's page now shows the **Redirect URL**, one per panel URL:
   `https://panel.example.com/api/auth/oauth/<provider uuid>`. In the Developer Portal, OAuth2 ›
   Redirects, add each of them and save.
6. Invite the bot to your server with the `bot` and `applications.commands` scopes and the
   permissions **Manage Server** (to read the invites) and **Manage Roles** (for the two-boost
   role):

   ```text
   https://discord.com/oauth2/authorize?client_id=<application id>&scope=bot%20applications.commands&permissions=268435488
   ```

   The application id is the Client ID. In Server Settings › Roles, drag the bot's role above the
   two-boost role, or Discord refuses to give it.
7. In Discord, turn on Developer Mode (User Settings › Advanced). Right-click your server › Copy
   Server ID, and the two-boost role (if you use one) › Copy Role ID.
8. Admin › Settings › Accounts › Discord: switch **Discord** on, fill in **Server ID**, **Bot Token**
   and **Invite Link** (`https://discord.gg/<your-invite>`), pick the provider from step 4 as
   **Discord Sign-in**, set the tier and the rewards, and switch on **Invite and Boost Bot**. Save.
9. Within about 15 seconds, Bot Status shows `Invite and boost bot: connected as <bot>` and the
   three commands appear in your server.
10. Link a test account in Account › OAuth Links, open Account › Discord Rewards and press **Check
    for new rewards**: it shows "In the server" and the tier.

## Settings

Admin › Settings › Accounts › Discord. Tokens are stored encrypted and never shown again; leave a
token field empty to keep the stored one.

| Setting | Default | What it does |
|---|---|---|
| Discord | Off | Turns the integration on (needs the Server ID). Off: no Discord Rewards page, no bots |
| Server ID | Empty | Your Discord server's id (15 to 20 digits) |
| Bot Token | Empty | The Invite and Boost Bot's token; also used for membership checks |
| Invite Link | Empty | Where users join (`https://` only). Empty hides every invite link and button |
| Discord Sign-in | None | The OAuth provider users link Discord through |

### Discord Tier

| Setting | Default | What it does |
|---|---|---|
| CPU | 0 | % added to members' allowance (100 is one thread), up to 3200 |
| Memory | 0 | MiB added, up to 262144 |
| Disk | 0 | MiB added, up to 1048576 |

### Invite Rewards

| Setting | Default | What it does |
|---|---|---|
| Credits per Invite | 50 | Paid for each member who joins through an invite and stays (0 to 1000000) |
| Minimum Account Age | 30 | Days. Younger Discord accounts pay nothing (0 to 3650) |
| Hold | 6 | Hours before an invite pays (0 to 720). 0 pays at once |
| Take Back | On | Takes a paid invite back when the member leaves |

### Boost Rewards

| Setting | Default | What it does |
|---|---|---|
| One Boost | 500 | Credits for the first boost level |
| Two Boosts | 1250 | Credits for both levels in all |
| Two-Boost Role ID | Empty | Members with this role count as two boosts. Empty: two boosts only through `/setboost` |

### Subdomains

| Setting | Default | What it does |
|---|---|---|
| Linked Discord Required | Off | New subdomains need a linked Discord account |
| Server Membership Required | Off | New subdomains need the owner in your server (needs the Bot Token) |

### Bots

| Setting | Default | What it does |
|---|---|---|
| Invite and Boost Bot | Off | Runs on the Bot Token: invites, boosts, the slash commands |
| Assistant Bot, Assistant Bot Token | Off, empty | Runs [neo on Discord](/ai/neo-discord/) on its own token |
| Moderation Bot, Moderation Bot Token | Off, empty | Runs [rux](/discord/rux/) on its own token |

## Permissions

| Permission | Kind | What it allows |
|---|---|---|
| `discord.read` | Account (API key scope) | Viewing the account's Discord membership, invites, boosts and rewards |
| `discord.check` | Account (API key scope) | Asking Discord for new rewards now |

## Background tasks

They run on the instance with `APP_PRIMARY=true` only.

| Task | When | What it does |
|---|---|---|
| `discord_gateway` | Every 15 seconds | Starts and stops the bots' connections |
| `sync_discord_members` | Every 5 minutes | Checks membership, boosts and the tier of 250 linked accounts |
| `settle_discord_invites` | Every 5 minutes | Pays matured invites, 100 per run (credits on) |
| `reconcile_discord_invites` | Hourly | Finds leaves the bot missed, 200 per run |

## Notes

- Changing **Discord Sign-in** to another provider: only links made through the new provider count.
  Members who have not linked through it lose the tier at once, and the next check records an
  allowance cut for them.
- Switching Discord off or clearing Discord Sign-in takes the tier away from everyone: members who
  own servers get an allowance cut of the tier when you save.
- Run only one instance with `APP_PRIMARY=true`. Two primary instances connect every bot twice.
- Switching Discord off removes Account › Discord Rewards and disconnects every bot.
- With noprofit.space connected, users link Discord on noprofit.space and membership, the tier and
  boost rewards are noprofit.space's; the panel still counts invites and pays them to the
  noprofit.space balance. See [noprofit.space](/accounts/noprofit/).
