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
5. **Settings and eggs.** Go through each plugin's settings: plans and credits, the servers
   plugin's locations, Minecraft API keys, status export. With the game plugins enabled, import
   the Minecraft egg the servers plugin's catalog expects (`plugged-host:minecraft-setup`) and
   put your FiveM egg on the FiveM image (`plugged-host:fivem-setup`).
   [Configuration](/panel/configuration/),
   [Minecraft](/plugins/minecraft/#setup), [FiveM](/plugins/fivem/#setup)
6. **Check.** `plugged-host:doctor` lists every plugin, what it is missing, and runs each
   plugin's health checks. [Doctor](/panel/doctor/)
7. **Abuse agent** on every node. [Abuse agent](/nodes/abuse-agent/)
8. **Storage box**, then authorize its key on every node; optionally a backup server.
   [Storage box](/storage/storage-box/), [Backup server](/storage/backup-server/)
9. **Discord**: neo's AI providers and rux, then the membership bot (rux, or a bot of its own),
   then neo on Discord.
   [rux](/discord/rux/), [Membership bot](/discord/membership-bot/), [neo](/discord/neo/)
10. **Status page** on Cloudflare, fed by the panel's export.
    [Status export](/status/status-export/), [Status Worker](/status/status-worker/)

Run the doctor again after each step: it says what the step left undone.

```bash
cd /var/www/pelican
sudo -u www-data php artisan plugged-host:doctor
```
