---
title: Storage box
description: Set up the box that keeps a copy of every server, from an empty disk to the first mirror pass.
---

The storage box keeps a copy of every server, refreshed every 30 minutes. Owners download it,
admins get deleted servers back from it, and [failover](/storage/failover/) restores a dead
node's servers from it. This page sets one up from zero. The panel side is the
[Storage plugin](/plugins/storage/).

## How it fits together

- **The agent pulls.** A small Node.js agent (`agent/agent.mjs` in plugged-host-storage, no npm
  dependencies) runs on the box. Every minute it asks the panel for its plan: every server, its
  node and its volume path. Each server is copied once per mirror interval with `rsync` over SSH
  from its node, as root, with the box's own key (`/root/.ssh/ph-mirror`). The panel holds no
  credential for the nodes, and the nodes hold none for the box.
- **Hard-linked snapshots.** A server's copy lives in `/mnt/storage/mirror/<uuid>/`. After each
  completed pass the agent hard-links it into `/mnt/storage/snapshots/<uuid>/<time>/`, so
  unchanged files cost no extra space, and keeps the newest three. A server without a completed
  pass is not offered as a backup.
- **Signed archives.** When someone downloads a copy, or Wings restores one during failover, the
  agent packs the newest snapshot into a `.tar.gz` (`pigz -1`) in `/mnt/storage/archives/`. The
  link is signed by the panel with the agent's secret and expires after 15 minutes. At most three
  archives are built at once; more requests get "busy, try again".
