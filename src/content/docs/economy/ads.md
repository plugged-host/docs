---
title: Ads
description: Show Adsterra and Monetag ads and your own sponsored banners in the panel, an ad-funded waiting room on start with a day pass, the membership popup, offers and promo clips, an ad-blocker notice and an in-game chat line.
---

Ads pay for free servers. The panel shows Adsterra units in isolated frames, Monetag's tags, your
own sponsored banners, an ad-funded waiting room when a user starts a server, a note for visitors
with an ad blocker, and a chat line on running Minecraft servers. Next to them it has its own
promotions: a popup about the memberships, one-line offers where a limit stops someone, and house
promo clips in the ad slots. Users see the ads; admins choose the networks, slots and rules. Ads are
off until you turn them on. With ads on and no zone, tag or sponsored banner yet, only the promo
clips show (Admin › Settings › Ads › Promotions turns them off).

## What it does

### Who sees ads

| Who | Ads |
|---|---|
| Accounts with the second membership, while Fewer Ads for Members is on | none, and no waiting room |
| Accounts with the first membership, while Fewer Ads for Members is on | only the waiting rooms before a start (the start waiting room and the start queue page), with their units refreshed after Refresh for Members; no slot on any other page, no Social Bar, Popunder, Waiting Room Zone, In-Page Push or Vignette, and no ad blocker notice |
| Accounts with either membership, while Fewer Ads for Members is off | all, refreshed after Refresh for Members instead of Refresh After; no Vignette unless Vignette for the First Membership is on |
| Everybody else, admins included | all |

In-game messages skip every account with a membership, whatever Fewer Ads for Members says. Admin
pages never show ads. Dashboard pages and server pages each have their own switch. See
[memberships](/economy/credits-and-tokens/).

### Slots

Each slot shows the widest unit of its sizes that fits the width it has, and no unit shows twice on
a page. A sponsored banner goes before an ad zone of its size; banners of one size take turns from
page to page.

| Slot | Where | Sizes |
|---|---|---|
| Top Banner | above every dashboard and server page | a sponsored top banner only |
| Server Pages Strip | under the header of a server's pages, not the console | 468×60, 320×50 |
| Page Rectangles | Create Server, the Resource Store, the server list | 300×250 |
| Page Foot | at the foot of every page | a leaderboard size, and the native unit |
| Waiting rooms | the start queue and the start waiting room | any zone left, 160×600 and 160×300 too, and the native unit |

The Server Pages Strip and the Page Rectangles together fill at most **Units per Page** units per
page; the top, the foot and the waiting rooms do not count. The top and foot slots are not shown on
the waiting pages or on a parked server's page. A slot that gets nothing takes no room.

