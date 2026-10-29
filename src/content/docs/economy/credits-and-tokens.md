---
title: Credits, tokens and memberships
description: The panel's two currencies, the Resource Store and its sales, the CPX Research survey wall and the token-earning link providers, the daily streak, double tokens, first-week tasks, referrals and profile badges, the two memberships with burst cores, renewals and gifts, and paid panel access.
---

The economy lets users grow their allowance and pay for extras. **Credits** buy CPU, memory and
disk in the Resource Store, for good. **Tokens** are earned by taking surveys (CPX Research),
completing sponsored links, a daily streak, first-week tasks and referrals, and pay for the two
**memberships**, [server upgrades](/servers/server-upgrades/), restores of parked servers, a few
other extras and, if you want, the panel itself. Credits and tokens are separate currencies:
nothing turns one into the other. Users use Account › Resource Store, Account › Tokens and Account ›
Membership; admins set the prices and the token providers and can change any user's balances.

## What it does

### Credits and the Resource Store

- An account's allowance is the games allowance (Admin › Settings › Hosting › Games › Allowance per
  Account) plus what it bought in the store. A resource the allowance does not limit is not sold.
- Account › Resource Store shows, top to bottom: **Unlock more resources**, a closed bar listing the
  upgrades the account has not claimed yet (without noprofit.space, the price of the next memory
  step); **Credits**, the balance and what it buys; **Your resources**, one meter per resource with
  what the servers use, the rest of the limit and where prices get steep, next to offers of 1, 2 and
  4 steps; and the **Credit history**, the last 10 transactions.
- A purchase is confirmed first and sent with the price the user saw. A price that moved since
  buys nothing and the page shows the new prices.
- Prices follow one curve per resource, measured against the store limits (CPU Limit, Memory
  Limit, Disk Limit):
  - up to the limit a step costs its share of the way there (half the step price at half the
    limit, never under Lowest Price), the full step price at the limit;
  - from the limit to the soft limit the price grows smoothly to Price at the Soft Limit times the
    step price;
  - past the soft limit it doubles every Doubling Every percent of the limit.

  A price is the area under the curve, so four steps bought at once cost what four single steps
  would. There is no ceiling.

### Sales

A sale takes a percentage off every price it covers for a while: the Resource Store (the default),
the memberships, or both.

- Set **Discount** (0 is off), a **Name** (empty: "Sale"), what it **Covers**, and optionally
  **Starts** and **Ends**, in your browser's time zone. Without Starts it runs right away; without
  Ends it runs until the discount is set back to 0.
- A sale price is the full price less the discount, rounded half up: 15 tokens at 25 % off is 11.
  100 % makes the offers free.
- While it runs, a banner heads the store ("25% off everything in the store until ...") or the
  Membership page ("25% off every membership until ..."), and every offer shows its full price
  struck through.
