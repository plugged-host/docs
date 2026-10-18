---
title: Failover
description: What happens when a node dies, how its servers come back from the storage box, and what you and your users see.
---

When a Wings node stops answering, plugged-host-storage can move its servers to healthy nodes and
restore each one from its latest copy on the [storage box](/storage/storage-box/). This page
explains when that happens, what it does step by step, what it cannot do, and how to step in by
hand. The settings are on the [Storage plugin](/plugins/storage/#failover) page.

## When a node counts as dead

1. Core's node telemetry probes every node once a minute (see [Core](/plugins/core/)).
2. A node whose last `STORAGE_FAILOVER_AFTER_FAILURES` probes (5 by default) all failed looks
   down to the panel: about five minutes offline.
3. The panel then asks every storage box (the storage box and the
   [backup server](/storage/backup-server/), when there is one) to open a TCP connection to the
   node's Wings port from where it is. If any box reaches it, the panel treats it as a network
   problem between the panel and the node and does nothing. Acting then could leave a server live
   twice.
4. If no box reaches the node, or no box answers at all, the panel's own verdict counts.

The failover sweep runs every minute on the panel's scheduler, so all of this needs the
scheduler running (see [Queue and scheduler](/panel/queue-and-scheduler/)).

## Modes

`STORAGE_FAILOVER_MODE`, in Admin › Plugins › plugged.host Storage › Settings › Failover:

| Mode | What happens to each server on a dead node |
|---|---|
| `off` | Nothing. The sweep does not run at all, so drills and resumes do not move on either. |
| `notify` | The owner gets a panel notification, "Your server's node appears offline. Recovery is available.", at most once a day. Nothing is moved. |
| `auto` (default) | The server is recovered onto a healthy node, as below. |

To recover the servers of a node in `notify` mode, switch to `auto`: the next sweep starts.

## How a server is recovered

Recovery is not a transfer: a transfer copies from the old node, which is dead. Each server goes
through these steps, one per minute sweep:

1. **Creating.** The panel writes a recovery record for the server first; while it is under way,
   no other recovery touches the server. It checks that the storage box has a completed copy,
   picks a destination and moves the server there in the panel: new node, new ports (the same
   port numbers where they are free on the destination), status "installing". Egg variables
   with `PORT` in their name that held an old port number get the new one. Then Wings on the
   destination creates the server and runs the egg's install, which lays down the runtime the
   copy leaves out. If Wings refuses, the move is undone and the server stays on its old node
   exactly as it was.
2. **Restoring.** Once the install has finished (or after 90 minutes, whatever the install says),
   Wings downloads the archive of the server's copy from the storage box and unpacks it over the
   installed files. A temporary locked backup named "Recovery from the storage mirror" carries
   the result back to the panel.
3. **Done.** The temporary backup goes, plugins that follow a server's node (subdomains moves its
   DNS record) are told the server moved, and the owner gets a notification with the new address
   and the time of the copy. The server is not started: the owner starts it.

**Where it lands.** The destination comes from plugged-host-servers' transfer planner: a node in
the same location as the dead one first, then a node of the same tier anywhere new servers may be
created. It never picks the dead node, a [limbo](/plugins/limbo/) node, or a node that missed its
latest probe. Overloaded nodes are used only when nothing else has room. Without
plugged-host-servers enabled, no recovery starts.

**What is lost.** Everything since the server's last completed copy (up to one mirror interval,
30 minutes by default, plus the time a pass takes), and the files the copy leaves out: caches,
logs, `node_modules`, virtualenvs and the like. The egg's install and the server's own startup
rebuild most of them.

The restore needs a backup host in the panel to attach the temporary backup to. A fresh Pelican
install has one.

## Limits

- At most `STORAGE_FAILOVER_MAX_PER_RUN` (5) servers start recovering per sweep, and at most
  `STORAGE_FAILOVER_MAX_IN_FLIGHT` (3) are installing or restoring at the same time. A node with
  many servers is recovered a few at a time; the storage box builds three archives at once.
