---
title: Ads
description: Adsterra ad units, sponsored banners, the ad-funded start room, in-game ads and the ad-block response (plugged-host-ads).
sidebar:
  order: 9
---

plugged-host-ads shows advertising in the panel to pay for free servers. It renders Adsterra
units in fixed places, shows banners you sell yourself, and can put a short ad-funded waiting
room in front of server starts. It can also send an in-game message to Minecraft servers and ask
visitors with an ad blocker to allow ads. The settings for earning tokens through Linkvertise
live here too.

## What it does

- **Adsterra units.** Adsterra is the only ad network the code supports. You paste values from
  the snippets Adsterra gives you; nothing is fetched from Adsterra's API. Supported formats:
  - **Banner**: a main banner plus a pool of extra banner zones. Sizes: 728x90, 468x60, 320x50,
    300x250, 160x600, 160x300.
  - **Native Banner.**
  - **Social Bar** and **Popunder**: page-level scripts, each with its own switch for whether it
    runs panel-wide or only in the waiting rooms.
  - A **waiting-room zone** of its own (an ordinary Social Bar or Vignette zone).
  - An Adsterra **Direct Link**, shown as a button the user chooses to click.
- **Sandboxing.** Banner and native units render inside a sandboxed iframe, so ad code can't
  reach the panel's page, cookies or Livewire state, and can't redirect the panel.
- **Each zone at most once per page.** A unit over several sizes picks the widest that fits its
  container. A unit Adsterra leaves empty after 5 seconds (it sends nothing to VPN traffic, for
  example) folds away, and comes back if it fills later.
- **Refresh.** Sandboxed units reload after they have been in view for a few seconds. Only time
  counts while at least half the unit is on screen in a visible tab.
- **Sponsored banners** you sell yourself, managed in Admin › Panel › Sponsored banners.
- **The ad-funded start room** (the "start gate"): starting a server above a size threshold lands
  the user on a short waiting page full of ads while the server boots. Off by default.
- **In-game ads**: a `say <message>` on running Minecraft servers once per interval.
- **Ad-block response**: detects blockers and shows a notice, a modal, or a hard block. Off by
  default.
- **Token earning settings**: the Linkvertise provider behind the [Economy](/plugins/economy/)
  Tokens page.

### Who sees ads

A user sees ads only when all of these hold:

- **Enable Ads** is on.
- The page is in a panel that has ads switched on (app and server panels by default, not the
  admin panel).
- The user is signed in. Signed-out pages never show ads.
- The user is not in an exempt role, and has no exemption from another plugin. PlusPlus
  ([Economy](/plugins/economy/)) registers one.

The same rule covers banners, sponsored banners, the start room and the ad-block detector. The
exemptions also apply to in-game ads, where plugged.host Plus exempts the owner too. Plus owners
still see panel ads, refreshed at the slower Plus interval.

### Where ads appear

| Place | Units |
|---|---|
| Foot of every app and server page | Leaderboard (728x90, 468x60 or 320x50, whichever fits) and the native unit |
| Create server page, under the plan picker ([Servers](/plugins/servers/)) | 300x250 |
| Resource Store, under the credit history ([Economy](/plugins/economy/)) | 300x250 |
| Foot of the server list | 300x250 |
| Server installing page ([Minecraft](/plugins/minecraft/)) | 300x250 |
| Sidebar footer | Native |
| Under the page header on server pages, except the console and waiting pages ("server tools") | 468x60, or 320x50 on phones. Off by default |
| Waiting rooms: the start room and the [Queue](/plugins/queue/)'s waiting page | Leaderboard, then up to six unused pool zones, then native, plus the waiting-room scripts |
| Top of every app and server page | A sponsored top banner, when one is live |

The named slots (create, store, server list, onboarding, sidebar, server tools) are limited by
**Maximum units per page** (2 by default). The page foot and the waiting rooms don't count
toward that cap.

### The ad-funded start room