- On the memberships it applies to purchases, [gifts](#gifts) and [automatic renewals](#auto-renew),
  and to the second membership's credit price when it has one.
- The window is checked on every visit and purchase: a price shown before the sale started or after
  it ended has moved, so that purchase is refused and the page shows the current prices.

### Tokens, surveys and sponsored links

- Account › Tokens shows the balance, the [daily streak](#daily-streak) and the
  [first-week tasks](#getting-started), what tokens pay for, one row per way to earn (the reward,
  today's count against the cap, and **Earn with ...**), the recent token activity and, at the end,
  the [referral link](#referrals). A running [double-token window](#double-tokens) heads it. The
  [CPX Research](#cpx-research) survey wall, when set up, is the first row, with the page's filled
  button (**Take a survey**): it pays the most.
- **Daily Tokens**, when above 0, are given once a day, the first time the account looks after
  midnight UTC.
- Tokens also pay for, where each is on: [limbo](/starts/limbo/) restores,
  [subdomain](/servers/subdomains/) deposits, [server upgrades](/servers/server-upgrades/), the
  waiting room's [day pass](/economy/ads/#day-pass), one more day of
  [neo](/ai/neo/#extra-usage-for-tokens) usage, [profile badges](#profile-badges) and
  [gifts](#gifts) of a membership.

Earning a token through a link works like this:

1. **Earn with ...** opens a claim bound to the account and sends the user to the provider.
2. The provider sends the user back to `https://panel.example.com/account/tokens?claim=...` with
   a proof that the link was completed.
3. The panel checks, in order: the claim is this account's, still open and younger than **Minutes
   to Finish a Link**; the proof has the right shape and was never used before; today's cap is not
   reached. Only then is the proof itself checked (below), since Linkvertise's check may use it up.
4. The tokens are added and the page shows a toast ("Added: +1 tokens"). Reloading the page that
   came back adds nothing.

Each provider's proof is checked its own way:

| Provider | How the link is made | How the trip is proven |
|---|---|---|
| CPX Research | No link: **Take a survey** opens CPX Research's survey wall in a new tab, signed for the account (no username or email is sent) | CPX's servers call the panel's postback URL, signed with your Secure Hash ([below](#cpx-research)) |
| Linkvertise, link | Your Linkvertise link, with `{return}` or `{return_b64}` replaced by the way back | Linkvertise's anti-bypass API, with your anti-bypass token |
| Linkvertise, Full Script | The Tokens page loads Linkvertise's script, which turns the page's own earn link into a Linkvertise link | The same API |
| Vylo, Cuty, ShrinkEarn, ShrinkMe, AdFoc.us | The panel asks the shortener's API for a short link for every trip, to the way back with a proof only the panel can make | The panel checks its own proof, which names the provider, and that the trip took at least **Shortest Trip** seconds |

### What a link pays

- **Fractions.** Tokens per Link takes up to 2 decimals, for example `1.5`. Balances stay whole
  tokens: each link adds its reward to the account's saved part and pays the whole tokens in it, so
  1.5 pays 1, 2, 1, 2 and so on. The Tokens page shows the saved part ("0.5 tokens saved toward
  your next token"). A link that pays no whole token yet still counts toward the daily cap.
- **Less for each further link of the day.** Advertisers pay less for a person they already showed
  ads to, so each further link a person finishes on the same provider the same day pays **Less per
  Further Link** percent less than the one before, never under **Lowest Reward** percent of the full
  reward. With the defaults (15 and 25) and 1.5 tokens per link: 1.5, 1.28, 1.08, 0.92, 0.78, 0.67,
  0.57, 0.48, 0.41, then 0.38 for every further link. Days start at midnight UTC, per provider. The
  Tokens page shows what the next link pays. Set Less per Further Link to 0 to pay every link in
  full.

### CPX Research

CPX Research is a survey wall, not a link: there is no claim and no way back. CPX works out what
each survey pays in tokens from the **Currency Factor** set in its dashboard and shows it on the
wall. When a survey is finished or taken back, CPX's servers call the panel's postback URL, and the
panel pays or takes back the tokens. They usually arrive within minutes and show when the user
comes back to the Tokens page.

- The Tokens page's row says "Pays what each survey shows" and counts today's finished surveys
  against the cap ("0 of 1 today").
- **Only finished surveys count** toward **Surveys per Day** (days start at midnight UTC). A
  screen-out's small bonus, and other bonuses CPX pays (for a rating, say), are paid and never use
  up the day, so a user who is screened out can try another survey. A finished survey over the cap
  is recorded and pays nothing.
- A survey pays what CPX sends, at most 10 000 tokens per postback. A part of a token is saved on
  the account like a link's. Tokens per Link and Less per Further Link do not apply.
- **Reversals.** When CPX takes a survey back (for fraud found later, say), the panel takes back the
  whole tokens it paid, never more than the balance: what was spent stays spent. A reversed survey
  no longer counts toward its day, and a reversal that arrives before its credit makes the credit
  pay nothing.
- Each postback pays once: CPX sending the same one again adds nothing.
- The panel refuses a postback (403) while Tokens or CPX Research is off, the App ID or Secure Hash
  is missing, or its hash does not match.
- The token history shows "Earned with CPX Research" and "Reversed: CPX Research"; a paid survey is
  logged as `account:tokens.earn`.

### Daily streak

Under the balance on Account › Tokens, **Claim today's tokens** pays once a day (days start at
midnight UTC), with a dot per day of the week.

- A claim the day after the last one is the next day of the streak; a missed day starts again at
  day 1.
- With the default **Tokens per Day**, days 1 to 7 pay 0.25, 0.25, 0.5, 0.5, 0.75, 0.75 and 1
  token, then 1 a day. Parts of a token are saved on the account like a link's and paid as whole
  tokens once they add up.
- While today's tokens wait, the claim is the page's filled button and the sidebar's tokens row has
  a small dot.
- **Daily Tokens** (above) is separate and unchanged.
- The token history shows "Daily streak"; activity `account:tokens.streak`.

### Double tokens

A window in which every sponsored link and every CPX Research survey pays more: **Bonus** percent
(100 doubles them), with a **Name**, **Starts** and **Ends**, set like a [sale](#sales).

- The bonus is added when the tokens are paid: a link of 1.5 tokens pays 3 while the bonus is 100.
  The daily caps count links and surveys as before.
- While it runs, a banner heads the Tokens page ("Double tokens until Sun 22:00", under the name
  when it has one), the links' rows show what they pay now, and the survey row says "Every survey
  pays 100% more right now."
- The daily streak, the first-week tasks and referrals pay what they say, without the bonus.
- [rux](/discord/rux/#tokens) can announce the window on Discord.

### Getting started

For **Days Shown** (14) after sign-up, a "Getting started" list under the balance offers four tasks:
link a Discord account (while Admin › Settings › Accounts › Discord is on), create a server, start
the server, and earn tokens once with a link or a survey.

- Each pays **Tokens per Task** (1) once per account. **Claim** checks the task again; a task not
  done yet has a button to where it is done.
- The list is gone once every task is claimed or the days have passed.
- The token history shows "Getting started"; activity `account:tokens.task`.

### Referrals

Every account has a referral link, `https://panel.example.com/r/<code>`, shown with a copy button
at the end of Account › Tokens with the rule in one line and the friends who signed up with it.

- Opening the link keeps the code in the browser for 30 days and goes to sign-in. A new account made
  by registering, by signing up through an OAuth provider, or (with noprofit.space) by a first
  sign-in that creates a panel user, counts. An existing account never gets a referrer.
- Not counted: the referrer's own account, and a sign-up from the same address as the referrer's
  newest session.
- Once the friend has earned **Friend Earns** tokens (10) themselves (links, surveys, the streak, the
  first-week tasks; not an admin's change), the referrer gets **Tokens per Friend** (5), once per
  friend, and the notification "Referral reward". A survey taken back later does not undo it.
- At most **Paid per Month** friends (10) are paid per referrer in any 30 days; a friend over that
  waits until the window frees up.
- The page lists the newest 50 friends, each with "3 of 10 tokens earned" or "Paid +5". The token
  history shows "Referral".

### Profile badges

Preset badges (Supporter, Early Bird, Night Owl, OG, Builder, Explorer), bought on the Account
page's **Badges** card for **Tokens per Badge** (5) each, for good.

- The account shows one badge, or none (**Show no badge**); the first one bought shows at once.
- The badge sits next to the name in the sidebar, on the subusers list of servers the account is on
  and in their [server chat](/servers/server-chat/).
- Bought badges stay shown when selling them is turned off.
- The token history shows "Profile badge"; activity `account:badge.purchase`.

### Memberships

Two memberships, always the panel's own. Their names are settings (Plus and Premium by default).
Both are bought for a number of days at a time: buying again before one ends adds to the time left,
and nothing renews by itself unless the member turns on [auto-renew](#auto-renew). Neither needs the
other: the second gives everything the first does.

| | First membership | Second membership |
|---|---|---|
| Bought with | tokens, for First Membership: Days | tokens, or credits while Second Membership: Credits is above 0 |
| Location tiers it opens | `plus` | `premium` and `plus` |
| [Start queue](/starts/start-queue/) priority | ahead of everyone without one | ahead of the first membership |
| Burst cores on every server | First Membership: Burst Cores (1) | Second Membership: Burst Cores (2), the total |
| [Ads](/economy/ads/), while Fewer Ads for Members is on | only in the waiting rooms before a start: no banners, popups or in-game messages | none, and no waiting room |
| Archives, unpacking and backups | faster, on the [Wings fork](/nodes/wings/) | faster still |
| [Panel access](#panel-access) | included | included |
| Idle servers ([limbo](/starts/limbo/)) | stopped, parked and deleted like everyone's, unless Spare Members is on | the same |

- A location's tier is set on the location: Admin › Locations › a location › Tier. A location
  without a tier is open to everyone; a tier other than `plus` or `premium` stays closed to
  users. Admins place servers anywhere.
- Account › Membership shows a note while one runs ("Premium is active, it runs until ..."), both
  memberships side by side with a buy button per offer ("30 days · 15 tokens"), what each adds over
  the free tier, and the questions users ask before buying. Buying takes the tokens or credits and
  adds the days in one step, or not at all.
- An offer the balance does not cover says what is missing ("6 more tokens to go") and opens the
  Tokens page (the Resource Store for credits). A purchase is sent with the price the user saw: one
  that moved since (a sale started or ended) buys nothing, and the page shows the new prices.
- Memberships also raise [neo](/ai/neo/)'s usage limits and, while Members Only is on, give
  [devboxes](/servers/devboxes/).
- When a membership runs out, the account's servers on locations it opened are moved to a location
  the owner may still use: off `premium` locations once the second has run out, and off `plus`
  locations too once neither runs. The same country is tried first, then `plus` locations while the
  first still runs, then the fastest. A full location is tried again every minute until no server
  is left on a lost location; buying again before that stops the moves. The owner is notified
  ("Premium has ended"), and burst cores drop to what is left. See
  [moving servers](/servers/moving-servers/).

### Auto-renew

Each membership has a **Renew automatically** switch on its card of the Membership page while it
runs. It is off until its member turns it on.

- In the last 10 minutes before the membership ends (or within an hour after, when the panel could
  not run then), it is bought again at its price then (a sale included), so it never lapses. It is paid with tokens; the second membership is paid with credits
  only when it is sold for credits and not for tokens. The token history says "Premium (30 days),
  renewed automatically".
- When the balance is short, it is tried once per end: the member gets "Couldn't renew …" with how
  much was missing, and the membership ends as usual. Turning the switch off and on again tries
  once more.
- A suspended account is not charged.
- With **Auto-Renew** off in the settings, the switches are hidden and nothing renews; the members'
  choices are kept.

### Ends-soon notices

**Hours Before the End** (48) before a membership ends, the member gets one notification per end:
the date, whether it renews by itself and whether the balance covers it, with **Renew**, which opens
the Membership page. The first membership is not mentioned while the second runs past its end. Paid
[panel access](#panel-access) gets the same notice, with a link to Account › Panel Access, except
for admins, suspended accounts and accounts whose membership runs past the end.

### Gifts

**Gift to a friend**, under the plans on the Membership page, buys a membership for another account:
its username or email (exactly, case aside) and the membership with its term ("Plus · 30 days · 15
tokens").

- The buyer pays the membership's price in tokens (the sale's price while a sale covers the
  memberships), after a confirmation. Only memberships are given, never tokens.
- The friend's membership is extended as after a purchase, and they get the notification "{user}
  gave you Plus". Both token histories show the gift.
- Gifts go only to an existing account that is not suspended and not the buyer's own.
- **Gifts per Day** (10) limits each buyer over the last 24 hours; the page says how many are left
  today.
- Activity: `account:membership.gift` for the buyer, `account:membership.gifted` for the friend.

### Included with the second membership

The second membership can include a membership on another panel, and that panel's second
membership can include the first one here. plugged.host pairs it with switched.cloud: Premium here
includes switched.cloud Plus, and switched.cloud Premium includes Plus here. Both panels know an
account by its noprofit.space account, so this needs [noprofit.space](/accounts/noprofit/)
connected; it is off until set up with the other panel's address and a shared secret.

- Within a minute of every change to the second membership of an account linked to noprofit.space
  (bought, given, renewed, set or ended by an admin), the panel sends its end to the other panel,
  and once a day every one that runs. A send that fails is tried again the next minute.
- While it runs, the Membership page lists "switched.cloud Plus included" (the **Name** setting)
  under the second membership.
- The other way round, an account whose membership on the other panel includes it gets the first
  membership here until that end, with everything the first membership gives. The Membership page
  says "Plus is included with your switched.cloud Premium until …", and Admin › Users › a user ›
  Economy shows it read-only. An account that has not signed in here yet gets it within a minute of
  its first sign-in. While it runs past the end of a first membership bought here, that one gets no
  ends-soon notice and does not renew by itself.
- When it ends, it ends like the first membership: servers leave the `plus` locations unless a
  membership bought here still runs.
- Turned off on either side, nothing more is sent or taken: what was given runs until the last end
  received.

### Burst cores

Burst cores are CPU above a server's paid limit, 100 % per core, that the server uses while its
node has CPU to spare: a game's startup or a busy evening runs faster without buying more.

- Every server of the account gets them. Servers with unlimited CPU get nothing added.
- They are outside the allowance, the store and its prices. Admin › Nodes and the allowance count
  the paid CPU only.
- Wings gets the paid limit plus 100 per burst core as the server's CPU limit, applied live to
  running servers right after a membership change (or within a minute, if that sync failed).
- On the [Wings fork](/nodes/wings/), a server with burst cores also gets more threads for
  archiving, unpacking and backups, so members' archives and backups finish faster.
- The server card, the console's CPU card and the CPU graph show "paid + burst".

### Panel access

The panel itself can cost tokens. One payment buys **Days per Payment** of access for **Tokens per
Month**, added to what is left, so paying early loses nothing. Admins and both memberships never
pay.

An account that has to pay can still use its account pages (profile, settings, tokens and earning,
balance, memberships, panel access, logout). Every server page and server API call sends it to
Account › Panel Access until it pays. While Offers Where a Limit Is Felt is on
([ads](/economy/ads/#offers-where-a-limit-is-felt)), that page also says both memberships include
the panel, with a link to the first. Before paid access ends, the account gets an
[ends-soon notice](#ends-soon-notices).

### The sidebar card

Over the sidebar's footer, a card shows one row per limited resource of the account (used and
limit, red at the limit) and a row with the tokens and credits. Usage and credits lead to the
Resource Store, tokens to the Tokens page; the tokens show a small dot while today's
[streak](#daily-streak) tokens wait. Under them, a line counts the tokens toward the cheapest
membership bought with tokens that the account does not have ("9 / 15 to Plus", over a thin bar;
"Enough for Plus" once the balance covers it), linking to the Membership page. Members of the
second membership see no such line.

### Admins

Admin › Users › a user › Economy shows the user's credits, tokens, what was earned, both
memberships (and whether each renews automatically), a membership included from the other panel,
who brought the account and how many friends it brought, what the store sold and both histories.
Add or take away credits and tokens with a reason the user sees, and set the end of either
membership or end it now. A deduction may not take a balance below zero.

Activity: `account:store.purchase`, `account:membership.plus`, `account:membership.plusplus`,
`account:membership.auto-renew`, `account:membership.gift`, `account:membership.gifted`,
`account:tokens.earn`, `account:tokens.streak`, `account:tokens.task`, `account:badge.purchase` for
the user, `user:economy` for the admin.

## Requirements

- An account at each token provider you turn on, and its keys (see [Setup](#set-up-the-token-providers)).
- The panel's URL (Admin › Settings › General › Application) set to its public `https://` address.
  Every link provider sends users back to it, and CPX Research's postback URL is built from it.
- For CPX Research, CPX's servers must reach `https://panel.example.com/api/earn/cpx-research`: a
  proxy, CDN or firewall in front of the panel must let them through (CPX's dashboard lists the
  addresses its postbacks come from).
- Allowance limits in Admin › Settings › Hosting › Games for the Resource Store to sell anything
  (without noprofit.space).
- Location tiers for the memberships to open anything.
- Burst cores work on stock Wings. The [Wings fork](/nodes/wings/) also gives each container a CPU
  weight from its paid limit alone, so paid CPU wins over burst when the node is busy, leaves burst
  out of the node's allocated CPU, and gives servers with burst cores the faster archives,
  unpacking and backups. On stock Wings every container weighs the same and every server archives
  at the same speed.

## Setup

### Credits and the store

1. Admin › Settings › Hosting › Games: set **Allowance per Account** (CPU, memory, disk). A
   resource left at 0 has no limit and is not sold.
2. Admin › Settings › Economy › Resource Store: turn on **Credits**, set **Starting Credits** if new
   accounts should get some, and the step sizes, step prices and limits under **Prices**. Save.

### Memberships

1. Admin › Locations: set **Tier** to `plus` or `premium` on the locations the memberships open.
2. Admin › Settings › Economy › Memberships: turn on **Memberships**, name them, and set their
   prices, days and burst cores. Save.

**The included membership** (only with noprofit.space connected on both panels):

1. Admin › Settings › Economy › Memberships › Included With the Second Membership: turn on
   **Include a Membership on Another Panel**, check **Panel URL**, **Name** and **Their Second
   Membership's Name**, and enter a **Shared Secret** of at least 32 characters. Save.
2. Set up the other panel with the same secret and this panel's address.
3. Give a linked test account the second membership in Admin › Users › a user › Economy: within a
   minute the other panel shows the included membership.

### Set up the token providers

Turn on **Tokens** in Admin › Settings › Economy › Tokens, then set up one or more providers in the
same tab, under **Earning Tokens**. A provider's fields appear once its switch is on, and it shows
on the Tokens page once its key is stored. Each link provider has **Tokens per Link** and **Links
per Day**; the shorteners also have **Shortest Trip**. CPX Research has **Surveys per Day** instead.

**CPX Research**

1. Create a publisher account at CPX Research (`cpx-research.com`) and add an app for the panel.
2. In the app's **Reward Settings**, name the currency Token (plural Tokens) and set the **Currency
   Factor**: the tokens a dollar of your earnings is worth. That is what the wall shows for each
   survey and what it pays.
3. Turn on **CPX Research**, and copy the App ID and the Secure Hash from the app's page into **CPX
   Research App ID** and **CPX Research Secure Hash**. Set **Surveys per Day** and save.
4. Click the **Postback URL** shown under the fields (it is copied) and paste it into the app's
   **Postback Settings** at CPX Research. It looks like this; CPX fills in the `{...}` parts:

   ```text
   https://panel.example.com/api/earn/cpx-research?status={status}&trans_id={trans_id}&user_id={user_id}&amount_local={amount_local}&type={type}&ip_click={ip_click}&hash={secure_hash}
   ```

5. Check it with CPX's **Test postback** for your own account: the tokens show on your Tokens page,
   and the same postback sent again adds nothing.

**Linkvertise**

1. Create a Linkvertise publisher account.
2. Turn on **Linkvertise**.
3. Copy the anti-bypass API token from Linkvertise's dashboard into **Linkvertise Anti-Bypass
   Token**. Without it Linkvertise is never offered.
4. Choose one of:
   - **Full Script**: enter your **Linkvertise Publisher ID** (a number). The Tokens page then loads
     Linkvertise's script from `publisher.linkvertise.com`, which turns the page's own earn link
     into a Linkvertise link. **Full Script Whitelist** lists the link patterns it rewrites, comma
     separated; leave it empty for `lvr=`, the Tokens page's own link.
   - **A link**: leave the publisher ID empty and enter a **Linkvertise Link** to the panel that
     starts with `https://`. Put `{return}` (the way back, URL-encoded) or `{return_b64}` (base64)
     where its target goes; the panel fills it in for every trip.
5. Save.

**Vylo, Cuty, ShrinkEarn, ShrinkMe**

1. Create a publisher account at the shortener: Vylo (`vylo.cc`), Cuty (`cuty.io`), ShrinkEarn
   (`shrinkearn.com`) or ShrinkMe (`shrinkme.io`).
2. Turn the provider on.
3. Copy the API key from its dashboard into **Vylo API Key**, **Cuty API Key**, **ShrinkEarn API
   Key** or **ShrinkMe API Key**.
4. Save. The panel calls the shortener's API (`/api?api=<key>&url=...`) for a new short link on
   every trip.

**AdFoc.us**

1. Create an AdFoc.us account.
2. Turn on **AdFoc.us**.
3. Copy the API key from AdFoc.us's Tools › API page into **AdFoc.us API Key**.
4. Save. AdFoc.us refuses an encoded way back, so the panel puts its proof in the claim itself
   (`?claim=<claim>.<proof>`).

Then, as a user, use **Earn with ...** for each link provider, finish the link and check that the
toast says tokens were added.

### Panel access

Panel access is on by default. Decide before users arrive:

- To keep the panel free: Admin › Settings › Economy › Tokens › Panel Access, turn off **The Panel
  Costs Tokens** (or set **Tokens per Month** to 0).
- To charge for it: set up at least one link provider (or **Daily Tokens**) first, so users can
  earn what it costs.

## Settings

Admin › Settings › Economy has three tabs for the economy; Server Upgrades and Partners have their
own pages ([server upgrades](/servers/server-upgrades/), [partners](/economy/partners/)). A tab saves
only its own fields.

### Resource Store

| Setting | Default | What it does |
|---|---|---|
| Credits | on | Credits and the Resource Store. Off hides the store; balances are kept |
| Starting Credits | 0 | Credits every account gets once, the first time its balance is shown. Up to 1000000 |

**Sale**

| Setting | Default | What it does |
|---|---|---|
| Discount (%) | 0 | Taken off every price the sale covers while it runs. 0 turns it off. Up to 100 |
| Covers | The Resource Store | The Resource Store, the memberships, or both. Memberships: purchases, gifts and automatic renewals |
| Name | empty | What the store and the Membership page call the sale. Empty: Sale. Up to 64 characters |
| Starts | empty | In your browser's time zone. Empty: right away |
| Ends | empty | Shown in the store. Empty: until the discount is set back to 0. Must be after Starts |

**Prices**

| Setting | Default | What it does |
|---|---|---|
| CPU Step (%) | 50 | How much one CPU step adds. 0 does not sell CPU |
| CPU Step Price (Credits) | 100 | What a step costs at the limit |
| CPU Limit (%) | 600 | Where a CPU step reaches its full price |
| Memory Step (MiB) | 1024 | How much one memory step adds. 0 does not sell memory |
| Memory Step Price (Credits) | 150 | What a step costs at the limit |
| Memory Limit (MiB) | 24576 | Where a memory step reaches its full price |
| Disk Step (MiB) | 5120 | How much one disk step adds. 0 does not sell disk |
| Disk Step Price (Credits) | 75 | What a step costs at the limit |
| Disk Limit (MiB) | 102400 | Where a disk step reaches its full price |
| Lowest Price (%) | 50 | The least a step costs on the way to the limit, in percent of its price |
| Soft Limit (%) | 125 | Where prices get steep, in percent of the limit. 100 to 1000 |
| Price at the Soft Limit (×) | 4 | What a step costs at the soft limit, as a multiple of its price. 1 to 100 |
| Doubling Every (%) | 5 | Past the soft limit the price doubles every this many percent of the limit. 1 to 100 |

### Tokens

| Setting | Default | What it does |
|---|---|---|
| Tokens | on | Tokens, the Tokens page and earning. Off hides the page; balances are kept |
| Daily Tokens | 0 | Tokens every account gets once a day. 0 gives none. Up to 100 |
| Minutes to Finish a Link | 30 | How long a user has to come back from a link. 1 to 1440 |
| Less per Further Link (%) | 15 | Each further link on the same provider the same day pays this much less. 0 pays every link in full. Up to 90 |
| Lowest Reward (%) | 25 | A link never pays less than this share of its full reward. 1 to 100 |

**Panel Access**

| Setting | Default | What it does |
|---|---|---|
| The Panel Costs Tokens | on | Accounts without a membership pay tokens for the panel itself |
| Tokens per Month | 5 | What one payment costs. 0 makes the panel free |
| Days per Payment | 30 | How long one payment lasts. 1 to 3650 |

**Profile Badges**

| Setting | Default | What it does |
|---|---|---|
| Sell Profile Badges | on | Users buy preset badges on their account page, for good. Bought badges stay shown when this is off |
| Tokens per Badge | 5 | What one badge costs. 1 to 100000 |

**Earning Tokens**

| Setting | Default | What it does |
|---|---|---|
| CPX Research | off | Offers the survey wall, first on the Tokens page. Needs the App ID and the Secure Hash |
| CPX Research App ID | empty | From the app's page in CPX Research's dashboard. Digits, up to 20 |
| CPX Research Secure Hash | empty | From the same page. Stored encrypted |
| Surveys per Day | 1 | Finished surveys that pay, per account. Screen-outs and bonuses are paid and do not count. 0 has no limit. Up to 1000 |
| Linkvertise | off | Offers Linkvertise. Needs the anti-bypass token |
| Linkvertise Anti-Bypass Token | empty | From Linkvertise's dashboard. Stored encrypted |
| Linkvertise Publisher ID | empty | A number. Turns on the Full Script; without it the link below is used |
| Full Script Whitelist | empty (`lvr=`) | Patterns of the links the script rewrites, comma separated. Shown with a publisher ID |
| Linkvertise Link | empty | An `https://` Linkvertise link to the panel with `{return}` or `{return_b64}`. Shown without a publisher ID |
| Vylo, Cuty, ShrinkEarn, ShrinkMe, AdFoc.us | off | Offers that shortener. Needs its API key |
| Vylo, Cuty, ShrinkEarn, ShrinkMe, AdFoc.us API Key | empty | From the provider's dashboard (AdFoc.us: Tools › API). Stored encrypted |
| Tokens per Link | 1 | Per link provider. Up to 2 decimals, 0.01 to 1000 |
| Links per Day | 5 | Per link provider and account. 0 has no limit. Up to 1000 |
| Shortest Trip (Seconds) | 10 | Shorteners only: a trip back faster than this does not count. 0 to 600 |

**Daily Streak**

| Setting | Default | What it does |
|---|---|---|
| Daily Streak | on | The streak's claim button on the Tokens page |
| Tokens per Day | `0.25,0.25,0.5,0.5,0.75,0.75,1` | What days 1, 2, 3 … of a streak pay, comma separated, up to 2 decimals (1 to 14 values, 0.01 to 100 each). The last one repeats |

**Double Tokens**

| Setting | Default | What it does |
|---|---|---|
| Bonus | 0 | Percent more on every sponsored link and survey while it runs: 100 doubles them, 0 is off. Up to 1000 |
| Name | empty | What the Tokens page calls it, such as "Halloween weekend". Empty: a plain bonus |
| Starts | empty | In your browser's time zone. Empty: right away |
| Ends | empty | Empty: until the bonus is set back to 0 |

**Getting Started**

| Setting | Default | What it does |
|---|---|---|
| First-Week Tasks | on | The task list on the Tokens page for new accounts |
| Days Shown | 14 | Days after sign-up the list is shown. 0 hides it. Up to 365 |
| Tokens per Task | 1 | What each task pays, once. 1 to 1000 |

**Referrals**

| Setting | Default | What it does |
|---|---|---|
| Referrals | on | Every account gets a referral link |
| Tokens per Friend | 5 | What the referrer gets per friend. 1 to 10000 |
| Friend Earns | 10 | Tokens the friend earns before the referrer is paid. 1 to 100000 |
| Paid per Month | 10 | Friends paid per account in any 30 days. 0 has no limit. Up to 1000 |

A stored key, token or Secure Hash shows "Stored. Leave empty to keep it."; type a new one to
replace it. With CPX Research on, the tab also shows its **Postback URL** (click to copy) and what
to set in CPX's Reward Settings.

### Memberships

| Setting | Default | What it does |
|---|---|---|
| Memberships | on | The memberships and Account › Membership. Off hides the page; memberships are kept |
| First Membership's Name | Plus | What users see. 1 to 32 characters |
| Second Membership's Name | Premium | What users see. 1 to 32 characters |
| First Membership: Tokens | 15 | Its price in tokens |
| First Membership: Days | 30 | How long that buys. 1 to 365 |
| Second Membership: Tokens | 30 | Its price in tokens |
| Second Membership: Days for Tokens | 30 | How long that buys. 1 to 365 |
| Second Membership: Credits | 0 | Its price in credits. 0 does not sell it for credits |
| Second Membership: Days for Credits | 30 | How long that buys. 1 to 365 |
| First Membership: Burst Cores | 1 | CPU above each server's limit, 100 % per core. 0 to 16 |
| Second Membership: Burst Cores | 2 | The total while it runs, not added to the first's. 0 to 16 |

**Renewals and Gifts**

| Setting | Default | What it does |
|---|---|---|
| Ends-Soon Notice | on | A notification before a membership or paid panel access ends |
| Hours Before the End | 48 | When it is sent. 1 to 720 |
| Auto-Renew | on | Members may have a membership renew by itself as it ends. Each membership's switch is off until its member turns it on |
| Gifts | on | Accounts may buy a membership for another account with tokens |
| Gifts per Day | 10 | Per buyer, over the last 24 hours. 1 to 1000 |

**Included With the Second Membership**

| Setting | Default | What it does |
|---|---|---|
| Include a Membership on Another Panel | off | The other panel's membership comes with the second membership here, and the other way round. Needs noprofit.space |
| Panel URL | `https://panel.switched.cloud` | Where the other panel is, starting with `https://` |
| Name | switched.cloud Plus | What the Membership page lists under the second membership |
| Their Second Membership's Name | switched.cloud Premium | The other panel's membership that includes the first membership here |
| Shared Secret | empty | At least 32 characters, the same on the other panel. Stored encrypted |

## Permissions

Account permissions (API key scopes):

| Permission | Allows |
|---|---|
| `economy.read` | Viewing the account's credits, tokens, memberships and their history |
| `economy.purchase` | Spending credits and tokens on resources, memberships (gifts and auto-renew included), panel access, the day pass and profile badges |
| `economy.earn` | Earning tokens through surveys and sponsored links, and claiming the daily streak and first-week tasks |

Admin role permission:

| Permission | Allows |
|---|---|
| `users.economy` | Viewing and changing a user's credits, tokens and memberships |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `settle_memberships` | every minute | Renews memberships set to renew automatically, sends the ends-soon notices, moves the servers of a lapsed membership off the locations it opened, and brings every account's burst cores in line with its memberships and the settings |
| `pay_referrals` | every minute | Pays the referrers of friends who earned Friend Earns tokens |
| `sync_membership_bundle` | every minute | Sends the other panel the second membership's ends that changed, and applies included memberships waiting for an account's first sign-in. Does nothing until it is set up |

Background tasks run only on the panel instance with `APP_PRIMARY=true`.

## Notes

:::caution
The Panel Costs Tokens is on by default. With tokens on and no way to earn them, every user
without a membership is sent to Account › Panel Access and cannot open their servers. Turn it off,
or set up a link provider or Daily Tokens, before users sign in.
:::

- Turning Credits, Tokens or Memberships off hides their pages. Balances and memberships are kept
  and come back when you turn them on again.
- Opening links and the survey wall is throttled per account and provider: three times Links per
  Day (or Surveys per Day) per hour, at least 5.
- With the defaults (1 token per link, 15 % less per further link), the second link of the day pays
  0.85 tokens. Raise Tokens per Link or set Less per Further Link to 0 if that is not what you want.
- AdFoc.us needs a way back that needs no encoding: keep the panel's URL to letters, digits and
  `:/.-_`. Otherwise the panel asks AdFoc.us for no link and the user gets an error.
- A shortener that does not answer within 8 seconds, or answers without a link, makes no link; the
  user gets an error and can try again.
- Changing burst cores in the settings reaches every account within a minute, without a restart.
- Before 3.0.4 the first membership was bought once and kept for good. Upgrading to 3.0.4 gives
  every account that had it 14 more days from the upgrade, sets the membership prices and days back
  to the defaults above (the old values priced a one-off purchase), renames a second membership
  still called PlusPlus to Premium, and turns Spare Members off in [limbo](/starts/limbo/). Check
  Admin › Settings › Economy › Memberships afterwards.
- 3.0.5 adds the daily streak, the first-week tasks, referrals, profile badges, ends-soon notices,
  the auto-renew switches, gifts and [server upgrades](/servers/server-upgrades/), all on by default
  once tokens and memberships are. Double tokens and the included membership stay off until you set
  them. Check the Tokens, Memberships and Server Upgrades tabs after upgrading.
- With [noprofit.space](/accounts/noprofit/) connected, credits are the account's noprofit.space
  credits and the Resource Store is noprofit.space's (its catalog, prices and history); Starting
  Credits and the Prices settings are not used, sales still apply. An admin's credit change is sent
  to the account there, and a second membership bought with credits is paid from it. Tokens and
  memberships stay the panel's own.
