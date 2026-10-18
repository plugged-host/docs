---
title: Queue worker and scheduler
description: The two background processes every plugged.host panel needs, and the queue timeout that keeps long jobs from running twice.
---

Most of what the plugins do happens in the background: node probes, the status export, abuse
scans, transfers, failover, limbo, the start queue, the Discord bots. Two processes drive all of
it. Without them the panel looks fine but nothing periodic or queued ever runs.

## The scheduler

One line in the panel user's crontab runs Laravel's scheduler every minute:

```bash
sudo crontab -u www-data -e
```

```
* * * * * php /var/www/pelican/artisan schedule:run >> /dev/null 2>&1
```

The scheduler starts everything else, including the Discord bots (they are long-running
processes that the scheduler checks every minute and restarts when they stop). The Discord plugin
adds this line by itself if it is missing and `www-data` may use `crontab`, but don't rely on that.

`schedule:list` shows what runs and when:

```bash
sudo -u www-data php artisan schedule:list
```

The [commands reference](/reference/commands/) lists the plugins' scheduled tasks.

## The queue worker

Create the service with Pelican's command, then give it a longer timeout:

```bash
sudo php artisan p:environment:queue-service --service-name=pelican-queue --user=www-data --group=www-data
```

Edit `/etc/systemd/system/pelican-queue.service` so the worker allows long jobs (modpack installs
run up to 15 minutes):

```ini
[Unit]
Description=Pelican Queue Service
After=redis-server.service

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/pelican/artisan queue:work --tries=3 --timeout=960
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pelican-queue
```

## The retry timeout

A queued job that runs longer than the queue connection's `retry_after` is handed to the worker a
second time while the first run is still going. Set it above the worker's `--timeout` in `.env`:

```ini
# with QUEUE_CONNECTION=redis
REDIS_QUEUE_RETRY_AFTER=1000
# with QUEUE_CONNECTION=database
DB_QUEUE_RETRY_AFTER=1000
```

Then clear the config cache and restart the worker.

## After code changes

The worker and the bots keep the code they started with. After updating the plugins, restart
them:

```bash
sudo -u www-data php artisan queue:restart
sudo -u www-data php artisan plugged-host:discord-bot-supervise --restart
sudo -u www-data php artisan plugged-host:neo-bot-supervise --restart
sudo -u www-data php artisan plugged-host:rux-supervise --restart
```

`queue:restart` lets the worker finish its current job and exit; systemd starts it again
(`Restart=always`). Skip the bots you don't run.

## Check

The [doctor](/panel/doctor/) records a scheduler tick every minute and a queue heartbeat every five,
and fails when either is late:

```bash
sudo -u www-data php artisan plugged-host:doctor plugged-host-core
```
