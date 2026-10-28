---
title: Account standing
description: How abuse suspensions count against the owner's account and keep it from creating servers for a while, or for good.
---

Every abuse suspension is a **strike** on the account that owns the server, and the strikes give the
account its **standing**: the more there are, the longer it cannot create new servers. Users see
their standing on their account page and on the create page when it blocks them; admins set the
thresholds.

## What it does

### Levels

| Strikes (defaults) | Level | Creating servers |
|---|---|---|
| 0 | Good | Allowed |
| 1 | Warning | Allowed |
| 2 | Limited | Refused for 7 days after the latest strike |
| 3 | Very Limited | Refused for 30 days after the latest strike |
| 4 or more | Suspended | Refused, with no end |

Once a limit's days are over the level stays, but the account may create again; the next strike
starts the days anew. Admins are never limited. The standing changes nothing else: running servers,
starts, resizes and the store work as before.

### What is a strike

- A server suspended by [abuse protection](/safety/abuse/) in the suspend mode gives its owner a
  strike, with the suspension's reason. A devbox's strike goes to its person
  ([Devboxes](/servers/devboxes/)).
- A server counts once, however often it is caught.
- A server that was already suspended, an admin's suspension and a suspension from
  noprofit.space are no strikes ([Suspension](/safety/suspension/)).
- Dismissing the finding in Admin › Abuse takes the strike for that server back.
- Strikes are kept when the server is deleted, and deleted with the account.

Recording a strike never holds up or undoes the suspension: it happens in the background, and a
failure is only logged.

### Where it shows

- **Create server**: an account whose standing refuses creating sees its level and until when
  instead of the form ("Your account standing is Limited, so you cannot create servers until
  {date}."). The create itself is refused too, so the API and neo are refused the same way.
- **Account page**: once the account has a strike, a **Standing** card shows the level, the number
  of suspensions and whether it may create servers (and until when).

## Setup

Standing works on its own with the defaults. To change the thresholds:

1. Open Admin › Settings › Security › Abuse.
2. Turn on **Advanced mode** (the switch at the top of Admin › Settings › General › Application) if
   the standing fields are hidden.
3. Set the fields below and save. The thresholds must not go down (Limited From ≤ Very Limited From
   ≤ Suspended From); two equal ones skip a level. The save refuses anything else.

## Settings

### Admin › Settings › Security › Abuse

| Setting | Default | What it does |
|---|---|---|
| Limited From (Suspensions) | 2 | Strikes from which the account is Limited; one strike below it is a Warning (1 to 100) |
| Limited For (Days) | 7 | Days after the latest strike a limited account cannot create servers (1 to 3650) |
| Very Limited From (Suspensions) | 3 | Strikes from which the account is Very Limited (1 to 100) |
| Very Limited For (Days) | 30 | Days after the latest strike a very limited account cannot create servers (1 to 3650) |
| Suspended From (Suspensions) | 4 | Strikes from which the account cannot create servers at all (1 to 100) |

## Permissions

| Permission | Gives |
|---|---|
| `settings.update` | Changing the standing thresholds |
| `abuse.manage` | Dismissing a finding, which takes its strike back |

## Notes

- Only abuse suspensions count. Suspending a server by hand gives no strike.
- With [noprofit.space](/accounts/noprofit/) connected, each strike also goes there, and accounts it
  manages get its standing (counted across all its services, with a link to its standing page, and
  kept there when you dismiss the finding) instead of the settings above. When it does not answer,
  nobody is limited.
