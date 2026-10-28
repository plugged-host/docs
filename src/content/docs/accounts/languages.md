---
title: Languages
description: Which languages the panel offers, how users and admins pick one, and what stays in English.
---

The panel speaks eleven languages. Users pick theirs on the sign-in page or in their account; a
browser set to an offered language opens in it by itself. Admins set the default language and can
stop users from changing theirs. Every other language Calagopus ships is switched off completely:
it is not built, not offered and not accepted.

## What it does

### Offered languages

The pickers show each language in its own words, in this order:

| Language | The picker shows | Notes |
|---|---|---|
| English | English | The source language |
| German | Deutsch | Every string, admin pages and mails included |
| Arabic | العربية | Right to left ([below](#right-to-left)) |
| Russian | Русский | |
| Turkish | Türkçe | |
| Indonesian | Bahasa Indonesia | |
| Portuguese (Brazil) | Português (Brasil) | |
| Vietnamese | Tiếng Việt | |
| French | Français | |
| Ukrainian | Українська | |
| Uzbek | Oʻzbekcha | Latin script |

The panel's own pages, notifications and mails are translated into all of them. Admin pages are in
English and German; in the other languages they show in English.

### How a language is picked

- **Browser**: on a first visit the panel picks the first browser language it offers. Both `pt-PT`
  and `pt-BR` find Portuguese (Brazil). A browser set to a language it does not offer, such as
  Polish, opens in the default language.
- **Sign-in page**: a language picker under the form.
- **Account**: the **Language** field on the account page.
- **Admin › Users**: an admin can set a user's language.
- **Default**: Admin › Settings › General › Application › **Language** is what users get when
  nothing else picks one.

A language that is not offered is refused everywhere: as an account's language, at registration, in
the admin user form and as the default. An account that held such a language opens in the default
language.

### What stays in English

Where a library has no locale for a language, its own text stays English:

- cron descriptions on the schedules pages in Uzbek;
- the file editor's menus in Arabic, Indonesian, Vietnamese, Ukrainian and Uzbek.

Anything a translation lacks falls back to English. Names stay as they are: the panel's name,
product names and anything else an admin sets in the settings.

### Right to left

In Arabic the whole layout mirrors: the sidebar is on the right, drawers and menus open from the
right, and arrows point the other way. Technical text stays left to right: the console and its
command line, the file editor, file paths, breadcrumbs, server addresses and the SFTP host and
username. Numbers and dates use Latin digits (0-9) in every language.

## Settings

| Setting | Default | What it does |
|---|---|---|
| Admin › Settings › General › Application › Language | English | The language users get when their browser and account pick none |
| Admin › Settings › Accounts › User › Allow Changing Language | on | Users can change their language. Off hides the pickers on the sign-in and account pages |

## Notes

- To offer other languages in your own build of the panel, see [Branding](/panel/branding/).
- Mails go out in the user's language.
