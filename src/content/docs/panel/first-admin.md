---
title: First admin
description: Create the first admin from the command line, set the panel's URL and name, and only then open the panel to the world.
---

A fresh panel with no users shows a setup screen to the first visitor, and that visitor becomes the
admin. Create the admin yourself before the panel is reachable from outside.

## Run panel commands with the service's environment

`panel-rs` subcommands read the same environment as the service. The simplest way to give them
exactly that environment, as the panel's user, is `systemd-run`:

```bash
sudo systemd-run --quiet --pty --collect \
  -p User=calagopus -p WorkingDirectory=/var/lib/calagopus \
  -p EnvironmentFile=/etc/calagopus/panel.env \
  /opt/calagopus/current/panel-rs <command>
```

The rest of these docs write commands as `panel-rs <command>` and mean this. A subcommand does its
job and exits; it does not start a second panel.

## Create the admin

```bash
panel-rs users create --admin true
```

It asks for the username, email and password (or takes `--username`, `--email`, `--password`,
`--name-first`, `--name-last`). Once a user exists, the setup screen never appears.

Keep this admin's password login even if you later connect [noprofit.space](/accounts/noprofit/):
it is the way back in when outside sign-in fails.

:::note
You can use upstream's setup screen instead. Open it through an SSH tunnel to the loopback port
(`ssh -L 8000:127.0.0.1:8000 you@panel.example.com`, then `http://localhost:8000`) so nobody else
can reach it first. It also walks through the first location, node and server.
:::

## Set the panel's URL and name

Sign in (through the tunnel, or after the [web server](/panel/web-server/) is up) and open
Admin › Settings › General › Application:

| Setting | Set it to |
|---|---|
| Name | Your panel's name. It is the page title, the mail sender name and the name in every text that says "the panel" |
| URL | `https://panel.example.com`, without a trailing slash. Links in mails, OAuth callbacks, the status data and every outside service use it |
| Additional URLs | Other addresses the panel answers on, if any |

Then Admin › Settings › General › Metadata for the description, preview image and
[theme colour](/panel/branding/), and Admin › Settings › Mail for outgoing mail.

## Open it to the world

Now enable the [web server](/panel/web-server/) site. From here on, everything is set in
Admin › Settings: the [configuration](/panel/configuration/) page lists every section.
