---
title: Branding and theme
description: Run the panel under your own name, logo and colour, the seasonal themes, and what needs a build of your own.
---

The panel can run under any name. Most of the brand is settings; a few files carry plugged.host's
defaults and need [a build of your own](/panel/building/) to change.

:::note
The plugged.host name and logo are not covered by the MIT licence. Replace them on a panel of your
own; keep the "Powered by Calagopus" credit in the footer.
:::

## Settings (no build needed)

| What | Where |
|---|---|
| Name | Admin › Settings › General › Application › Name. Used in the page title, mails and texts |
| Icon and banner | Admin › Settings › General › Application › Icon, Banner (and their light-mode variants). The sidebar shows the icon |
| Description, preview image | Admin › Settings › General › Metadata: what search results and link previews show |
| Accent colour | Admin › Settings › General › Metadata › Theme Color |
| Seasonal theme | Admin › Settings › General › Metadata › Theme |
| Mail wording | Admin › Settings › Mail › Mail Templates |
| Names of paid tiers, the assistant and other product names users see | The settings section of the feature that shows them (for example the memberships in Admin › Settings › Economy, the assistant in Admin › Settings › AI) |

## The look

The panel's theme is plugged.host's "Theme v2": a royal-blue accent on dark ("obsidian") surfaces,
Space Grotesk for text and JetBrains Mono for numbers and code, outline icons, a flat sidebar with
grouped rows. It is dark only.

### Accent colour

Theme Color takes one of the preset swatches or any colour. The theme uses two shades of it: a
darker fill for buttons and active rows, and a lighter shade for text and focus rings on dark
surfaces. The panel derives both from your colour and adjusts them until white text on the fill,
and the text shade on the sidebar, stay readable (4.5:1 contrast). Blue, the default, is the
theme's own.

### Seasonal themes

Metadata › Theme offers **Default**, **Halloween** and **Christmas**. A season keeps the layout and
changes the accent (orange or red, over your theme colour), tints the surfaces (violet or
evergreen) and adds a few small drawings to the sidebar and the phone's top bar. The drawings move
only for people who have not asked their system for reduced motion, and are hidden from screen
readers. Saving applies it at once for you and on the next page load for everyone else; Default
removes it again.

### Changing the theme itself

Surfaces, fonts and radii are design tokens (`--theme-*` CSS custom properties) at the top of the
Theme v2 section of `frontend/src/app.css`, with the matching palette in `frontend/src/theme.ts`.
Change them there and rebuild. The theme assumes a few rules that keep it consistent: flat colours
(the page background is the only gradient), no decorative shadows or glass effects, one filled
button per section, and a box gets a border or a fill but never both.

## Files (a build of your own)

| What | Where |
|---|---|
| Default icon and banner for new installs | `frontend/public/plugged.host.png` |
| Favicons and app manifest | `frontend/public/` (`favicon.ico`, `favicon-*.png`, `apple-touch-icon.png`, `android-chrome-*.png`, `site.webmanifest`) |
| Footer | `frontend/src/elements/Copyright.tsx`: your name and link, the release, "Powered by Calagopus" |
| Default name for new installs | `shared/src/settings/app.rs` |
| Default accent | `shared/src/settings/metadata.rs` |
| Mail layout | `shared/mails/*.html`, wording per language in `shared/mails/variables/<lang>.json` |
| Release name | `VERSION`, or `PANEL_RELEASE` at build time ([versions](/reference/versions/)) |

Before you ship, search for leftovers: `git grep -n "plugged.host" -- frontend/public shared/src/settings`.

## Languages

The panel offers English, German, Arabic (right to left), Russian, Turkish, Indonesian, Brazilian
Portuguese, Vietnamese, French, Ukrainian and Uzbek; every other language is switched off. People
pick theirs on their account page ([languages](/accounts/languages/)).

To offer a different set, change `LANGUAGES` in `frontend/vite-plugins/translations.ts` (each
entry with its name, `rtl` for a right-to-left script, `admin` when admin pages must be
translated too) and give each language you add a complete translation in
`frontend/public/translations/<code>.json`. `pnpm coverage:translations` then checks exactly your
list. Languages from upstream's translation project may be incomplete. Taking a language off the
list needs a migration that moves its users to the default language.

## Optional services

Everything that talks to an outside service is off until configured: noprofit.space, telemetry to
calagopus.com, ads, the Discord bots, the AI assistant, reviews. Nothing in the panel needs
plugged.host's machines or accounts.
