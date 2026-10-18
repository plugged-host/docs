---
title: Backup server
description: Add an optional second box that copies every server too and serves archives faster than the storage box.
---

The backup server is an optional second box running the same storage agent as the
[storage box](/storage/storage-box/). Use one when your storage box is stable but slow: packing a
server into an archive (a download from the backups portal, a failover restore) is CPU work, and
on a box with one or two threads a big server takes a long time. A faster backup server serves
those archives while the storage box remains the copy you can count on.

## How the two boxes share the work

- **Both copy every server**, each on its own: each has its own address, secret and mirror key,
  pulls from the nodes itself and keeps its own snapshots. With `PH_MIRROR_JOBS` above 1 a box
  copies several servers at once, never two from the same node.
- **One exception:** the backup server leaves out the servers on the storage box's own Wings
  node (usually the [limbo](/plugins/limbo/) node). Their files are on the storage box's drive
  already, and reading them all over that drive is the slow work the backup server is there to
  avoid. The storage box does copy the servers on the backup server's node, if it has one.
- **Which box serves an archive**, for the backups portal, the Backups page, failover restores and
  `plugged-host:deleted-servers --url`:
  1. The box whose own Wings node the server is on, when it has a copy (there the copy is the
     volume itself).
  2. Otherwise the backup server, while its copy is no more than one mirror interval older than
     the storage box's.
  3. Otherwise the storage box.

  A box that does not answer is passed over for a minute, so a dead backup server does not slow
  down every page.
- **Failover** counts a node as reachable when either box reaches it, and only acts when neither
  does. See [Failover](/storage/failover/).
- **The panel tells the boxes apart** by whose secret signs a request. It signs the update
  manifest once per box, so each agent updates itself as the storage box's does.
- **Cleanup** works per box: each reports its folders hourly and gets the same answer for the
  copies it holds, so a deleted server's copy goes from both within the hour.

## What the box needs

- Everything the storage box needs: Debian or Ubuntu, root, a large separate disk mounted at
  `/mnt/storage` (for example ext4 with `noatime,nofail`), the clock in sync, SSH to every node.
  Follow [Prepare the box](/storage/storage-box/#prepare-the-box).
- Its own DNS name, such as `backup.example.com`, pointing at it and not proxied by a CDN, with
  ports 80 and 443 reaching it for the certificate and the agent behind nginx.
- Cores. pigz packs archives on every core, and the installer runs more mirror passes at once on a
  box with more cores. Give it dedicated resources rather than a share of a busy host.

## Set it up

1. **Run the migrations** on the panel, so the panel keeps a copy record per server and box:

   ```bash
   sudo -u www-data php artisan migrate
   ```

   Until the storage plugin's migration 004 has run, the backup server's reports are dropped.

2. **Get the backup server's setup command**: Admin › Plugins › plugged.host Storage ›
   Settings, section **Backup server**, or on the panel:

   ```bash
   sudo -u www-data php artisan plugged-host:storage-setup --backup
   ```

3. **Run it on the backup server**, as root. It is the same installer as the storage box's, with
   the same questions and flags ([Run the installer](/storage/storage-box/#run-the-installer)).
   Unattended, for example:

   ```bash
   curl -fsSL "https://panel.example.com/plugged-host/storage/agent/install.sh?code=<one-time code>" \
     | sudo bash -s -- --yes --storage-root /mnt/storage --agent-url https://backup.example.com --nginx --ssh-port 2222
   ```

   The code was issued for the backup server, so the panel creates the backup server's own secret
   (`STORAGE_BACKUP_AGENT_SECRET`), and the installer reports its mirror key and address back
   (`STORAGE_BACKUP_MIRROR_PUBLIC_KEY`, `STORAGE_BACKUP_AGENT_URL`). Its key is named
   `plugged-host-backup-agent`, so you can tell it from the storage box's in a node's
   `authorized_keys`.

4. **Optionally pin its key**: set the backup server's **Mirror key's addresses**
   (`STORAGE_BACKUP_MIRROR_FROM`) to the addresses it reaches the nodes from.

5. **Run the node script again on every node**, so the nodes accept the new key too:

   ```bash
   curl -fsSL https://panel.example.com/plugged-host/storage/node/install.sh | sudo bash
   ```

6. **Check it**:

   ```bash
   sudo -u www-data php artisan plugged-host:doctor plugged-host-storage
   ```

   "Backup server" shows its address. "Mirror passes (backup server)" passes once its first copies
   are done, and "Deleted-server copies (backup server)" after its first hourly report.

## Mirror passes at once

`PH_MIRROR_JOBS` in `/etc/plugged-host-storage.env` sets how many servers a box copies at the
same time, never two from the same node (each pass is an rsync over SSH that the node serves next
to its game servers). The installer sets half the box's cores, between 1 and 4, when the variable
is not set yet; it never changes a value you set. Change it and run
`systemctl restart plugged-host-storage-agent`. `curl -s http://127.0.0.1:8687/health` shows the
value in use.

## The backup server as a Wings node

The backup server can run Wings too, for example as the limbo node. Name its Wings node after
the host in `STORAGE_BACKUP_AGENT_URL`, and set it up as in
[If the box is also a Wings node](/storage/storage-box/#if-the-box-is-also-a-wings-node). Servers
on that node then get a mirror of hard links on the backup server and their archives from it,
while the storage box still copies them over SSH, as the copy that survives the backup server.

## Settings

Admin › Plugins › plugged.host Storage › Settings › Backup server. The installer fills in all of
them except the addresses.

| Setting | Default | What it does |
|---|---|---|
| Agent URL `STORAGE_BACKUP_AGENT_URL` | empty | Where the backup server's agent answers. |
| Agent Secret (HMAC) `STORAGE_BACKUP_AGENT_SECRET` | empty | The backup server's own secret (`PH_AGENT_SECRET` on that box). Created by its first setup; never shown. |
| Mirror SSH public key `STORAGE_BACKUP_MIRROR_PUBLIC_KEY` | empty | The backup server's mirror key, served to nodes by the node script. |
| Mirror key's addresses `STORAGE_BACKUP_MIRROR_FROM` | empty | IPs or CIDR blocks the backup server reaches the nodes from. When set, nodes accept its key only from there. |

The backup server is in use once its address and secret are both set.

## Removing it

1. Stop the agent on the backup server: `systemctl disable --now plugged-host-storage-agent`.
2. Clear the four settings above in `/var/www/pelican/.env` (a blank secret field on the settings
   page keeps the stored secret). Everything is then served by the storage box again, and the
   doctor's "Backup server" check says "none".
3. On every node, remove the line ending in `plugged-host-backup-agent` from
   `/root/.ssh/authorized_keys`. The node script only adds and updates keys, it never removes one.
