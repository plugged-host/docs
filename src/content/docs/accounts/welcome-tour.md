---
title: Welcome tour
description: The short guide drawn over the real panel for new users, its two parts, and how to turn it on or show it again.
---

The welcome tour is a short guide drawn over the real panel. The page is dimmed, the part a step is
about stays lit with an accent ring, and the step's card sits next to it, so someone told "open
Settings" later knows where Settings is. Users see it once; admins turn it on and decide when
everyone sees it again. It is off by default.

## What it does

### The two parts

The tour runs on the pages it explains, so it has two parts:

| Part | Where | Steps |
|---|---|---|
| Panel | The server list | Welcome; the sidebar's rows (a bullet per row it shows, named as it is there); the usage card, when the sidebar shows it (bullets for credits and tokens only where those are on); the account row; then Create Server (when users may create servers) and the first server card, or, with no server yet, the empty list and Create Server |
| Server | The next console the user opens after the first part | The console; the power buttons; name, status and address; the setup guide's callout (a Minecraft server whose setup waits); the server's sidebar (bullets only for pages the user may open); Settings (when the user may open it); the logo back home |

### Buttons

- Step 1 only acknowledges: its one button is **Show me around**, with no way out.
- After it, every step has **Back** and **Skip tour** at the start and one filled button at the end:
  **Next**, or the last step's.
- The first part ends with **Show me {server}** (opens the first server, where the second part
  starts), **Create my first server** (opens the create page) or **Finish**. Beside the first two,
  **Not now** ends the first part where it is; the second part still comes on the next console.
- **Skip tour** on the first part ends both parts. On the second part it ends that part, like its
  **Finish**.
- Escape is **Skip tour**, except on the first step.
- **Replay Welcome Tour** in the menu under the user's name starts both parts again.

The overlay takes every click, so the page cannot be used mid-tour and the user is always on the
page the step talks about.

### Layout

- The card sits beside the lit element (right, below, left or above, whichever fits), with a dot
  per step and "Step n of m" above the text.
- A step whose element is not on screen (a narrow window hides the sidebar; the tour does not open
  the phone menu) and the welcome step show a wider card in the middle of the window.
- Under 640 px wide the card is a sheet across the top or bottom, on the side the element is not on.
- In a right-to-left language the card sits beside the sidebar on the right.

### Showing it again

Each user's progress is kept per tour version. Raising **Tour Version** shows the tour again to
everyone who already finished or skipped it, for example after the panel changed. Turning the tour
off hides it and the menu entry for everyone at once; the stored steps stay, so turning it on again
continues where each user was.

## Setup

1. Open Admin › Settings › Accounts › Welcome Tour.
2. Turn on **Show the Welcome Tour** and save.
3. Open the server list as a user who has not seen it: the tour starts with "Welcome to {panel
   name}".

## Settings

### Admin › Settings › Accounts › Welcome Tour

| Setting | Default | What it does |
|---|---|---|
| Show the Welcome Tour | off | Users who have not finished or skipped it see the guide over the server list, then over the first console they open |
| Tour Version | 1 | Raise it to show the tour again to everyone (1 to 1000) |

## Permissions

| Permission | Gives |
|---|---|
| `settings.update` | Changing the welcome tour settings |

## Notes

- The tour's text is translated into every offered [language](/accounts/languages/).
- Sidebar rows the panel does not show (a feature turned off) get no bullet.
- The tour does not mention noprofit.space and works the same with or without
  [noprofit.space](/accounts/noprofit/).
