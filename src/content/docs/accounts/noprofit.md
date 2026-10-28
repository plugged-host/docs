---
title: noprofit.space
description: The optional connection to noprofit.space, plugged.host's own account service. A panel of your own leaves it off.
---

[noprofit.space](https://noprofit.space) is the account service behind plugged.host and its sister
services: one account with its plan, credits and linked Discord, shared by every panel. Its
accounts app is not open source and not something you can run yourself, so these docs don't cover
connecting to it.

The connection is off by default and the panel is complete without it: every feature has its own
standalone version, and the noprofit.space version only takes over while the connection is on.

## Without it (the default)

| What | How it works |
|---|---|
| Sign-in | Calagopus's own: passwords, two-factor, security keys, OAuth providers, registration |
| Profile, email, password | Edited in the panel |
| SFTP passwords | The panel password |
| Credits and the Resource Store | The panel's own balance and prices ([credits](/economy/credits-and-tokens/)) |
| Allowance | The games settings ([creating servers](/servers/create-server/)) |
| Deleting an account | Admins delete users ([Admin › Users](/accounts/admin-users/)) |
| Account standing | The panel's own strikes ([account standing](/safety/standing/)) |
| AI providers and limits | The panel's own provider slots ([neo](/ai/neo/)) |

## What changes while it is connected

For reference, so the rest of these docs make sense where they mention it:

- Everyone signs in at noprofit.space; the login page goes straight there. Registration, password
  resets (except for admins), the panel's own OAuth providers and security keys are off.
- Profile, email and password live on noprofit.space and are mirrored into the panel every minute,
  with the account's plan, credits and Discord link. A smaller plan shrinks servers that are then
  over it ([allowance cuts](/servers/allowance-cuts/)).
- SFTP password logins of accounts made by noprofit.space are checked by noprofit.space.
- Credits, the Resource Store and its prices, and account standing are noprofit.space's, shared
  across its services.
- Deleting the account on noprofit.space deletes the panel user and its servers.
- Admin › Users has no Create button, and a linked user's username and email cannot be changed
  there.

## Keep a way in

The setting lives in Admin › Settings › Accounts › noprofit.space. If you ever turn it on, first make
sure an admin can sign in without it: an admin with a panel password
(`panel-rs users create --admin true`) signs in at `/auth/login?local=1` while everyone else is sent
to noprofit.space. The panel refuses to turn the connection off for admins who have no panel
password.
