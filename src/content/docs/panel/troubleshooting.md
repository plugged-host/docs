---
title: Troubleshooting
description: The mistakes that take a plugged.host panel down, and what to check first when something stops working.
---

## Start with the doctor

```bash
sudo -u www-data php artisan plugged-host:doctor
```

Most "nothing happens" problems are a missing scheduler or queue worker, and the doctor says so.
Then look at `storage/logs/laravel.log`, and for the Discord bots their own logs in
`storage/logs/`.

## Commands not to run

| Command | Why not | Instead |
|---|---|---|
| `php artisan optimize:clear`, `cache:clear` | Empties the cache store. With Redis on database 0 that also holds sessions and the queue: everyone is logged out and pending jobs are lost. With the database cache store it also drops maintenance state and rate limits. | `config:clear`, `route:clear`, `view:clear`, `event:clear` |
| `php artisan route:cache`, `config:cache` | Plugins register routes and config at runtime; Pelican refuses config caching, and a route cache of a panel this size can take gigabytes of memory to build. | Nothing: run uncached. |
| `composer update` | Replaces the dependency versions the Pelican release was tested with. | `composer install --no-dev --optimize-autoloader` |
| Editing Pelican's own files | Lost on the next upgrade, and Pelican's licence is why plugged.host never does it. | A plugin. |

## Files and permissions

- **The panel runs as `www-data`.** A file root creates (an edit, a `git pull` as root, a build)
  needs `chown www-data:www-data` or the panel can't read or rewrite it. Run artisan, Git and Yarn
  as `www-data` to avoid this.
- **Write live PHP files atomically.** PHP's opcache rechecks files every couple of seconds and
  can pick up a half-written file. Editors that write in place (and `sed -i` on large files) can
  cause one-off fatal errors; write a temporary file and rename it over the original.
- **Blade changes need `view:clear`.** PHP changes are picked up by themselves.

## Symptoms

| Symptom | Look at |
|---|---|
| Every page is a 500 right after installing or updating plugins | `yarn build` wasn't run: the Vite manifest has no entries for the plugins' assets. |
| A translation key shows up as text (`plugin::strings.x.y`) | A missing key in the plugin's `lang/<locale>/strings.php`. |
| No servers can be created ("no viable nodes") | Deployment tags, free allocations in the deployment port range, nodes paused for load. See [Servers](/plugins/servers/). |
| Long jobs (modpack installs) run twice | The queue's `retry_after` is below the worker's timeout. See [Queue worker and scheduler](/panel/queue-and-scheduler/#the-retry-timeout). |
| The Discord bots don't connect | `APP_ENV` isn't `production`, or the token or intents are wrong. `plugged-host:discord-bot-supervise --status`. |
| The status page says the panel's data is delayed | The scheduler isn't running, or `STATUS_EXPORT_PATH` isn't served at `/data/`. |
| Plugins pages show a plugin as errored | Its `status_message` in `p:plugin:list` or Admin › Plugins has the exception. |

## Memory

The panel box runs PHP-FPM, the queue worker, the scheduler's commands and up to three Discord
bot daemons side by side. Keep an eye on memory before adding heavy tools to the same box (an IDE server,
a local Workers dev server, a second panel): when the kernel runs out, it tends to kill the
database first.