When **Enable the Start Gate** is on, pressing **Start** on a stopped server above any of the
CPU, memory or disk thresholds, or **Restart** on such a server in any state, sends the user to
a full-page waiting room (`start` in the server panel). The start itself goes to Wings on the
click, so the server boots while the ads show. The room releases the user as soon as the server
is up, but never before the minimum wait and never later than the maximum. The user can't leave
early: until the room releases them, every other page of that server sends them back to it.
Afterwards a grace period lets that user restart that server without waiting again.

- The thresholds default to the smallest Servers plan (100% CPU, 2048 MB, 10240 MB). A server
  with `0` (unlimited) on any of them always counts as over. Setting a threshold to `0` sends
  every server to the room.
- It needs at least one Adsterra unit configured, and **Enable Ads** on.
- It is gate 30 in core's start chain, after [Limbo](/plugins/limbo/) and the
  [Queue](/plugins/queue/). It only sees starts neither of them took. With the queue on, most
  starts go through the queue's waiting page instead, which carries the same ads.
- Exempt users, unfinished installs, suspended or transferring servers, and nodes that don't
  answer all go straight through. The room fails open.
- Every pass through the room is recorded in `ads_start_gate_events` (outcome `ads`, `exempt` or
  `failopen`), so you can see how often it runs.

### Sponsored banners

Admin › Panel › Sponsored banners. Anyone who may update plugins can manage them. Each banner
is an image (PNG, JPG, WebP or GIF, up to 4 MB), an `https://` link, the advertiser's name (used
in the alt text "Sponsored: *advertiser*"), a placement, an optional start and end, and an
**Active** switch.

- **Adsterra slots**: the image must be an Adsterra size or twice one (`1456x180` is a sharp
  728x90). A live banner takes the place of the Adsterra unit of its size wherever one is handed
  out. Several banners of one size take turns. Slots show banners even with no Adsterra
  configured.
- **Top banner**: full width above the page heading on every app and server page. Any size;
  wide and short works best. One random live banner per page load.

