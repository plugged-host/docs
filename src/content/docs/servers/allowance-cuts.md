---
title: Allowance cuts
description: How an account's servers shrink by themselves, evenly, when the account's allowance goes down.
---

When an account's allowance goes down, its servers give the difference back by themselves. What the
servers use beyond the new allowance, at most what was taken away, comes off all of the account's
servers evenly. An account that was already over its limit before keeps that part; an account with
room to spare loses nothing. Users see the result as smaller limits on their servers and a
notification; admins see it in each server's activity log.

## What it does

### When a cut is recorded

| The allowance went down because | Recorded |
|---|---|
| An admin lowered CPU, memory or disk in Admin › Settings › Hosting › Games › Allowance per Account | On save, for every account that owns a server |
| The account's linked Discord account left your Discord server, or was unlinked, and its Discord tier is gone | When the Discord membership check sees it ([Discord](/discord/integration/)) |

- A limit going from a value to none (0) takes nothing.
- A limit going from none to a value takes whatever is over the new value.
- Without noprofit.space, Resource Store purchases are kept for good and never cut.

### How a cut is carried out

The `settle_allowance_cuts` task carries out every account's open cuts together, once a minute.
A create or resize of that account cannot run at the same moment, so it always sees the new sizes.

1. **Asked**: the open cuts added up, per resource.
2. **Taken**: what the account's servers use beyond the allowance now, at most what was asked.
3. **Spread** evenly over the account's servers (two servers half each, five a fifth each). A server
   that would drop below its floor gives what it can, and the others share the rest:

   | Resource | Floor |
   |---|---|
   | CPU | 25% |
   | Memory | 1 GiB |
   | Disk | 1 GiB, and never below what the server stores now plus 1 GiB |

   Servers without a limit on a resource give none of it. A server whose node does not answer gives
   no disk, since its stored size is unknown.
4. The new limits are saved and sent to Wings, which applies them to the running containers.
5. Each server's activity log gets `server:allowance.cut` with the reason and what came off. The
   owner gets a [notification](/accounts/notifications/) "Your servers have fewer resources now",
   listing each server and what it lost.

What no server can give stays untaken. New servers and resizes are then refused until the account
fits again ([Creating servers](/servers/create-server/#allowance)).

## Requirements

- An allowance with limits: Allowance per Account in Admin › Settings › Hosting › Games (0 is no
  limit, and an unlimited resource is never cut).
- Stock Wings is enough.

## Setup

Nothing to set up. Lowering Allowance per Account and saving records the cuts; they are carried out
within a minute.

:::caution
Lowering Allowance per Account shrinks the servers of every account that is then over it, within a
minute. A server near its disk floor keeps what it stores plus 1 GiB, but memory and CPU can go
down to 1 GiB and 25%. Check what accounts use before you lower it.
:::

## Settings

| Setting | Default | What it does |
|---|---|---|
| Hosting › Games › Allowance per Account › CPU (%) | 0 | Lowering it records a CPU cut; 0 is no limit |
| Hosting › Games › Allowance per Account › Memory | 0 | Lowering it records a memory cut (MiB) |
| Hosting › Games › Allowance per Account › Disk | 0 | Lowering it records a disk cut (MiB) |

## Background tasks

| Task | Runs | Does |
|---|---|---|
| `settle_allowance_cuts` | Every minute | Carries out every account's open cuts |

## Notes

- Disk never goes below what a server stores plus 1 GiB, because Wings stops a server that is over
  its disk limit.
- An account that has no allowance at all (no plan with noprofit.space) loses nothing: it cannot
  create or grow servers, and keeps what it has.
- With noprofit.space connected, a cut is recorded when the account's plan there gets smaller (a
  lower tier, a Discord server left), seen at sign-in or by the every-minute account sync. A plan
  shared with other services only cuts what this panel's share lost, never what another service
  took from the shared pool. The Allowance per Account settings are not used then. See
  [noprofit.space](/accounts/noprofit/).
