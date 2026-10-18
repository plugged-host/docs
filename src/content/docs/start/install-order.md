---
title: Install order
description: The steps from an empty server to a working panel, in the order that works.
---

Each step only needs the ones before it. Stop after step 4 for a working panel with one node;
add the rest when you need them.

1. **Pelican.** Install the panel at the version the plugins target and finish its installer.
   [Install Pelican](/panel/pelican/)
2. **The plugins.** Clone them into `plugins/`, turn off the ones you don't use, run the
   migrations and rebuild the assets. [Install the plugins](/panel/plugins/)
3. **Web server, queue worker, scheduler.** The nginx vhost, the queue worker service and the
   cron line. Without the last two, nothing periodic or queued happens.
   [Web server](/panel/web-server/), [Queue worker and scheduler](/panel/queue-and-scheduler/)
4. **A node.** Install Wings, create the node in the panel, give it a location and a deployment
   tag so the servers plugin places servers on it. [Wings nodes](/nodes/wings/)
5. **Settings.** Go through each plugin's settings: plans and credits, the servers plugin's
   locations, Minecraft API keys, status export. [Configuration](/panel/configuration/)
6. **Check.** `plugged-host:doctor` lists every plugin, what it is missing, and runs each
   plugin's health checks. [Doctor](/panel/doctor/)
7. **Abuse agent** on every node. [Abuse agent](/nodes/abuse-agent/)
8. **Storage box**, then authorize its key on every node; optionally a backup server.
   [Storage box](/storage/storage-box/), [Backup server](/storage/backup-server/)
9. **Discord**: the membership bot, then neo and rux.
   [Membership bot](/discord/membership-bot/), [neo](/discord/neo/), [rux](/discord/rux/)
10. **Status page** on Cloudflare, fed by the panel's export.
    [Status export](/status/status-export/), [Status Worker](/status/status-worker/)

Run the doctor again after each step: it says what the step left undone.

```bash
cd /var/www/pelican
sudo -u www-data php artisan plugged-host:doctor
```
