---
title: Reviews
description: Ask users to review the host on a public review site, the same way for everyone, in neutral words and with nothing in return.
---

Reviews asks users to write a review of your host on a public review site such as Trustpilot or
Google, the way those sites allow it: everyone the same way at the same point, in neutral words,
with nothing given in return. Users see a prompt above their server list and a link in the account
menu; admins set the review page and when to ask.

## What it does

- **The prompt**: a callout above the server list: "How is {app} working for you?", "Tell other
  users how it went in a review on {site}, good or bad." and a secondary **Write a Review**
  button, which opens the review page in a new tab. Closing the prompt or following the button puts
  it away.
- **The link**: "Review {app} on {site}" in the menu under the user's name, for everyone, always,
  while reviews are on and the account is not suspended.
- **neo** ([neo](/ai/neo/), in the panel chat and on Discord) knows the review page and gives it when
  someone asks where to review the host. It never brings reviews up by itself: an assistant that
  chose when to ask would ask the people it judged happy.

### Who sees the prompt, and when

The prompt shows when all of these hold:

| Condition | Why |
|---|---|
| A review page is set | Off by default |
| The account is at least Ask After days old | People need time to use the service before they are asked |
| The account has a server, its own or one shared with it | It has used the panel |
| The prompt was never closed or followed, or that was at least Ask Again After days ago | One ask per stretch of use, not a nag |
| The account has no admin permissions (an admin, or a role with any admin permission) and nobody is impersonating it | Review sites forbid asking staff |
| The first part of the [welcome tour](/accounts/welcome-tour/) is not running | One thing at a time |

Nothing about how the account is doing (its servers' state, suspensions, spending, support history)
is looked at. Closing or following the prompt is saved with the account, not only in the browser,
so it stays away on every device.

## Setup

1. Find your review site's "write a review" link, for example
   `https://www.trustpilot.com/evaluate/panel.example.com`.
2. Admin › Settings › Accounts › Reviews: enter it as **Review Page** (it must start with
   `https://`). Optional: set **Site Name** if the host name is not what users should see.
3. Save. The account menu shows the link at once; the prompt shows to users who meet the
   conditions above.

## Settings

### Admin › Settings › Accounts › Reviews

| Setting | Default | What it does |
|---|---|---|
| Review Page | empty | The `https://` link where a review is written. Empty turns the prompt and the menu link off |
| Site Name | empty | The site's name users see. Empty: the review page's host without `www.`, such as `trustpilot.com` |
| Ask After (Days) | 3 | How old an account with a server must be before the prompt shows. 0 to 365 |
| Ask Again After (Days) | 180 | How long the prompt stays away once a user closed or followed it. 0: it never comes back. Up to 3650 |

## Notes

- **Keep it neutral.** Review sites remove reviews they see as "review gating": asking only happy
  customers. Do not add a rating step before the review site, "if you like us" wording, star
  counts, or credits, tokens or perks for a review, not even for "any review".
- The prompt only shows on the server list, not on other pages.
- Admins never see the prompt, so test it with a user account that is older than Ask After and has
  a server.
- Clearing Review Page removes the prompt and the menu link for everyone at once.
- Reviews work the same with and without noprofit.space.
