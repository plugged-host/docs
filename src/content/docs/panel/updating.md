---
title: Updating
description: Update the plugins, and upgrade Pelican when a plugged.host release moves to a new Pelican version.
---

## Updating the plugins

The panel serves the plugins straight from `plugins/`, so a `git pull` is live within seconds.
Update during a quiet moment and in this order:

```bash
cd /var/www/pelican
sudo -u www-data git -C plugins pull --ff-only --autostash
sudo -u www-data php artisan migrate --force
sudo -u www-data yarn build
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan route:clear
sudo -u www-data php artisan view:clear
sudo -u www-data php artisan event:clear
sudo -u www-data php artisan queue:restart
sudo -u www-data php artisan plugged-host:doctor
```

- `--autostash` carries your local changes over the pull. The usual local change is a disabled
  plugin: Pelican writes a plugin's state into its `plugin.json`.
- `yarn build` is only needed when a plugin's `resources/` changed, but it never hurts.
- Restart the Discord bots after the update if you run them (their supervisors' `--restart`, see
  [Queue worker and scheduler](/panel/queue-and-scheduler/#after-code-changes)).
- The storage agent updates itself from the panel. The abuse agent only logs that a newer
  version exists and shows it in Admin › Servers › Abuse › Node agents: re-run its installer on the
  nodes ([Abuse agent](/nodes/abuse-agent/)). See [Versions](/reference/versions/).

Read the release notes first: each plugin has a `CHANGELOG.md`, and a release that needs a step
beyond these says so there.

## Upgrading Pelican

A plugged.host release names the Pelican version it is built for. Upgrade Pelican only together
with a plugins release that supports the new version, in one maintenance window.

Pelican's own update script and its documented update steps run `optimize:clear`, which empties
the cache store, and can replace `storage/app`, where the plugins keep files (the storage agent's
bundle, FiveM downloads). Do it by hand instead:

1. **Back up** the database and the panel directory (without `vendor/` and `node_modules/`).
2. **Maintenance mode:** `sudo -u www-data php artisan down`. Don't upgrade while a node failover
   is restoring servers: maintenance mode pauses the scheduler and turns away Wings' callbacks.
3. **Extract the new release over the panel, without `plugins/`**, and delete the files the new
   release removed (compare the two release tarballs' file lists):

   ```bash
   cd /var/www/pelican
   curl -L https://github.com/pelican-dev/panel/releases/download/<version>/panel.tar.gz \
     | sudo tar -xzv --exclude='plugins'
   ```

4. **Dependencies:** `sudo COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader`.
   Safer order on a panel that keeps taking requests in maintenance mode: put only the new
   `composer.json`, `composer.lock`, `package.json` and `yarn.lock` in first, run this, and extract
   the rest once it is done, so nothing boots the new code against a half-written `vendor/`.
5. **Update the plugins** to the release that supports the new Pelican (`git -C plugins pull`).
6. **Migrate, build, clear:** `migrate --force`, `yarn install && yarn build`, then the four cache
   clears. The build is required: the release's prebuilt assets don't include the plugins, and
   without it every page fails.
7. `sudo chown -R www-data:www-data /var/www/pelican`, reload PHP-FPM (`systemctl reload
   php8.5-fpm`: a worker can keep stale compiled code of files that were replaced under it),
   `queue:restart`, restart the Discord bots (`plugged-host:discord-bot-supervise --restart`,
   `neo-bot-supervise`, `rux-supervise`), then `sudo -u www-data php artisan up`.
8. Run the doctor and open a few pages (admin, a server's console) before you leave it.

Since Pelican rc.2, a plugin whose files throw a fatal error, or any error while the panel boots,
is switched off with the status **crashed** and skipped until an admin enables it again in
Admin › Plugins. The doctor's **Plugins load** check fails while one is. After an upgrade, check
it and enable the plugin again once the cause is gone.

## Wings

Nodes can be updated on their own, as long as the Wings release supports your panel version
(check its release notes). Game servers keep running while Wings restarts. Follow
[Pelican's Wings update steps](https://pelican.dev/docs/wings/update), one node at a time, and
never on a node that is part of a running failover restore.
