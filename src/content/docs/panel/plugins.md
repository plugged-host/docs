---
title: Install the plugins
description: Clone the plugged.host plugins into the panel, choose which to run, migrate and rebuild the assets.
---

The plugins are one Git repository. Its root is the panel's `plugins/` directory: every
subdirectory is a Pelican plugin.

## Clone

Pelican ships an empty `plugins/` directory (just a `.gitignore`). Replace it with the repository:

```bash
cd /var/www/pelican
sudo rm -rf plugins
sudo git clone https://github.com/plugged-host/plugins.git plugins
sudo chown -R www-data:www-data plugins
```

`main` is the release plugged.host runs. Each release is also developed on its own branch
(`2.2`, then `2.3` …); stay on `main` unless you want unreleased work.

## Choose the plugins

The repository's `plugin.json` files come with every plugin enabled. Before the first migration,
turn off the ones you don't want, at least **`plugged-host-noprofit`**: it connects the panel to
noprofit.space, plugged.host's own account service, and without it every plugin uses the panel's
own sign-in, plans and credits.

```bash
sudo -u www-data php artisan p:plugin:disable plugged-host-noprofit
sudo -u www-data php artisan p:plugin:list
```

Core is required by every other plugin. Each `plugin.json` names what the plugin **requires**
and what it merely **works with** (`plugged_host.requires` / `optional`); the
[architecture page](/reference/architecture/) has the whole table. A plugin whose requirements
are off still loads, but the [doctor](/panel/doctor/) reports it as a failure.

Good candidates to leave off at first, depending on what you host: `plugged-host-ads`
(ads are on by default once it runs), `plugged-host-limbo`, `plugged-host-devbox`,
`plugged-host-fivem`, `plugged-host-ai`.

:::note
Pelican records a plugin's state in its `plugin.json` (`meta.status`). Disabling a plugin
therefore shows up as a local change in Git. That is expected; see [Updating](/panel/updating/)
for pulling with local changes.
:::

## Migrate

Each enabled plugin brings its own tables:

```bash
sudo -u www-data php artisan migrate --force
```

Enabling a plugin later? Run the migration again afterwards. Disabled plugins' migrations are
skipped until then.

## Rebuild the assets

The plugins add stylesheets and scripts (the theme, flags, page styles) that Pelican's Vite build
picks up from `plugins/*/resources`. The release tarball's prebuilt assets don't include them, and
the panel's pages fail until you rebuild:

```bash
cd /var/www/pelican
sudo -u www-data yarn install
sudo -u www-data yarn build
```

Do this after every plugin install, update or enable/disable that touches assets. If `www-data`
has no home directory for Yarn's cache, run it as root and `chown -R www-data:www-data` the
`public/build` and `node_modules` directories afterwards.

## Clear the caches

```bash
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan route:clear
sudo -u www-data php artisan view:clear
sudo -u www-data php artisan event:clear
```

Use exactly these four. Don't run `optimize:clear` or `cache:clear` on a live panel, and never
`route:cache` or `config:cache`: see [Troubleshooting](/panel/troubleshooting/).

## Then

The plugins are loaded but not configured yet. Set up the
[web server](/panel/web-server/) and the [queue worker and scheduler](/panel/queue-and-scheduler/),
then go through [Configuration](/panel/configuration/).