- Left where they are: suspended servers (including servers parked by limbo), servers in the
  middle of a transfer, and system servers (devboxes, which their plugin rebuilds).
- A recovery that fails before anything changed (no copy yet, no destination with room, the
  storage box unreachable, Wings refused the create) is tried again after 30 minutes. Nobody is
  notified.
- Starting the restore is tried once a minute while the storage box answers "busy", up to 30
  times. A restore that runs longer than 12 hours, or that Wings reports as failed three times,
  fails the recovery. Then the server sits on its new node, installed but without (all of) its
  files, and the owner is told (at most once a day) that recovery did not complete. Use
  `--resume` to try the restore again (see [Commands](#commands)).

:::caution
A server whose recovery finished is never recovered automatically again: its finished record
still counts as "taken care of", so if its new node dies too, the sweep skips it. The same
applies to a server you drilled. To make such a server eligible again, delete its rows with
state `done` from the `node_failovers` table.
:::

## The old node

There is no hardware fencing: the plugin cannot power off a dead node, and it never contacts the
old node during a recovery (only a drill deletes the old copy at the end). What keeps the stale
copy from coming back is the panel's record: the server now belongs to its new node, and the
recovery record keeps every later sweep away from it.

When the old node comes back, its disk still holds the old copies. Wings there is no longer
given those servers by the panel, but nothing deletes their files or containers. If the node only
lost its network and its containers kept running, a server can be live twice until you stop the
old one. Check a node that comes back before anything else:

1. List the servers that were recovered off it (`sudo -u www-data php artisan db` opens the
   panel's database):

   ```sql
   SELECT s.uuid, s.name, f.to_node_id, f.finished_at
   FROM node_failovers f JOIN servers s ON s.id = f.server_id
   WHERE f.from_node_id = <old node id> AND f.state = 'done';
   ```

2. On the old node, once each server runs on its new node, remove its container and its files
   (in the node's volume path, `/var/lib/pelican/volumes` by default):

   ```bash
   docker rm -f <uuid>
   rm -rf /var/lib/pelican/volumes/<uuid>
   ```

## Commands

Everything runs as the panel user, from `/var/www/pelican`.

See what the sweep would do, without recovering anything:

```bash
sudo -u www-data php artisan plugged-host:failover-sweep --status
```

It prints `mode=auto  nodes_down=0  acted=0  in_flight=0  advanced=0  (dry-run)`: how many
nodes look down, how many servers it would act on, how many recoveries are under way, and how
many moved a step. In `notify` mode it still sends the notifications. Without `--status` (or
`--dry-run`) it runs a real sweep, as the scheduler does.

Rehearse a recovery on one server whose node is healthy:

```bash
sudo -u www-data php artisan plugged-host:failover-sweep --drill=<server id>
```

The server id is the number in the admin panel. The scheduled sweep carries the drill through
install and restore, so the mode must be `notify` or `auto`: in `off` mode the command still moves
the server, but nothing ever restores its files.

:::danger
A drill is a real recovery. The server moves to another node, its files are replaced by the
last copy (changes since then are lost), its old copy is deleted from the old node at the end,
and its address can change. Afterwards the server is never recovered automatically again (see
[Limits](#limits)). Drill a stopped test server, not a customer's.
:::

Pick a failed recovery up again at its restore, for one that already moved its server (the
server is on its destination, installed, and only the files are missing):

```bash
sudo -u www-data php artisan plugged-host:failover-sweep --resume=<record id>
```

The record id is the row's `id` in `node_failovers`; its `detail` column says why it failed:

```sql
SELECT id, server_id, state, from_node_id, to_node_id, finished_at, detail
FROM node_failovers ORDER BY id DESC LIMIT 20;
```

The panel log (`storage/logs/`) has a line for every recovery that starts, finishes or fails,
starting with `plugged-host-storage: failover`.

### Restoring by hand

- **A live server:** open the server in the panel as an admin, go to its Backups page and use
  **Download** in the "Off-site copy" card. Upload the archive to any server with SFTP and
  extract it in the file manager.
- **A deleted server:** `sudo -u www-data php artisan plugged-host:deleted-servers` lists the
  ones whose copy is still kept; `--url=<uuid>` prints a signed download link, valid for 15
  minutes; `--extend=<uuid> --days=30` keeps the copy longer.

## What users see

- **Notifications** in the panel: "Server recovered" with the new address and the time of the
  copy, or "Server node issue" when the node looks offline (`notify` mode) or a recovery did not
  complete. That message says support has been alerted; the plugin itself only writes the failure
  to the panel log, so watch the log.
- **The Backups page** of every server: an "Off-site copy" card saying whether a copy exists
  (or "Waiting for first copy", or "Unreachable right now"), when it was last copied and its size,
  with a **Download** button for users allowed to download backups and a link to the backups
  portal. An **Off-site Backups** button in the page header opens the portal too.
- **The backups portal**: every server the user owns with its copy and a **Download** button, and
  a "Deleted servers" section with the servers an admin or the panel deleted in the last days
  (`STORAGE_DELETED_HOLD_DAYS`), kept until the date shown. It works while the server's node is
  down.

## The backups portal

The portal is the panel itself answering on a second host name: point a host name such as
`backups.example.com` at the panel box, add the vhost below, and set the portal's address in
the panel's `.env`:

```ini
BACKUPS_PORTAL_URL=https://backups.example.com
```

A visitor signed in to the panel is signed in to the portal in one redirect (the panel signs a
one-time, two-minute token with its `APP_KEY`). Anyone else sees a sign-in button that goes
through the panel's own sign-in page. Leave `SESSION_DOMAIN` unset in the panel's `.env`, so the
portal keeps its own session cookie on its own host name. Users already signed in to the panel
can also open the portal on the panel's own host, at `https://panel.example.com/backups`.

:::caution
In this release the portal's home page, sign-in callback and sign-out answer only on the host
name `backups.plugged.host`, which is written into the plugin
(`Route::domain('backups.plugged.host')` in
`plugged-host-storage/src/Providers/StoragePluginProvider.php`); `BACKUPS_PORTAL_URL` changes only
the links that point at the portal. On your own domain, change that host name in your copy of the
plugin to your portal's, or signing in to the portal fails.
:::

The vhost serves the panel's code under the portal's name, with the panel's PHP-FPM pool. Put it
in `/etc/nginx/sites-available/backups.example.com.conf`, link it into `sites-enabled`, get a
certificate for the name and reload nginx:

```nginx
# The backups portal (plugged-host-storage): the panel itself, answering on its own host name.
server {
    listen 80;
    server_name backups.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name backups.example.com;

    root /var/www/pelican/public;
    index index.php;

    access_log /var/log/nginx/backups.example.com-access.log;
    error_log  /var/log/nginx/backups.example.com-error.log error;

    client_max_body_size 100m;
    client_body_timeout 120s;

    sendfile off;

    ssl_certificate /etc/ssl/backups.example.com/fullchain.pem;
    ssl_certificate_key /etc/ssl/backups.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
    ssl_prefer_server_ciphers on;

    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Robots-Tag none;
    add_header Content-Security-Policy "frame-ancestors 'self'";
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy same-origin;
    add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 3600;
        include /etc/nginx/fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Use your own certificate paths and PHP-FPM socket, the same as in the panel's vhost (see
[Web server](/panel/web-server/)). Downloads do not go through this vhost: the portal's
**Download** buttons are signed links straight to the storage box's agent.

## Check it

`sudo -u www-data php artisan plugged-host:doctor plugged-host-storage` checks that the agent is
configured and copying (see [Doctor checks](/plugins/storage/#doctor-checks)). A server's copy is
what failover restores, so "Mirror passes" passing is what matters most. To see the sweep's view
of your nodes right now, run `plugged-host:failover-sweep --status`.