- **Self-update.** Every 15 minutes the agent checks the panel's signed manifest and installs a
  new version when there is one. See
  [Agent versions and updates](/plugins/storage/#agent-versions-and-updates).
- **Hourly inventory.** Once an hour the agent reports the server folders it holds and removes
  the ones the panel answers with: servers that are gone and whose hold is over. It never decides
  on its own what to delete.

Who talks to whom, for your firewall:

| From | To | Why |
|---|---|---|
| The agent | The panel, HTTPS | The plan every minute, a report per pass, the hourly inventory, updates. |
| The agent | Every Wings node, SSH (port 22 or yours) | Copying server files with rsync. |
| The panel | The agent's address, HTTPS | Whether a copy exists and how old it is, and failover's "can you reach this node?" probe. |
| Wings on your nodes | The agent's address, HTTPS | Downloading the archive during a failover restore. |
| Your users' browsers | The agent's address, HTTPS | Downloads from the backups portal and the Backups page. |

The agent itself listens on port 8687. The installer can put nginx with a Let's Encrypt
certificate in front of it on 443; then only nginx needs port 8687, so close it to the outside.

## Before you start

- A Debian or Ubuntu machine you have root on (the installer uses `apt-get`).
- A large disk for the copies, separate from the system disk. Plan for the total size of all your
  servers, plus the files that change between snapshots.
- A DNS name for the agent, such as `storage.example.com`, pointing at the box. Don't proxy it
  through a CDN: archives stream for minutes and can be many GB.
- Ports 80 and 443 reaching the box, if the installer should get the certificate.
- SSH from the box to every Wings node.
- The clock in sync (NTP). The panel and the agent reject each other's requests when their clocks
  differ by more than five minutes.

## Prepare the box

### The storage disk

Mount the disk at `/mnt/storage`, with `nofail` so a dead disk doesn't stop the box from
booting:

```bash
mkfs.ext4 /dev/sdb1                      # your disk; this erases it
mkdir -p /mnt/storage
blkid /dev/sdb1                          # note its UUID
echo 'UUID=<disk-uuid>  /mnt/storage  ext4  defaults,noatime,nofail  0  2' >> /etc/fstab
systemctl daemon-reload && mount /mnt/storage
```

Keep everything under `/mnt/storage` on this one filesystem. Snapshots are hard links into the
mirror; across two filesystems every snapshot becomes a full copy.

The agent's code stays on the system disk (`/opt/plugged-host-storage`), so it keeps answering
and reporting even when the storage disk is full or faulty. The installer makes the agent's
service wait for `/mnt/storage` to be mounted, so it never copies onto the system disk.

### If the box is also a Wings node

The storage box can run Wings as well, typically as the [limbo](/plugins/limbo/) node where idle
servers are parked. Then:

- **Name the node after the agent.** Give the Wings node the same FQDN as the host in the agent's
  address (`STORAGE_AGENT_URL`). That is how the panel knows they are one box: servers on that
  node get a mirror made of hard links to their volume instead of a second copy, their archives
  come from this box, and the agent removes Wings volumes that a move away left behind. Wings'
  own API then needs a port other than 443 (Pelican's default is 8080), since nginx in front of
  the agent takes 443.
- **Put Wings' data on the storage disk.** Do this on a fresh node, before it has servers.
  Hard links only work within one filesystem, so the volumes must be on the same disk as the
  mirror:

  ```bash
  systemctl stop wings
  mkdir -p /mnt/storage/pelican
  rsync -aHAX /var/lib/pelican/ /mnt/storage/pelican/
  mv /var/lib/pelican /var/lib/pelican.old && mkdir /var/lib/pelican
  echo '/mnt/storage/pelican  /var/lib/pelican  none  bind,x-systemd.requires-mounts-for=/mnt/storage,nofail  0  0' >> /etc/fstab
  systemctl daemon-reload && mount /var/lib/pelican
  ```

- **Put Docker's data there too.** Every parked server's egg image is pulled onto this node, and
  they fill a small system disk quickly. In `/etc/docker/daemon.json` (keep any keys already in
  it):

  ```json
  {
    "data-root": "/mnt/storage/docker"
  }
  ```

- **Make Wings and Docker wait for the disk:**

  ```bash
  for unit in wings docker; do
    mkdir -p /etc/systemd/system/$unit.service.d
    printf '[Unit]\nRequiresMountsFor=/mnt/storage\n' > /etc/systemd/system/$unit.service.d/10-storage-mount.conf
  done
  systemctl daemon-reload
  systemctl restart docker wings
  ```

  Once Wings runs from the new place, delete `/var/lib/pelican.old`.

- **Drop unused images weekly:**

  ```bash
  printf '#!/bin/sh\ndocker image prune -f >/dev/null\n' > /etc/cron.weekly/docker-image-prune
  chmod +x /etc/cron.weekly/docker-image-prune
  ```

### Logs

The agent writes JSON lines to `/var/log/plugged-host-storage-agent.log` and keeps the file open,
so rotate it with `copytruncate`. In `/etc/logrotate.d/plugged-host-storage-agent`:

```text
/var/log/plugged-host-storage-agent.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    copytruncate
}
```

Cap the journal too, in `/etc/systemd/journald.conf.d/size.conf`, then
`systemctl restart systemd-journald`:

```ini
[Journal]
SystemMaxUse=300M
```

## Run the installer

Copy the setup command from the panel: Admin › Plugins › plugged.host Storage › Settings,
section **Set up a storage box**, or on the panel:

```bash
sudo -u www-data php artisan plugged-host:storage-setup
```

Run what it prints on the storage box, as root:

```bash
curl -fsSL https://panel.example.com/plugged-host/storage/agent/install.sh?code=<one-time code> | sudo bash
```

The code works once, for an hour. With it the installer gets what it needs from the panel: the
agent secret (created on the first setup), the node list and the agent itself. It asks only what
it cannot know:

| Question | Default | Flag |
|---|---|---|
| Where mirrors and snapshots go | `/mnt/storage` | `--storage-root DIR` |
| Use it anyway? (asked only when that folder is not its own mount) | no | `--allow-unmounted` |
| SSH port of the nodes | `22` | `--ssh-port N` |
| Nodes on another port, as `host=port` separated by spaces | none | `--ssh-port-for HOST=PORT` (repeatable) |
| Address of this agent | the address the panel has, else `https://` and the box's host name | `--agent-url URL` |
| Put nginx with a free Let's Encrypt certificate in front of it? | yes; no when nginx already serves that host name | `--nginx` / `--no-nginx` |
| E-mail for Let's Encrypt expiry notices | none | `--email ADDR` |
| Test SSH to every node now? | no | asked only in a terminal |

The address is `https://host`, or `http://host:port` without nginx (the installer warns: links
and archives would cross the internet unencrypted). A host in `--ssh-port-for` may be a pattern,
such as `'*.example.com=2222'`.

Then it:

1. Installs curl, rsync, pigz and the SSH client, and Node.js 26 from NodeSource when there is no
   Node.js 26 or newer.
2. Creates the mirror key `/root/.ssh/ph-mirror` (ed25519, named `plugged-host-storage-agent`)
   and writes an SSH block for every node (port, user `root`, the key) into
   `/root/.ssh/config`, between `# >>> plugged-host-storage` and `# <<< plugged-host-storage`.
   Your own lines in that file are kept.
3. Downloads the agent from the panel, checks it against the panel's signed manifest, unpacks it
   into `/opt/plugged-host-storage/releases/<version>` and points `current` at it.
4. Writes the agent's settings to `/etc/plugged-host-storage.env` (see
   [The agent's settings](#the-agents-settings)) and the systemd service
   `plugged-host-storage-agent`, with a `RequiresMountsFor` drop-in for the storage root, and
   starts it.
5. With nginx: writes `/etc/nginx/sites-available/plugged-host-storage.conf` (a proxy to
   `127.0.0.1:8687` without buffering, with one-hour timeouts for long downloads) and gets the
   certificate with certbot, which renews itself.
6. Sends the mirror key and the agent's address back to the panel, which stores them as
   `STORAGE_MIRROR_PUBLIC_KEY` and `STORAGE_AGENT_URL`. If the panel refuses either, the
   installer prints them so you can paste them into the settings.

Run the setup command again (with a new code) to upgrade the agent or change an answer: your
last answers are the defaults. Do this after you add a node whose SSH port is not the default,
so its block in `/root/.ssh/config` is written.

### Unattended

`--yes` takes every default; give a flag for anything you want otherwise. The panel fills in
`--panel` and `--code` when it serves the script:

```bash
curl -fsSL "https://panel.example.com/plugged-host/storage/agent/install.sh?code=<one-time code>" \
  | sudo bash -s -- --yes --agent-url https://storage.example.com --ssh-port 2222 --nginx --email admin@example.com
```

Without a terminal the installer never asks; `PH_NONINTERACTIVE=1` makes it ignore the terminal
too (`… | sudo PH_NONINTERACTIVE=1 bash -s -- --yes …`). Unattended, nginx is only set up with
`--nginx`; otherwise make the agent's address reach `http://127.0.0.1:8687` yourself.
`PH_NODE_MAJOR` changes the Node.js major version it installs (default 26).

## Authorize the mirror key on every node

On every Wings node, as root:

```bash
curl -fsSL https://panel.example.com/plugged-host/storage/node/install.sh | sudo bash
```

The panel serves this script with the mirror key of the storage box (and of the
[backup server](/storage/backup-server/), when there is one) filled in. It adds each key to
`/root/.ssh/authorized_keys`, installs rsync if it is missing, and prints the port sshd listens
on. It is safe to run again: a key already there is left alone, and a changed line replaces the
old one.

The key logs in as root. Pin it to the addresses the box reaches the nodes from: set **Mirror
key's addresses** (`STORAGE_MIRROR_FROM`, comma-separated IPs or CIDR blocks) in the storage
settings, then run the node script again on every node. Each key is then written as
`from="<addresses>" ssh-ed25519 …`, so a copied key is useless anywhere else.

After this, the installer's last question tests SSH to every node (or run the setup command again
and answer yes). A node on another SSH port needs its port on the box: answer the installer's
"Nodes on another port" question, or add a `Host` block to `/root/.ssh/config` outside the
installer's block.

The agent accepts a node's host key on first contact. When you reinstall a node, its new host key
makes every pass fail with "Host key verification failed": remove the node's old line from the
box's `/root/.ssh/known_hosts` (`ssh-keygen -R node1.example.com`).

## Check it

On the panel:

```bash
sudo -u www-data php artisan plugged-host:doctor plugged-host-storage
```

"Storage agent configured" should pass at once. "Mirror passes" passes once the first servers are
copied: the first pass of each server is a full copy, spread over the first mirror interval.

On the box:

```bash
systemctl status plugged-host-storage-agent
curl -s http://127.0.0.1:8687/health                 # version, free space, passes at once
tail -f /var/log/plugged-host-storage-agent.log      # what the agent does
journalctl -u plugged-host-storage-agent             # starts, stops, restarts
```

The agent's own messages go to the log file, not the journal. Lines like `rsync failed` or
`node unreachable, skipping its servers for a while` name the server or node. A node that fails
at the SSH level (no connection, key not accepted, changed host key, name not found) is skipped
for five minutes.

## The agent's settings

`/etc/plugged-host-storage.env` on the box. The installer writes it and keeps lines you add.
Restart the agent after a change: `systemctl restart plugged-host-storage-agent`.

| Variable | Default | What it does |
|---|---|---|
| `PH_PANEL_URL` | set by the installer | The panel's address. |
| `PH_AGENT_SECRET` | set by the installer | The shared secret, the panel's `STORAGE_AGENT_SECRET`. At least 32 characters. |
| `PH_STORAGE_ROOT` | `/mnt/storage` | Where mirrors, snapshots and archives go. |
| `PH_LISTEN_PORT` | `8687` | The agent's HTTP port. |
| `PH_MIRROR_INTERVAL_MIN` | `30` | Minutes between two passes of the same server. Copied from the panel at install. |
| `PH_MIN_FREE_PERCENT` | `10` | Below this much free space, passes are skipped and reported as errors. Copied from the panel at install. |
| `PH_SNAPSHOTS` | `3` | Snapshots kept per server, used only until the first plan arrives; the panel's setting wins. |
| `PH_MIRROR_JOBS` | `1` | Passes at once, never two on the same node. The installer sets half the box's cores, 1 to 4, unless it is already set. |
| `PH_MAX_ARCHIVE_JOBS` | `3` | Archives built at once. |
| `PH_STREAM_STALL_SEC` | `60` | A browser download that stops reading for this long is dropped. |
| `PH_UPDATE_INTERVAL_MIN` | `15` | Minutes between update checks. |
| `PH_RSYNC_USER` | `root` (written by the installer) | The user the agent logs in to nodes as. |
| `PH_RSYNC_SSH_KEY` | `/root/.ssh/ph-mirror` | The mirror key. |
| `PH_RSYNC_TEMPLATE` | `%USER%@%HOST%:%PATH%/` | How a plan entry becomes an rsync source. Set an `rsync://` URL to pull from an rsync daemon instead of SSH (`%HOST%`, `%PATH%`, `%UUID%`, `%USER%` are filled in). |
| `PH_RELEASE_DIR` | `/opt/plugged-host-storage` | Where agent releases are unpacked. |
| `PH_VERSION` | set by the installer | Fallback version, used only when the agent does not run from a release folder. |
| `PH_ARCHIVE_SOURCE` | `download` | An extra folder under the storage root where downloads are also looked up. Leave it. |
| `PH_SSH_DEFAULT_PORT`, `PH_SSH_PORT_OVERRIDES` | your answers | The installer's memory of the SSH ports, used as defaults next time. |

:::caution
Anyone with the agent secret can sign a download of every server's files. Keep it at least 32
random characters (the panel creates 64), and never reuse it between the storage box and the
backup server.
:::
