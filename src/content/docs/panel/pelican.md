---
title: Install Pelican
description: Install Pelican Panel at the version the plugged.host plugins are built against, without changing its files.
---

The plugins run inside an ordinary Pelican Panel. Install it as
[Pelican's documentation](https://pelican.dev/docs/panel/getting-started) describes; this page
follows the same steps with what matters for plugged.host.

## Pick the version

The plugins target **Pelican v1.0.0-rc.2**. Install that release, not `latest`, and only upgrade
Pelican when the plugins' release notes say a newer version is supported: Pelican changes
internal APIs between pre-releases and a mismatch shows up as errors on panel pages.

## Install

Install PHP 8.5 with the extensions on [Requirements](/start/requirements/), MariaDB, nginx
and Composer first. Then:

```bash
sudo mkdir -p /var/www/pelican
cd /var/www/pelican
curl -L https://github.com/pelican-dev/panel/releases/download/v1.0.0-rc.2/panel.tar.gz | sudo tar -xzv
sudo COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader
```

Always `--no-dev`, and never `composer update`: that would replace the versions the release was
tested with.

## Set it up

```bash
sudo php artisan p:environment:setup
sudo chmod -R 755 storage/* bootstrap/cache/
sudo chown -R www-data:www-data /var/www/pelican
```

`p:environment:setup` creates `.env` and the `APP_KEY`. **Copy the `APP_KEY` somewhere safe off the
server**: every encrypted value in the database (API keys, node tokens, the plugins' secrets) is
unreadable without it, even from a backup.

Set up the [web server](/panel/web-server/) next, then open `https://panel.example.com/installer`
and finish Pelican's web installer: database, cache/session/queue drivers (Redis or database),
mail, and the first admin account.

:::note
plugged.host runs PHP-FPM and every artisan command as `www-data`. If your distribution's web user
is called something else (`nginx`, `apache`), use that name wherever these docs say `www-data`.
:::

## Leave Pelican's files alone

Everything plugged.host adds lives in `plugins/`. Pelican's own directories (`app/`, `bootstrap/`,
`config/`, `database/`, `lang/`, `public/`, `resources/`, `routes/`) and `composer.json` stay exactly
as the release shipped them. That is what makes Pelican upgrades safe, and Pelican's AGPL licence
is the reason plugged.host never patches the panel itself. If something seems to need a change
in the panel, it belongs in a plugin.

The one exception is `.env`: the plugins' settings pages write their values there.
