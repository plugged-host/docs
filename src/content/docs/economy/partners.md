---
title: Partner program
description: Let Discord communities of FiveM and Minecraft servers apply as partners and earn credits every month once an admin approves them.
---

The partner program pays communities that tell their members about your host. A community that runs
a Discord server for a FiveM or Minecraft server applies on Account › Partners; the moderation bot
checks the Discord server (its size, that the applicant owns or administers it, and a channel about
the host), neo suggests whether to accept it and how much to pay, and an admin decides. Approved
partners get credits every month for as long as their server keeps qualifying. Nothing is paid
without an admin's approval.

## What it does

### Applying

Users see Account › Partners while the program is on, and a link to it from Discord Rewards and
the Resource Store's credits card. They can apply while the program is also open (see
[Requirements](#requirements)).

The page lists what a Discord server needs before the form, and each is checked again before every
payment:

| Requirement | How it is checked |
|---|---|
| The applicant's Discord account is linked | Through the Discord Sign-in provider (Account › OAuth Links), or noprofit.space's link |
| The bot is in the server | The page has an **Add** button that invites the bot with no permissions |
| At least Minimum Members members | Discord's approximate member count, bots included |
| The applicant owns the server or has Administrator | The server's owner, or the applicant's roles (and @everyone) include Administrator |
| A channel about the host, while Channel About the Host is on | See [the channel](#the-channel-about-the-host) |

The form takes an invite link (`discord.gg/...`, `discord.com/invite/...`) or the server ID, the
game (FiveM, Minecraft or both), a description (20 to 1000 characters) and up to 10 of the
applicant's servers on the panel. An expiring invite works: later checks use the server ID.

A refused application is not stored; the page explains each problem in the user's language, with
the bot's invite button when the bot is missing.

Limits:

- one pending application per account;
- one live partnership (pending, approved, paused or suspended) per Discord server;
- after a rejection or a revoked partnership, neither the account nor that Discord server may apply
  again for Cooldown After Rejection days;
- 6 applications in 10 minutes per account.

A partner may hold partnerships for several Discord servers, one application at a time.

### The channel about the host

What partners give back is a channel that tells their members about the host. No banner, role or
posting schedule is asked for.

- A text, announcement or forum channel.
- Visible to @everyone: the @everyone role's permissions with the channel's @everyone overwrite
  must include View Channel. A channel that only some roles or members can see does not count.
- Its name or topic contains the panel's name (Admin › Settings › General › Application) or one of
  Other Channel Names. Both are compared by their letters and digits only, lower-cased, so
  `#example-host`, `#examplehost` and a topic "Hosted by Example Host" all match a panel named
  "example.host". Names shorter than 3 letters and digits are ignored.
- When Required Links has entries, the channel's **topic** must also contain one of them, compared
  the same way (`https://panel.example.com/` matches `panel.example.com`).

The panel looks at the topic, not at messages: reading a topic needs nothing beyond seeing the
channel, while messages would need more permissions and change all the time. Forum channels have a
topic too (their guidelines). The panel finds the channel itself; there is no picker. The admin view
shows the channel that qualified, or the one that came closest.

### neo's assessment

On every new application, and when an admin uses **Check Again** on a pending one, neo reads the
application and answers with accept or reject, a monthly amount and short reasons. The amount is
kept between Minimum and Maximum Credits per Month. The Discord server's name, the description and
the applicant's text are passed to neo as untrusted text, never as instructions. **Guidance for
neo** is added to what neo is told.

When neo is off, busy or unavailable, or answers something unusable, Admin › Partners shows "No
assessment" with the reason. neo only suggests: its verdict and reasons are shown to admins only,
never to the applicant, and approving always needs an admin.

### Admin › Partners

Pending applications come first (oldest first), then suspended and failing partnerships, then the
rest by date. Filter by status (or All partnerships) and search by server name, server ID or
applicant.

A row opens the details: the Discord server (members, online, created, boosts, verification, the
applicant's [standing](/safety/standing/), the channel, the problems the last check found), the
application, neo's suggestion and reasons, the decision, the monthly credits, the next payment, when
a failing partnership will be suspended, and the payments.

| Action | From | Does |
|---|---|---|
| Approve | pending | The amount is prefilled with neo's suggestion (0 without one), up to Maximum Credits per Month. Pays the first month at once; the next payment is a month later |
| Reject | pending | A reason the applicant sees (required). Starts the cooldown |
| Check Again | any open one | Checks the server now; on a pending one neo assesses it again |
| Change Credits | approved, paused, suspended | The amount from the next payment on |
| Pause Payments | approved, suspended | An optional reason the partner sees; nothing is paid until resumed |
| Resume Payments | paused, suspended | Back to approved; the payment day stays if it is still ahead, else the next one from today |
| Revoke | approved, paused, suspended | A reason the partner sees (required). Payments stop, paid credits are kept. Starts the cooldown |

Admin activity: `partners:application.approve`, `.reject`, `.recheck`, `.credits`, `.pause`,
`.resume`, `.revoke`. The applicant's activity: `account:partners.apply`, `.withdraw`, `.check`.

### Monthly credits

A partnership is paid once a month, the first month on approval. Every 15 minutes the
`settle_partners` task takes the approved partnerships whose payment day has come and, for each:

1. Checks the Discord server again: the bot reaches it, the members, owner or Administrator, the
   channel.
2. **Passed**: pays the month and moves the payment day on a month (the 31st becomes the month's
   last day).
3. **Failed**: the month waits. The partner is notified with the date it will be suspended, and the
   partnership shows as failing on Admin › Partners. The check is repeated every 6 hours. A pass
   within Grace Period days pays the held month. Past the grace period the partnership is
   **suspended**, and the partner and admins are notified. A grace period of 0 suspends on the first
   failure.
4. A suspended partnership is checked again once a day. A pass (or the partner's or an admin's
   Check Again) lifts the suspension; the next payment day is the next one ahead.

When Discord itself cannot be reached nobody fails: the partnership is tried again on the next
round. Every month is paid at most once per partnership, even if two rounds run at the same time.
Months missed while a partnership was paused or suspended, or while the program, credits or the bot
were off, are not paid back.

The credits show in the partner's credit history as "Partner program". On Account › Partners the
partner sees the monthly amount, the next payment date, a held month with the date it will be
suspended and what is wrong, the last 12 payments and the total, and **Check Again** while it is
failing or suspended (5 times an hour). The reasons an admin gave for a rejection, a pause or a
revocation are shown; neo's reasoning never is.

### Notifications

Partners get [notifications](/accounts/notifications/) when they are approved, rejected, revoked,
paid, paused or resumed, when their monthly amount changes, when a check fails, and when they are
suspended. Admins with `partners.manage` get one for every new application and every suspended
partnership.

## Requirements

Applications are open only while all of these hold:

- **Credits** are on (Admin › Settings › Economy › Resource Store). Partners are paid in credits.
- A **Moderation Bot Token** is set in Admin › Settings › Accounts › Discord: the bot that
  [rux](/discord/rux/) runs on. It does not need to be connected; the checks use Discord's API with
  its token. Create it as a bot in the Discord Developer Portal; the panel takes the bot's
  application from the token for the invite link.
- The panel can tell a user's Discord account: **Discord Sign-in** is set in Admin › Settings ›
  Accounts › Discord (an OAuth provider for Discord, Admin › OAuth Providers), or noprofit.space is
  connected.

For neo's assessment, neo has to be on and set up ([neo](/ai/neo/)). Without it every application
shows "No assessment" and admins decide alone.

## Setup

1. Turn on credits: Admin › Settings › Economy › Resource Store › **Credits**.
2. Set the bot: Admin › Settings › Accounts › Discord › **Moderation Bot Token** (see
   [Discord](/discord/integration/)).
3. Let users link Discord: create a Discord OAuth provider in Admin › OAuth Providers and pick it
   as **Discord Sign-in** in Admin › Settings › Accounts › Discord.
4. Admin › Settings › Economy › Partners: set Minimum Members, the monthly bounds, the grace period
   and the cooldown, and add **Other Channel Names** and **Required Links** if you want them.
5. Optional: write **Guidance for neo**, what you look for in partners.
6. Turn on **Partner Program** and save. Account › Partners appears for users; while something
   from Requirements is missing it says applications are closed.

## Settings

### Admin › Settings › Economy › Partners

| Setting | Default | What it does |
|---|---|---|
| Partner Program | off | Shows Account › Partners and lets users apply |
| Minimum Members | 500 | Members the Discord server needs, as Discord counts them. 1 to 10000000 |
| Minimum Credits per Month | 500 | The lowest monthly amount neo may suggest and an admin may set. Not above the maximum |
| Maximum Credits per Month | 5000 | The highest monthly amount neo may suggest and an admin may set. Up to 10000000 |
| Grace Period (Days) | 7 | After a failed monthly check the payment waits this long for a fix, then the partnership is suspended. 0 suspends at once. Up to 60 |
| Cooldown After Rejection (Days) | 30 | Days before a rejected or revoked applicant, or that Discord server, may apply again. 0 allows it at once. Up to 365 |
| Channel About the Host | on | Partners need a channel @everyone can see, with the panel's name or one of the names below in its name or topic |
| Other Channel Names | empty | One per line or comma separated, at most 20, compared by letters and digits only. The panel's name always counts |
| Required Links | empty | One per line, such as `panel.example.com`. When set, the channel's topic must contain one. Empty: no link needed |
| neo's Assessment | on | neo suggests accepting or rejecting each application, with a monthly amount |
| Guidance for neo | empty | What you look for in partners, given to neo with every application. Up to 2000 characters |

Other Channel Names and Required Links take up to 500 characters each.

## Permissions

Account permissions (API key scopes):

| Permission | Allows |
|---|---|
| `partners.read` | Viewing the account's partner applications and partnerships |
| `partners.apply` | Applying with a Discord server and withdrawing a pending application |

Admin role permissions:

| Permission | Allows |
|---|---|
| `partners.read` | Viewing partner applications, the Discord servers' facts and neo's assessment |
| `partners.manage` | Approving (which pays the credits), rejecting, checking again, changing, pausing, resuming and revoking partnerships |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `settle_partners` | every 15 minutes | Checks and pays partnerships whose payment day came (50 per round), re-checks failing ones every 6 hours and suspended ones once a day |

Background tasks run only on the panel instance with `APP_PRIMARY=true`.

## Notes

- An admin may set any amount from 0 up to the maximum; only neo's suggestion is kept above the
  minimum.
- The bot is invited with no permissions. Everything it reads is what any member with View Channel
  sees on the channels it can see.
- Users cannot apply while an admin is impersonating them.
- An amount above 0 is refused while credits are off.
- With [noprofit.space](/accounts/noprofit/) connected, partner credits go to the partner's
  noprofit.space account, so approving with an amount needs the partner to have one and
  noprofit.space's account sync to be on. A payment that cannot be made is retried 6 hours later.