Clicks go through `/ads/b/{id}`, which counts the click (browser prefetches don't count) and
redirects to the stored link. Images are stored on the panel's public disk under
`plugged-host-ads/banners/` and served from `/storage`. The list of live banners is cached for
60 seconds and cleared on every save.

### Ad-block response

Detection only runs on pages that requested an ad, for users who would see one. Two signals
have to agree, and a second look 2.5 seconds later must agree too:

- A bait element hidden in place.
- Every configured ad host unreachable (this catches DNS-level blockers).
- Every visible ad unit collapsed.

The response is one of three modes. **Notice**: an inline message where the ad would be,
dismissible. **Modal**: an overlay whose "Continue anyway" button unlocks after a delay.
**Block**: the same overlay with no way past it. Start with the notice.

### In-game ads

Every minute, `plugged-host:ads-in-game` sends `say <message>` to the share of servers whose turn
it is. Each server gets the message once per interval, at its own minute. It goes to servers
that are installed and not suspended, whose egg is tagged `minecraft` and not `proxy`, and whose
owner has neither plugged.host Plus nor an ad exemption. Stopped servers refuse the command.

### Turning ads off

- **Everything:** switch **Enable Ads** off (`ADS_ENABLED=false`). That stops Adsterra units,
  sponsored banners, the start room, the ad-block detector and in-game ads. Linkvertise earning
  on the Tokens page is separate: switch **Enable Linkvertise** off for that.
- **Or disable the plugin** in Admin › Plugins. No plugin requires it. The [Queue](/plugins/queue/)
  keeps holding starts, but its waiting page shows no ads, and exempt roles no longer skip the
  queue (root admins still do). In-game ads stop.
- **Only in-game ads:** switch **Send in-game ads** off. They are on by default.

## Requirements

- `plugged_host.requires`: `plugged-host-core`.
- `plugged_host.optional`: `plugged-host-economy` (Plus and PlusPlus for refresh speed and
  exemptions, and the tables for token claims and start-room events).
- An Adsterra publisher account with ad units created for your panel's domain.
- For token earning: a Linkvertise publisher account with Anti-Bypass switched on.
- The `plugged_host_ad_banners` table for sponsored banners (run the migrations). Until it exists
  the Sponsored banners page stays hidden.
- The scheduler, for in-game ads. See [Queue worker and scheduler](/panel/queue-and-scheduler/).

## Setup

1. Run the migrations:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan migrate --force
   ```

2. In Adsterra, register your panel's domain (for example `panel.example.com`) under the
   honest category, which is hosting or web services. Create a **Banner** and a **Native
   Banner** unit. Add Social Bar or Popunder only if you accept a floating widget or a tab that
   opens on click.
3. Open Admin › Plugins › plugged.host Ads › Settings › **Adsterra** and paste:
   - **Banner Key**: the `key` from the Banner snippet's `atOptions`.
   - **Banner Size**: the size you chose in Adsterra.
   - **Banner Host**: the host from the snippet's `invoke.js` URL. Pasting the whole URL works.
   - **Banner Zones**: any further banner snippets, pasted as Adsterra gives them.
   - **Native Banner Script URL** and **Native Banner Container ID**: from the Native snippet.
   - Social Bar and Popunder script URLs, if you use them.
4. Change the in-game message (**In-game Ads** › **Message**). Its default says "This server is
   powered by plugged.host".
5. If you turn on the ad-block response, set **Custom Message**. The default text asks users to
   allow ads on plugged.host's own panel.
6. To let users earn tokens, switch **Enable the Start Gate** on in the form first (see the
   caution below). Then, under **Tokens — Earning**, enable Linkvertise and enter your
   **Linkvertise Publisher ID** and **Linkvertise API Token**. Leave the whitelist at `lvr=`.
7. Before you turn on the start room or token earning, say so in your terms of service: the
   room makes ad views a condition of starting, and earning sends users to a third-party link
   shortener.

The panel's own web server config sets no `script-src` CSP, so Adsterra needs no change there.
If you add a Content-Security-Policy to the panel, allow your Adsterra hosts.

:::caution
The Ads settings form hides some sections until a switch above them is on. When you save,
hidden fields are reset: switches go **off** and text fields go **empty** or back to their
defaults.

- Saving with **Enable the Start Gate** off turns Linkvertise off, clears its publisher ID and
  link, and switches every waiting-room ad (leaderboard, native, Social Bar, Popunder,
  waiting-room zone, Direct Link) off. That also strips those units from the
  [Queue](/plugins/queue/)'s waiting page. The API token is kept.
- Saving with **Detect Ad Blockers** off sets **Probe Ad Hosts** and **Never on the Console** to
  off.

To keep these values, switch the parent on before saving and set the sub-switches again. Or set
the keys in `.env` and don't save the form afterwards.
:::

## Settings

Admin › Plugins › plugged.host Ads › Settings. Every value is stored in the panel's `.env`.

### General Settings

| Setting | Default | What it does |
|---|---|---|
| Enable Ads, `ADS_ENABLED` | `true` | Master switch for every ad surface, including in-game ads and the start room. |

### Adsterra

Leave a field empty to skip that format. Values that don't look like what Adsterra issues are
dropped, so a pasting mistake gives an empty slot, never broken markup.

| Setting | Default | What it does |
|---|---|---|
| Banner Key, `ADS_ADSTERRA_BANNER_KEY` | empty | The main banner's key (8-64 letters and digits). Empty means no main banner. |
| Banner Size, `ADS_ADSTERRA_BANNER_SIZE` | `728x90` | Must match the size in Adsterra. One of the six banner sizes. |
| Banner Host, `ADS_ADSTERRA_BANNER_HOST` | `www.highperformanceformat.com` | Host the main banner loads from, and the default host for pool zones. Adsterra rotates hosts, so copy yours from your snippet. |
| Banner Zones, `ADS_ADSTERRA_BANNERS` | empty | More banner zones, stored as `key:WIDTHxHEIGHT:host` entries, comma separated (host optional). The form accepts pasted snippets. At most 24. |
| Native Banner Script URL, `ADS_ADSTERRA_NATIVE_SCRIPT` | empty | The `src` of the Native Banner script (`//host/…/invoke.js`). |
| Native Banner Container ID, `ADS_ADSTERRA_NATIVE_CONTAINER` | empty | The `id` of the empty `div` in the Native snippet. Empty derives it from the script URL. |
| Native Banner Height, `ADS_ADSTERRA_NATIVE_HEIGHT` | `320` | Pixels reserved for the sandboxed native unit. 80-2000. |
| Social Bar Script URL, `ADS_ADSTERRA_SOCIAL_BAR_SCRIPT` | empty | The Social Bar zone. Runs in the page itself, never sandboxed. |
| Social Bar Across the Panel, `ADS_ADSTERRA_SOCIAL_BAR_PANEL_WIDE` | `true` | On: loads on every page that shows ads. Off: only in the waiting rooms. |
| Popunder Script URL, `ADS_ADSTERRA_POPUNDER_SCRIPT` | empty | The Popunder zone. Opens a tab on the next click wherever it loads. |
| Popunder Across the Panel, `ADS_ADSTERRA_POPUNDER_PANEL_WIDE` | `false` | On: any click in the panel can open it. Off: only the waiting rooms run it. |
| Isolate Display Banner, `ADS_ADSTERRA_BANNER_ISOLATE` | `true` | Render banners in a sandboxed iframe. Off puts them in the page itself (and they are not refreshed). |
| Isolate Native Banner, `ADS_ADSTERRA_ISOLATE` | `true` | The same for the native unit. |
| Frame Sandbox, `ADS_ADSTERRA_FRAME_SANDBOX` | `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms` | The iframe's `sandbox` tokens. `allow-same-origin` and `allow-forms` are always added (Adsterra needs them to fill). Top navigation is never allowed. |

### Placements & Visibility

| Setting | Default | What it does |
|---|---|---|
| Show on App Panel (Client Area), `ADS_SHOW_APP_PANEL` | `true` | Ads on the server list, account pages and other app panel pages. |
| Show on Server Panel, `ADS_SHOW_SERVER_PANEL` | `true` | Ads on server pages (console, files, …). |
| Show on Admin Panel, `ADS_SHOW_ADMIN_PANEL` | `false` | Ads in the admin area. |

### Ad Slots

| Setting | Default | What it does |
|---|---|---|
| Maximum units per page, `ADS_MAX_UNITS_PER_PAGE` | `2` | Most named-slot units one page may show. `0` shows none. 0-20. |
| Sidebar footer, `ADS_SLOT_SIDEBAR_FOOTER` | `true` | Native unit at the foot of the sidebar. |
| Under the plan picker, `ADS_SLOT_CREATE` | `true` | 300x250 on the Create server page. |
| Under the store transactions, `ADS_SLOT_STORE` | `true` | 300x250 on the Resource Store. |
| Server-list footer, `ADS_SLOT_SERVER_LIST` | `true` | 300x250 under the server list. |
| Onboarding / install page, `ADS_SLOT_ONBOARDING` | `true` | 300x250 on the server installing page. |
| Server tools (in-content), `ADS_SLOT_SERVER_TOOLS` | `false` | 468x60 strip (320x50 on phones) under the page header on server pages. |

### Ad Refresh

| Setting | Default | What it does |
|---|---|---|
| Refresh ads, `ADS_REFRESH_ENABLED` | `true` | Reload sandboxed units after time in view. Social Bar, Popunder, sponsored banners and non-isolated units are never refreshed. |
| Every (seconds in view), `ADS_REFRESH_SECONDS` | `5` | Interval for everyone. 5-3600. |
| With plugged.host Plus (seconds in view), `ADS_REFRESH_PLUS_SECONDS` | `10` | Interval for Plus owners. Never faster than the one above. 5-3600. |

Adsterra states no minimum refresh interval. Other networks do (Google's is 30 seconds), so check
your network's rules before keeping 5 seconds.

### Styling & Appearance

| Setting | Default | What it does |
|---|---|---|
| Z-Index Layer, `ADS_Z_INDEX` | `0` | Stacking order of the ad slot. `0` keeps ads under dropdowns and modals. |

### In-game Ads

| Setting | Default | What it does |
|---|---|---|
| Send in-game ads, `ADS_IN_GAME_ENABLED` | `true` | Send the message to Minecraft servers. Needs **Enable Ads**, but no Adsterra unit. |
| Message, `ADS_IN_GAME_MESSAGE` | `This server is powered by plugged.host` | Sent as `say <message>`. One line, up to 200 characters. Replace it with your own. |
| Every (minutes), `ADS_IN_GAME_INTERVAL` | `60` | How often each server gets it. 5-1440. |

### Role Exemptions

| Setting | Default | What it does |
|---|---|---|
| Exempt Roles, `ADS_EXEMPT_ROLES` | empty | Comma-separated role names whose members see no ads. The [Queue](/plugins/queue/) also lets them skip the start queue. |

### Ad-Block Response

| Setting | Default | What it does |
|---|---|---|
| Detect Ad Blockers, `ADS_ANTIBLOCK_ENABLED` | `false` | Turns detection on. |
| Response, `ADS_ANTIBLOCK_MODE` | `notice` | `notice`, `modal` or `block`. |
| Unlock Delay (seconds), `ADS_ANTIBLOCK_GRACE` | `4` | Modal only: seconds before "Continue anyway" can be clicked. 0-60. |
| Dismissal Duration (hours), `ADS_ANTIBLOCK_DISMISS_HOURS` | `12` | How long the browser remembers a dismissal. Ignored in block mode. 0-8760. |
| Probe Ad Hosts, `ADS_ANTIBLOCK_PROBE` | `true` | Also test whether the ad hosts are reachable, to catch DNS-level blockers. |
| Never on the Console, `ADS_ANTIBLOCK_SKIP_CONSOLE` | `true` | Keep the detector off the server console. |
| Custom Message, `ADS_ANTIBLOCK_MESSAGE` | empty | Replaces the body text. Plain text, one line, up to 500 characters. The heading stays "Ads keep plugged.host free" (language file). |

### Start Credits (the start room)

The section is called "Start Credits" for historical reasons; it configures the start room.

| Setting | Default | What it does |
|---|---|---|
| Enable the Start Gate, `ADS_START_ENABLED` | `false` | Turns the start room on. Does nothing without an Adsterra unit. |
| CPU Threshold (%), `ADS_START_CPU` | `100` | Servers with more CPU than this go through the room. |
| Memory Threshold (MB), `ADS_START_MEMORY` | `2048` | Servers with more memory than this go through the room. |
| Disk Threshold (MB), `ADS_START_DISK` | `10240` | Servers with more disk than this go through the room. |
| Minimum Wait (seconds), `ADS_START_MIN_DWELL` | `15` | Never release before this, even when the server is already up. 0-120. |
| Maximum Wait (seconds), `ADS_START_MAX_DWELL` | `30` | Always release after this. 1-300, and never below the minimum. |
| Grace Period (minutes), `ADS_START_PASS_MINUTES` | `10` | After the room, starts of the same server by the same user skip it for this long. 0-1440. |
| Claim Lifetime (minutes), `ADS_START_CLAIM_TTL` | `30` | How long a started Linkvertise trip can still be redeemed. 1-1440. |

### Tokens — Earning

Shown only while **Enable the Start Gate** is on, though earning works with the start room off.
The Tokens page itself belongs to [Economy](/plugins/economy/).

| Setting | Default | What it does |
|---|---|---|
| Enable Linkvertise, `ADS_START_LINKVERTISE_ENABLED` | `false` | Offer Linkvertise on the Tokens page. It stays off until the API token is set. |
| Linkvertise Publisher ID, `ADS_START_LINKVERTISE_USER_ID` | empty | Your numeric Linkvertise user ID. Set: the Tokens page loads Linkvertise's Full Script and turns the earn link into a Linkvertise trip. Empty: the static link below is used. |
| Full Script Link Whitelist, `ADS_START_LINKVERTISE_WHITELIST` | `lvr=` | Fragments of the links Linkvertise's script may rewrite. Never empty (an empty list would rewrite every link on the page). Letters, digits and `._/=*-` only. |
| Linkvertise Link, `ADS_START_LINKVERTISE_LINK` | empty | A publisher link (`https://`) used when no Publisher ID is set. Placeholders: `{return}`, `{return_b64}`, `{nonce}`. |
| Linkvertise API Token, `ADS_START_LINKVERTISE_TOKEN` | empty | The Anti-Bypass verification token. Required: every completion is checked against Linkvertise's API. Leave the field blank to keep the stored token. |
| Tokens per Completion, `ADS_START_LINKVERTISE_REWARD` | `1` | Tokens paid per verified completion. 1-50. |
| Completions per Day, `ADS_START_LINKVERTISE_DAILY_CAP` | `5` | Paid completions per user per day. `0` means no cap (not recommended). |

### Start Gate — Waiting Room Ads

Shown only while **Enable the Start Gate** is on. These switches also decide what the
[Queue](/plugins/queue/)'s waiting page shows.

| Setting | Default | What it does |
|---|---|---|
| Also Gate Server Navigation, `ADS_START_GATE_ON_NAVIGATION` | `false` | Also send users to the room when they open any page of a stopped server over the thresholds. This catches starts made outside the panel, but costs an ad view to open the file manager of a stopped server. |
| Leaderboard, `ADS_START_GATE_BANNER` | `true` | The 728x90/468x60/320x50 banner at the top of the waiting pages. The unused pool zones follow it either way. |
| Native Banner, `ADS_START_GATE_NATIVE` | `true` | The native unit on the waiting pages. |
| Waiting-Room Zone, `ADS_START_GATE_INTERSTITIAL` | `true` | Load the waiting-room script below. |
| Waiting-Room Script URL, `ADS_ADSTERRA_GATE_SCRIPT` | empty | A Social Bar or Vignette zone used only on the waiting pages, so their earnings are separate. |
| Social Bar, `ADS_START_GATE_SOCIAL_BAR` | `true` | Load the Social Bar zone on the waiting pages, whatever its panel-wide switch says. |
| Popunder, `ADS_START_GATE_POPUNDER` | `true` | Load the Popunder zone on the waiting pages. |
| Direct Link Button, `ADS_START_GATE_DIRECT_LINK` | `false` | Show a "visit our sponsor" button that opens the Direct Link in a new tab. |
| Direct Link URL, `ADS_ADSTERRA_DIRECT_LINK` | empty | The Adsterra Direct Link (`https://`). |

## Commands

| Command | What it does |
|---|---|
| `plugged-host:ads-in-game [--dry-run] [--all]` | Sends the in-game ad to this minute's share of Minecraft servers. `--dry-run` lists them without sending. `--all` takes every eligible server, not just this minute's share. |

Run as `sudo -u www-data php artisan <command>` from `/var/www/pelican`. On the scheduler:
`plugged-host:ads-in-game` every minute, while **Enable Ads** and **Send in-game ads** are both
on.

## Notes

- No ad keys ship with the plugin: the Adsterra and Linkvertise fields start empty, and you
  enter your own account's values. Two defaults name plugged.host and need replacing: the in-game
  message and the ad-block text (**Custom Message**). The ad-block heading ("Ads keep plugged.host
  free") and the rest of the wording are in the plugin's language files, not in settings.
- A unit that suddenly stops filling usually has a stale host or script URL. Adsterra rotates
  them, so copy the current ones from its dashboard.
- Linkvertise needs Anti-Bypass switched on in its own dashboard. Without it no verification
  code comes back and nobody can earn.
- With the ad-block response in modal or block mode, its overlay also appears on the waiting
  pages. Use notice mode together with the start room.
- `block` mode locks paying users out of their servers over a browser extension. Detection is a
  heuristic, so start with the notice.
- Nothing buys a way past the start room. The grace period after it is the only relief.
