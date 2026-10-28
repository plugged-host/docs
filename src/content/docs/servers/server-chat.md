---
title: Server chat
description: The chat between a server's owner and its subusers, on the server's own sidebar.
---

Server › Chat is a chat between a server's owner and its subusers, for the people who share a
server. It is not an in-game chat and has nothing to do with the game's players. It sits in the
server's sidebar below Activity, for everyone with `chat.read`.

## What it does

- **Messages**: your own messages show as bubbles at the end of the line; everyone else's show at
  the start, beside their avatar. One person's messages at most 5 minutes apart form one run under
  one name and time. Line breaks are kept, and each message takes its text direction from its own
  script.
- **Days and times**: each day starts with a label (Today, Yesterday, the weekday within the last
  week, else the date), in the viewer's panel language. A time reads "now", "5 minutes ago" within
  the hour, then the time of day; the full date and time are in its tooltip.
- **Scrolling**: the chat opens at the newest message. New messages scroll into view only while the
  reader is at the bottom; further up, a **New messages** button jumps down. Scrolling to the top
  loads the 50 messages before; **Load older messages** does the same by hand.
- **Writing**: Enter sends, Shift+Enter starts a new line (on a touch screen, Enter is a new line
  and the send button sends). A message is at most 2000 characters; a counter shows from 1800. A
  sent message shows at once, faded until the panel has stored it; if sending fails it goes back
  into the field.
- **Updates**: the page asks for new messages every 5 seconds while it is open.
- Without `chat.write`, the foot of the chat says that the person can read but not write.
- A deleted account's messages stay, without a name and with a blank avatar.
- Deleting the server deletes its chat.

The chat is not the activity log: writing a message creates no activity entry.

## Requirements

Nothing outside the panel. Stock Wings is enough: the chat never touches the node.

## Setup

Nothing to turn on. Give subusers `chat.read` and `chat.write` on the server's Subusers page; the
owner has both already.

## Permissions

Server permissions, in the **chat** group:

| Permission | Allows |
|---|---|
| `chat.read` | Reading the server's chat |
| `chat.write` | Writing in it (reading is not implied) |

## Notes

- Subusers who existed when the chat was added to the panel got both permissions with it, so nobody
  lost access.
- The chat is per server: a person who shares several servers has one chat for each.
