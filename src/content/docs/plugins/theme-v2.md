---
title: Theme v2
description: The panel's look - dark only, one accent colour you choose, a sidebar that carries the menu, notifications and the account's balance, and responsive server cards.
sidebar:
  order: 16
---

plugged-host-theme-v2 is the panel's look on all three panels (admin, client and server): dark
surfaces, Space Grotesk for text and JetBrains Mono for numbers and the console, and one accent
colour you pick in its settings. It drops the top bar and puts everything it held in the sidebar,
gives the client panel a navigation of its own, and redraws the server cards on the server list
so they stay readable at any width.

## What it does

- **Dark only.** Dark mode is forced on every panel and the light/dark switcher is gone.
- **No top bar.** On every panel the account menu and the notifications move into the sidebar.
  A notifications button with the unread count sits under the logo.
- **A client-panel sidebar.** Pelican's client panel has no navigation; the theme adds a flat one:
  Home (the server list, with the number of servers you own), the Resource Store, plugged.host
  Plus and Tokens (each only when the [economy](/plugins/economy/) page exists and you may open
  it), Backups (the [storage](/plugins/storage/) plugin's backups portal, only while that plugin
  is enabled), Profile Settings, and Admin Panel for admins.
- **Usage and balance.** At the foot of the sidebar on the client and server panels: how much of
  the account's plan its servers use, the token balance and the credit balance. Each links to the
  page where it is topped up, and they refresh every minute. Needs
  [plugged-host-economy](/plugins/economy/); without it the block doesn't appear.
- **Server cards that fit.** The cards on the server list lay out by their own width: one line per
  resource when narrow, three columns with the address underneath when medium, all four in a row
  when wide. The whole card opens the console (middle-click opens a new tab); the power menu and
  the address don't. Cards refresh every 15 seconds.
- **One profile page.** The profile page always opens on the client panel. When accounts are
  managed outside the panel ([plugged-host-noprofit](/plugins/noprofit/)), it keeps only the
  panel's own tabs (API keys, SSH keys, activity, customization) and moves language and time zone
  into Customization. Standalone, Pelican's tabs all stay.
- **The accent colour.** Buttons, links, the active page and focus rings use the accent you pick:
  one of Tailwind's palettes or any colour. Fills stay readable with white text and accent text
  stays readable on the sidebar; a custom colour that is too light is darkened until it is. The
  same accent is applied to core's standalone sign-in and error pages and to the
  [storage](/plugins/storage/) backups portal. No rebuild needed.

## Requirements

- [plugged-host-core](/plugins/core/).
- Optional: [plugged-host-economy](/plugins/economy/) for the store, Plus and Tokens rows and the
  balance block; [plugged-host-storage](/plugins/storage/) for the Backups row.
- The panel's assets rebuilt after installing or updating the plugins: the theme's stylesheet is
  compiled by Pelican's Vite build (see [Install the plugins](/panel/plugins/#rebuild-the-assets)).
- Browsers load the two fonts from Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`).

## Setup

Enable it and rebuild the assets as described in [Install the plugins](/panel/plugins/). Then pick
the accent colour in its settings.

## Settings

Admin › Plugins › plugged.host Theme v2 › Settings.

| Setting | Default | What it does |
|---|---|---|
| Accent (`THEME_V2_ACCENT`) | `blue` | The accent colour: `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, or a custom `#rrggbb` or `#rgb` (choose "Custom colour" in the form). Anything else falls back to blue. |

## Notes

- **The Backups row follows the storage plugin.** It appears only while plugged-host-storage is
  enabled, and opens its backups portal: the storage plugin's **Portal address**
  (`BACKUPS_PORTAL_URL`) when set, else `/backups` on the panel. See
  [Backups portal](/plugins/storage/#backups-portal). Core's sidebar visibility setting
  (`NAV_HIDDEN_ITEMS`) can't hide this row, nor any other row of the client sidebar.
- **Rebuild after every Pelican upgrade.** An upgrade replaces `public/build`, and the theme's
  stylesheet with it; the panel's pages fail until you run the build again.
- **No light mode.** There is none to switch to. Turning the theme off gives Pelican's default
  look back, with its top bar and light mode.
- **Labels name plugged.host's products.** "plugged.host Plus", "Tokens" and the Resource Store
  come from the economy plugin's pages; the theme shows whatever those pages call themselves.
- **It is a plugin, not a Pelican theme.** Its category is `plugin`, so Pelican's handling of theme
  plugins (one enabled at a time) doesn't apply to it: disable any other theme yourself.
