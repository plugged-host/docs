---
title: Notifications
description: The panel's notification inbox, what sends a notification and to whom, and how long notifications are kept.
---

Notifications are what the panel tells a person after the fact, kept until they read or delete
them: a move that finished, a failover, a modpack installed while they were away. Every user has an
inbox; admins also get notifications about things that need their attention. There is nothing to
set up.

## What it does

### The inbox

**Notifications** is a row of the sidebar, under the search, on the dashboard, on a server and in
the admin area. Its end shows the number of unread notifications (99+ above 99). The count is
refreshed every 30 seconds.

The row opens a panel at the side of the window: newest first, 25 at a time, with **Show more** for
older ones. An unread notification has an accent bar at its start edge (screen readers hear "Unread
notification"). Each shows its title, how long ago it came, its text and lines of detail (a new
address, why a move failed, an error), and:

- **Open server** (**View backups** for a backup), while the server still exists: marks it read and
  opens the server (its Backups page). One about the account instead (a membership or panel access
  ending, a gift) links to its page (**Renew**, **View membership**), and one about a server upgrade
  to the server's Settings › Upgrades (**Add time**, **Keep it awake**); each marks it read the same
  way.
- **Mark as read**, while it is unread.
- The **×** at its top, which deletes it.

The header has **Mark all as read** (while any is unread) and **Clear**, which deletes them all
without asking. While the panel is open its list is refreshed every 30 seconds. Reading or deleting
notifications is not written to the activity log.

### What sends one

| Notification | Who gets it | When |
|---|---|---|
| Server moved | The owner and whoever asked for the move; for a move an admin started (Lighten Load, a membership running out) the owner only | A [move](/servers/moving-servers/) finished: the new location and address |
| Move failed | The owner and whoever asked; nobody for a move an admin started | A move gave up: the server stayed, with the reason when the panel knows it |
| Move failed: {server} | Every admin, and every user whose role has `servers.transfer` | Any move gave up, with the reason or the error |
| Your servers have fewer resources now | The account | An [allowance cut](/servers/allowance-cuts/) took CPU, memory or disk off its servers: each server with what it gave |
| {membership} has ended | The account | A membership ran out and servers on locations it opened are moving ([Credits and tokens](/economy/credits-and-tokens/)) |
| {membership} ends soon | The account, once per end | A membership ends within Hours Before the End (48): the date, whether it renews by itself and whether the balance covers it; **Renew** opens the membership page ([ends-soon notices](/economy/credits-and-tokens/#ends-soon-notices)) |
| Couldn't renew {membership} | The account, once per end | A membership set to [renew automatically](/economy/credits-and-tokens/#auto-renew) could not: how much was missing |
| {user} gave you {membership} | The recipient | Someone [gave them a membership](/economy/credits-and-tokens/#gifts): who, which, how many days and the new end; **View membership** |
| Panel access ends soon | The account, once per end | Paid [panel access](/economy/credits-and-tokens/#panel-access) ends within Hours Before the End: the date and whether the balance covers the next payment; **Renew** opens Account › Panel Access |
| Referral reward | The referrer | A friend who signed up with their [referral link](/economy/credits-and-tokens/#referrals) earned their first tokens: the tokens paid |
| {upgrade} ends soon | Whoever bought it; the owner once the buyer has no access to the server | A keep-awake pass or an extra port, database or backup slot ends within 48 hours, once per end date, with what adding time costs and **Add time** ([server upgrades](/servers/server-upgrades/)) |
| Server stopped while idle | The owner | [Limbo](/starts/limbo/) stopped the server for being idle: how long, when it will be parked and, while one is sold, what a keep-awake pass costs, with **Keep it awake** |
| Server recovered / Server moved to another node | The owner | A [failover](/nodes/failover/) or a drill restored the server on another node: the new address and the time of the backup used |
| Server node issue | The owner, at most once a day per server, and only when the server had already left its node | A failover failed |
| Modpack installed / Modpack installation failed | Whoever started it (on the Modpacks page or through neo) | A modpack install ended ([Minecraft](/games/minecraft/)) |
| {recipe} is installed on {server} / Installing {recipe} on {server} failed | Whoever started it | A framework install ended ([FiveM](/games/fivem/)) |
| World imported / The world could not be imported | Whoever started it | An uploaded world archive became the loaded world, or could not ([Minecraft](/games/minecraft/)) |
| Partnership approved / Partner application not accepted / Partnership ended | The applicant | An admin decided on their [partner](/economy/partners/) application or ended the partnership |
| Partner credits received | The partner | A month's partner credits were paid |
| Partner check failed / Partnership suspended | The partner | The monthly check failed: the month is held until a date; past it the partnership is suspended |
| Partner payments paused / Partner payments resumed / Partner credits changed | The partner | An admin paused or resumed the payments or changed the credits a month; a passing check that lifts a suspension also sends "resumed" |
| Partner application: {guild} / Partnership suspended: {guild} | Every admin, and every user whose role has `partners.manage` | A new partner application; a partnership suspended after its grace period |
| Server installation completed / Server installation failed | The owner | An install or reinstall ended, including the reinstall of a modpack install or a software switch. A failover's or limbo's restore sends none |
| Added to server | The person added | They were made a subuser of a server |
| Removed from server | The person removed | They are no longer a subuser of the server (no **Open server**) |
| Backup completed / Backup failed | Whoever turned on that backup's mail in the server's Settings › Notifications ([Server settings](/servers/server-settings/)) | A backup made by hand or by a schedule ended. System backups send none |

The install, subuser and backup notifications come with the mails the panel already sends for those
events; the mails are unchanged. Not sent: cancelled moves, and what a person watches happen on the
page they started it from.

### Text in the reader's language

A notification is stored as its kind and the values its text needs (a server's name, a location, an
address, amounts), not as text. The panel draws it in whatever language the person reads it in
([Languages](/accounts/languages/)). Admin notifications are in English and German only, like the
other admin pages. Error texts (a modpack, a framework, a world, a move for admins) are shown as the
panel wrote them, at most 300 characters.

### How long they are kept

Read notifications are deleted after 90 days, and any notification after 365 days, so an inbox
nobody opens does not grow without end. Deleting a server keeps its notifications (without **Open
server**); deleting an account deletes its notifications.

## Permissions

A person only ever reaches their own notifications; there is no permission for the inbox. Two admin
permissions decide who gets admin notifications:

| Permission | Gets |
|---|---|
| `servers.transfer` | "Move failed: {server}" for every move that gave up |
| `partners.manage` | New partner applications and suspended partnerships |

Full admins get all admin notifications.

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `delete_old_activity` | Every 30 minutes | Deletes read notifications older than 90 days and any notification older than 365 days, with old activity |

It runs only on the panel instance with `APP_PRIMARY=true`.

## Notes

- Notifications are sent the same way with or without [noprofit.space](/accounts/noprofit/). With
  it connected, a smaller noprofit.space plan is one more cause of an allowance cut, and so of its
  notification.
