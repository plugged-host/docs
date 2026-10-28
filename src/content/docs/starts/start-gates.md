---
title: Start gates
description: How the panel can hold a server start back before Wings hears about it, and which ways to start a server it closes.
---

A start gate can hold a server start back before it reaches Wings: a parked server has to be restored
first, a new Minecraft server waits for its setup, a busy node makes the start wait in a queue, or an
ad-funded waiting room comes first. The gates are the one place where these features step in, so
none of them can be walked around. Users see the gate's page instead of the console; admins set
up the features behind the gates.

## What it does

- Every start or restart a user asks for goes through the panel's power action: the console's
  power buttons, the server card, quick actions, the EULA and Java-version prompts, and the server
  list's row menu and bulk actions. Stop and kill are never held.
- The panel asks the gates in order. The first gate that holds the start owns it: the browser goes
  to that gate's page, and the page sends the start itself once its condition is met. No later gate
  is asked. Without a hold the start goes to Wings as usual.

  | Order | Gate | Holds a start while | Page |
  |---|---|---|---|
  | 1 | Limbo | the server is parked and has to be restored first | [Limbo](/starts/limbo/) |
  | 2 | Setup | a new Minecraft server waits for its setup, which installs and starts it | [Minecraft](/games/minecraft/) |
  | 3 | Queue | its node is too busy, so the start waits its turn | [Start queue](/starts/start-queue/) |
  | 4 | Ads | an ad-funded waiting room comes first | [Ads](/economy/ads/) |

- From the server list, a held start of one server opens the gate's page. A bulk start counts the
  held servers apart ("2 servers wait before starting") instead of calling them started.
- A gate that fails is logged and skipped. A bug in a waiting room never stops someone from
  starting a server.
- The Minecraft setup starts the server itself once it is done, so it never asks the gates. The
  waiting room sends the start to Wings on the click and only holds the user on its page. The
  start queue sends a released start straight to Wings, past the gates after it.
- Admins keep every way to start a server. Each gate decides on its own whether it holds an admin's
  start: the start queue and the waiting room never do, limbo and the Minecraft setup hold anyone's.

### The other ways to start a server

The gates would mean nothing if a start could go around them, so the panel closes the other ways
for everyone but admins:

| Way | How it is closed |
|---|---|
| The console websocket's start and restart | The websocket token, and the permissions Wings fetches at an SFTP login, never carry `control.start` or `control.restart`. Wings refuses the message. Stop and kill still work over the websocket |
| A schedule step that starts the server | Refused when a step is created, changed or imported, with "a schedule cannot start the server". A restart step is allowed |
| "Start after reinstall" | The switch is hidden from the reinstall dialog and ignored by the API |

## Requirements

- The gates are always active; each one only holds starts while its own feature is on.
- A scheduled restart must never start a stopped server, or a schedule could start a server past
  the gates. The [Wings fork](/nodes/wings/) restarts a running server only from a schedule. On
  stock Wings a scheduled restart of a stopped server starts it.

## Setup

Nothing to set up for the gates themselves. Turn on the features behind them:

1. [Limbo](/starts/limbo/): Admin › Settings › Hosting › Limbo.
2. The Minecraft setup: see [Minecraft](/games/minecraft/).
3. [Start queue](/starts/start-queue/): Admin › Settings › Hosting › Start Queue.
4. The waiting room: Admin › Settings › Ads › Waiting Room (see [Ads](/economy/ads/)).

## Permissions

The gates add no permissions. A start still needs the subuser permission `control.start` (or
`control.restart` for a restart); the gates' pages need the same.

## Notes

- A user's own tools that start or restart a server over the websocket stop working; the panel's
  buttons and the client API's power action still work. A start or restart sent over the websocket
  by hand gets a permission error from Wings. This is expected, not a broken node.
- A schedule may restart a server but not start it. Users who started servers on a timer have to
  keep them running instead.