The house [promo clips](#promo-clips) take turns with the other units in the waiting rooms' slots
and the page rectangles, never in the strip, the top or the foot.

### Isolation

An Adsterra banner zone or the native unit is a frame the panel builds from the settings alone, with
Adsterra's snippet, sandboxed without access to the panel's origin. Its scripts cannot reach the
panel's pages, cookies or API, and cannot navigate the panel away.

- A frame tells the page whether it holds an ad. A unit that shows none after 6 seconds folds to
  nothing.
- A filled unit reloads after the refresh time in view (half of it visible, the tab in front).
- Some networks fill nothing for a frame without an origin. Set **Ad Frame Address** to another
  address of the panel, best on another domain such as `https://ads.example.net`: the frames then
  load from there with an origin of their own, which is still not the panel's. Only requests to that
  address get it; the panel's own address never does, even if you enter it there. Point the name at
  your web server and let it serve `/api/ads/unit` only, for example in nginx:

  ```nginx
  server {
      server_name ads.example.net;
      location = /api/ads/unit { proxy_pass http://127.0.0.1:8000; proxy_set_header Host $host; }
      location / { return 404; }
  }
  ```

### Page-level scripts

Adsterra's Social Bar and Popunder, the waiting room's own zone, and Monetag's In-Page Push and
Vignette cannot work in a frame: they run in the page itself. The panel adds their hosts, and the
hosts in **More Script Hosts**, to its Content Security Policy.

| Script | Pages | Waiting rooms | Console |
|---|---|---|---|
| Social Bar | with Social Bar on Every Page | when the room shows it | never |
| Popunder | never | when the room shows it | never |
| Waiting Room Zone | never | when the room shows it | never |
| In-Page Push | yes | never | never |
| Vignette | once per Minutes Between Vignettes per browser | never | never |

A loaded script stays until the next full page load, so leaving a waiting room in which one ran
reloads the page. **Site Verification** puts Monetag's verification meta tag into every page.

### Sponsored banners

Admin › Sponsored Banners holds banners you sell yourself: an advertiser, an `https` link, an image
(PNG, JPEG, WebP or GIF, at most 4 MB, kept in the panel's storage), a placement, an optional start
and end, and an Active switch. A banner shows while it is active, has an image and is inside its
dates.

- **Ad Slots**: the image is one of the zone sizes (728×90, 468×60, 320×50, 300×250, 160×600,
  160×300), or twice one for sharp screens (shown at half). It takes the place of a zone of that
  size. Any other size never shows; the form says so.
- **Top of Every Page**: any size, above every page with ads, as wide as the page allows up to the
  image's own width.

Clicks go through the panel, which counts them (a browser's prefetch does not count) and redirects
to the stored link only. The list shows each banner's clicks.

### The start waiting room

The waiting room is the fourth [start gate](/starts/start-gates/). The start goes to Wings at once;
the room only holds the user on a page of ads while the server comes up. A start waits in the room
when the room and ads are on, and none of these hold:

- the user is an admin, or sees no ads;
- the user has a running [day pass](#day-pass);
- the server is suspended or busy (installing, restoring, moving);
- the server is under every line: its CPU limit, memory and disk at most CPU Line, Memory Line and
  Disk Line (a line of 0, or an unlimited resource, always counts as over);
- the same user left a room for this server less than Free Pass minutes ago;
- it is a Start on a server that is not offline, or Wings does not answer;
- there is nothing to show: no zone, native unit, page script or live sponsored banner (the promo
  clips alone do not open the room).

The page ("These ads are paying for your server") counts down to Longest Stay and lets the user
through once the server runs and Shortest Stay has passed, or at Longest Stay whatever the server
does. Under the countdown it offers the [day pass](#day-pass), then the room's ads. While it counts
down, the browser asks before a reload or close. A start that did not reach Wings on the click is
sent again when the user leaves.

Server activity: `server:waiting-room.open`, `server:waiting-room.release` (with the time waited).

### Day pass

The waiting room sells the way past it. A day pass costs **Day Pass Price** tokens (1) and lets
every start of the account skip the waiting room, on all its servers, for **Day Pass Length** hours
(24). The start queue still applies.

- Under the countdown, a "Skip the wait" card shows the user's tokens and **Skip the wait for 24
  hours · 1 token**. With too few tokens the button is **Earn tokens**, which opens Account › Tokens
  in a new tab.
- While memberships are on with Fewer Ads for Members, users without the second membership also
  see that it skips the room, with a link to the membership page in a new tab.
- Buying lets the user through at once. A pass bought while one runs adds to what is left; while a
  pass runs, the card says until when.
- It is sold while ads, the waiting room, Sell a Day Pass and tokens are on. A purchase is sent
  with the price the user saw: a price that changed since buys nothing.
- The token history shows "Waiting room day pass"; user activity `account:day-pass`.

### The membership popup

A card for users without a membership who see every ad: the membership closest to their tokens, its
perks and how far they are.

- It offers the dearest membership the user's tokens already buy, else the cheapest one sold for
  tokens, at today's price (with a [membership sale](/economy/credits-and-tokens/#sales), the full
  price struck through).
- It lists only perks that are on (the membership's locations, priority in the start queue, burst
  cores, fewer ads, the panel included, more neo usage, faster backups), then a bar ("9 of 15") or
  "You have enough", with **Get Plus** (the membership's name), which opens the membership page, and
  **Not now**.
- At most once per **Hours Between Popups** (24) per account, on any device. Never on the account's
  first day, for admins or suspended accounts, on the membership or tokens pages, the start queue or
  the waiting room, or while the [welcome tour](/accounts/welcome-tour/) runs.
- It rises from the window's corner above the **Ask neo** button; on phones it is a sheet along the
  foot. With reduced motion turned on in the browser, it simply appears.
- It needs ads, memberships and tokens on.

### Offers where a limit is felt

While **Offers Where a Limit Is Felt** is on, three pages add one line with a link, only for users
who do not have what it offers:

| Where | When | Says |
|---|---|---|
| The [start queue](/starts/start-queue/) | memberships on, the user lacks the second membership | The second membership goes first in this line, with a link to the membership page |
| [Create Server](/servers/create-server/) | credits on, the allowance stops the deploy (not the server limit) | "Get more in the Resource Store" beside the reason |
| Account › Panel Access | memberships on, the user has to pay | Both memberships include the panel, with a link to the first one |

Idle stops, parked servers and per-server limits offer [server upgrades](/servers/server-upgrades/)
instead. No offer suggests turning tokens into credits: they never convert.

### Promo clips

The panel ships three short house clips (get the second membership, get the first one, earn tokens).
While **Promo Clips in the Ad Slots** is on, they are one more unit in the rotation, to the same
users as every other ad:

- In a waiting room slot (the start waiting room and the start queue page) a clip plays as a muted,
  looping video with its button over its foot; in a page rectangle (300×250) its poster shows as a
  banner. The strip, the top and the foot never get one.
- A slot shows a clip instead of its unit **Share of the Slots** percent of the time (25), and a slot
  with nothing else to show gets one. Each clip shows at most once per page.
- The first membership's clip never goes to its members, and a clip whose page (memberships, tokens)
  is off never shows. A clip that does not load folds away. Links open in a new tab.
- The buttons are in the reader's language.

### Ad blockers

With **Ask to Allow Ads** on, pages with ads look for a blocker once per page load: a bait element
with ad class names, checked again after 2.5 seconds, and, with **Test the Ad Hosts**, a request to
the first zone's host that fails. Then, by **How**:

| How | Shows |
|---|---|
| Notice | a note above the page that can be closed; it stays away for Hours Away After Closing |
| Modal | a dialog that can be closed after Seconds Before Closing; it stays away likewise |
| Block | a dialog that stays until the blocker is off and the page reloaded |

The console never asks while Not on the Console is on, and a parked server's page never does.
Accounts with the first membership are never asked while Fewer Ads for Members is on.

### In-game messages

With **In-Game Messages** on, running Minecraft servers (eggs with the `eula` feature) whose owner
is neither an admin nor a member get `say <message>` in chat once per Every (Minutes). The servers
are spread over the interval, so a node never gets them all at once. The default message is "This
server is hosted on" and the panel's name.

## Requirements

- **Adsterra** (optional): a publisher account with the panel's site added. Create the units you
  want there and copy their code:
  - **Banner** zones in the sizes 728×90, 468×60, 320×50, 300×250, 160×600 or 160×300;
  - a **Native Banner**;
  - a **Social Bar** and a **Popunder**, if you want page-level ads;
  - a separate Social Bar or Vignette zone for the waiting rooms, if you want their earnings shown
    apart.
- **Monetag** (optional): a publisher account with the panel's site verified. Create an **In-Page
  Push** and/or a **Vignette** tag and note each tag's zone id and script URL. Monetag's Push
  Notifications and MultiTag need a service worker at the site root and are not supported.
- **Sponsored banners** (optional): no outside account, only the images.
- Memberships, if members should see fewer ads (Admin › Settings › Economy › Memberships).
- Tokens (Admin › Settings › Economy › Tokens) for the day pass, and tokens with memberships for the
  membership popup.
- A Minecraft egg with the `eula` feature for in-game messages ([eggs](/nodes/eggs/)).

## Setup

1. Admin › Settings › Ads › Adsterra: paste the Banner snippets into **Banner Zones** as Adsterra
   shows them (several at once is fine), or one `key:WIDTHxHEIGHT:host` line per zone. Paste the
   Native Banner's script URL or whole snippet into **Native Banner Script**, and the Social Bar,
   Popunder and waiting room zone into their fields. Save; the panel checks every field and says
   what is wrong.
2. Admin › Settings › Ads › Monetag: enter the **In-Page Push Zone** and **In-Page Push Script**,
   and the **Vignette Zone** and **Vignette Script**, from Monetag's tags. Enter the **Site
   Verification** code if Monetag asks you to verify the site. Save.
3. Optional: Admin › Sponsored Banners › Create, then upload the image.
4. Admin › Settings › Ads › Placement: turn on **Show Ads**, choose the pages and slots, and save.
5. Optional: Admin › Settings › Ads › Waiting Room, Ad Blockers, In-Game and Promotions.
6. Open the server list as a user: a 300×250 zone shows in the page and a leaderboard zone at
   the foot, if you created those sizes. A zone that never fills folds away after a few seconds; if
   all of them do, try **Ad Frame Address**.

### Zone formats

**Banner Zones** takes Adsterra's Banner snippets as pasted, or one line per zone:

- `key:WIDTHxHEIGHT` uses the default host `www.highperformanceformat.com` and loads
  `https://www.highperformanceformat.com/<key>/invoke.js`;
- `key:WIDTHxHEIGHT:host` loads `https://host/<key>/invoke.js`;
- `key:WIDTHxHEIGHT:https://host/path` loads that script URL, as in Adsterra's newer code.

The native unit writes into the element `container-<id>`, the id taken from its script URL
(`https://host/<id>/invoke.js`, or `https://host/21/<id>` in newer code), unless you set **Native
Banner Container**.

## Settings

Admin › Settings › Ads has one tab per part. A tab saves only its own fields.

### Placement

| Setting | Default | What it does |
|---|---|---|
| Show Ads | off | Turns ads on. Nothing shows until a zone, a tag or a sponsored banner exists |
| On the Dashboard | on | The server list, the account pages, Create Server and the store |
| On Server Pages | on | A server's console and its other pages |
| Fewer Ads for Members | on | The second membership sees no ads; the first sees only the waiting rooms before a start, no banners or popups. Off: members see every ad, refreshing slower |
| Top Banner | on | The sponsored top banners above every page |
| Server Pages Strip | on | A 468×60 or 320×50 banner under a server page's header, not on the console |
| Page Rectangles | on | A 300×250 banner on Create Server, the store and the server list |
| Page Foot | on | A leaderboard and the native unit at the foot of every page |
| Units per Page | 2 | The most units the strip and the rectangles fill together on one page. 0 fills none. Up to 20 |
| Refresh After (Seconds) | 5 | A unit with an ad reloads after this long in view. 0 never. Up to 3600 |
| Refresh for Members (Seconds) | 10 | The same for members who see ads, never shorter than the above. 0 never |

### Adsterra

| Setting | Default | What it does |
|---|---|---|
| Banner Zones | empty | Banner snippets, or one zone per line (see [zone formats](#zone-formats)) |
| Ad Frame Address | empty | Another `https://host` or `https://host:port` of the panel that serves only `/api/ads/unit`. Empty: frames load from the panel's address, isolated |
| Native Banner Script | empty | The script URL or the whole snippet. Empty: no native unit |
| Native Banner Container | empty | The id of the snippet's empty div. Empty: taken from the script URL |
| Native Banner Height | 320 | Pixels kept for the native unit. 50 to 2000 |
| Social Bar Script | empty | The script URL or the whole snippet. Runs in the page |
| Social Bar on Every Page | off | Off: only in the waiting rooms, when they show it. Never on the console |
| Popunder Script | empty | Runs only in the waiting rooms |
| Waiting Room Zone | empty | A Social Bar or Vignette zone of the waiting rooms' own |
| More Script Hosts | empty | Hosts the page scripts load further scripts from, one per line |

### Monetag

| Setting | Default | What it does |
|---|---|---|
| In-Page Push Zone | empty | The zone id from the In-Page Push tag. Empty: off |
| In-Page Push Script | empty | The script URL from the same tag |
| Vignette Zone | empty | The zone id from the Vignette tag. Empty: off |
| Vignette Script | empty | The script URL from the same tag |
| Minutes Between Vignettes | 10 | Per browser. 0: on every page load. Up to 1440 |
| Vignette for the First Membership | off | Off: members never get the Vignette. Only matters while Fewer Ads for Members is off |
| Site Verification | empty | Monetag's verification code, put into every page's head |

Monetag never loads on the console or in the waiting rooms.

### Waiting Room

| Setting | Default | What it does |
|---|---|---|
| Start Waiting Room | off | A user's start goes out at once and the user waits on a page with ads |
| CPU Line (%) | 0 | Servers with a CPU limit above this wait. 0: every server |
| Memory Line | 0 | Servers with more memory than this wait. 0: every server |
| Disk Line | 0 | Servers with more disk than this wait. 0: every server |
| Shortest Stay (Seconds) | 15 | The room lets the user through once the server runs and this much time has passed. 0 to 600 |
| Longest Stay (Seconds) | 30 | After this the room lets the user through however far the server is. 1 to 600 |
| Free Pass (Minutes) | 10 | The same user's starts of that server within this time skip the room. 0 to 1440 |

**Day Pass**

| Setting | Default | What it does |
|---|---|---|
| Sell a Day Pass | on | The room offers "Skip the wait" for tokens: the user's starts skip every room, on all their servers, for a while |
| Day Pass Price (Tokens) | 1 | What one pass costs. 1 to 1000 |
| Day Pass Length (Hours) | 24 | How long one pass lets starts skip the room. 1 to 720 |

**What the Rooms Show** (the start queue page shows the same):

| Setting | Default | What it does |
|---|---|---|
| Banners | on | The zones the page has left, 160×600 and 160×300 too |
| Native Banner | on | The native unit, once per page |
| Social Bar | on | The Social Bar from the Adsterra tab |
| Popunder | on | The Popunder from the Adsterra tab |
| Waiting Room Zone | on | The waiting room zone from the Adsterra tab |

### Ad Blockers

| Setting | Default | What it does |
|---|---|---|
| Ask to Allow Ads | off | On pages with ads, a visitor with an ad blocker is asked to allow them |
| How | Notice | Notice, Modal or Block (see [ad blockers](#ad-blockers)) |
| Seconds Before Closing | 4 | Modal: how long the dialog stays before it can be closed. 0 to 60 |
| Hours Away After Closing | 12 | A closed notice or dialog stays away this long. 0: back on the next page load. Up to 720 |
| Test the Ad Hosts | on | Also count it as blocked when the ad host does not answer the browser |
| Not on the Console | on | The console never asks |
| Message | empty | Replaces the default text. Up to 1000 characters |

### In-Game

| Setting | Default | What it does |
|---|---|---|
| In-Game Messages | off | Running Minecraft servers of accounts without a membership get a chat message now and then |
| Message | empty | One line, up to 200 characters. Empty: "This server is hosted on" and the panel's name |
| Every (Minutes) | 60 | How often each server gets it. 5 to 1440 |

### Promotions

| Setting | Default | What it does |
|---|---|---|
| Membership Popup | on | The [membership popup](#the-membership-popup) for users without a membership who see ads. Needs memberships and tokens on |
| Hours Between Popups | 24 | A user sees it at most once in this time, on any device. 1 to 720 |
| Offers Where a Limit Is Felt | on | The [one-line offers](#offers-where-a-limit-is-felt) on the start queue, Create Server and Panel Access |
| Promo Clips in the Ad Slots | on | The [promo clips](#promo-clips) take turns with the other units |
| Share of the Slots (%) | 25 | How often a slot shows a clip instead of its unit; a slot with nothing else shows one too. 0: never. Up to 100 |

## Permissions

Admin role permissions for Admin › Sponsored Banners:

| Permission | Allows |
|---|---|
| `ad-banners.create` | Creating sponsored banners |
| `ad-banners.read` | Viewing sponsored banners and their clicks |
| `ad-banners.update` | Changing sponsored banners and their images |
| `ad-banners.delete` | Deleting sponsored banners |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `send_in_game_ads` | every minute | Sends the in-game message to the running Minecraft servers whose turn it is |

Background tasks run only on the panel instance with `APP_PRIMARY=true`.

## Notes

- Page-level scripts run with the page's rights, unlike the framed units. Only paste scripts from
  networks you trust.
- A script that loads further scripts from a host the panel does not know is blocked by the Content
  Security Policy. Add that host to **More Script Hosts**.
- The waiting room never delays a server: the start goes to Wings on the click. Its cost to the
  user is Shortest Stay to Longest Stay seconds of ads per start, less with Free Pass.
- With memberships off, everybody sees all ads and Fewer Ads for Members does nothing.
- The promotions are on by default. The popup and the clips go only to users who see ads, so they
  show nothing while Show Ads is off; the offers show whether ads are on or not.
