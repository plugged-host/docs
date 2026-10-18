---
title: noprofit.space
description: The optional connection to noprofit.space, plugged.host's own account service. Self-hosted panels disable it; every plugin has its own fallback.
sidebar:
  order: 15
---

plugged-host-noprofit connects the panel to [noprofit.space](https://noprofit.space), the account
service plugged.host runs on. noprofit.space is closed source and not something you can run
yourself, so this site doesn't cover connecting to it. With the plugin enabled, noprofit.space
takes over sign-in and accounts, the Discord link, plans and credit balances, neo's AI and rux's
payouts. Without it, every other plugin works on its own.

## Disable it

The plugin comes enabled, like every plugin in the repository. Turn it off before the first
migration:

```bash
cd /var/www/pelican
sudo -u www-data php artisan p:plugin:disable plugged-host-noprofit
```

:::caution
While it is enabled, every login page of the panel (client, admin, server, and registration)
redirects to noprofit.space. A panel that isn't connected to noprofit.space can't be signed in to.
If you are locked out, run the command above.
:::

## What each plugin does without it

Each plugin that used to need noprofit.space defines what it needs and ships its own standalone
version. This plugin only swaps in noprofit.space's version while it is enabled.

| What | Plugin | Without plugged-host-noprofit | With it |
|---|---|---|---|
| Sign-in and account management | [core](/plugins/core/) | Pelican's own sign-in, registration, profile page and 2FA; Discord linked through Pelican's Discord OAuth | noprofit.space's sign-in; the account, 2FA and Discord link are managed there |
| Plans, store prices and credits | [economy](/plugins/economy/) | Tiers, limits and store prices from the economy plugin's settings; credits kept on the panel | Plans and prices from noprofit.space; credits kept in step with it both ways |
| Discord accounts and payouts | [discord](/plugins/discord/) | The panel's own Discord links; giveaways and grants paid through the economy plugin | noprofit.space's accounts and payouts |
| Discord servers and boost rewards | [discord](/plugins/discord/) | Nothing to report: the Discord servers tab is hidden and the panel pays boost rewards itself | noprofit.space's list of Discord servers, ad slots and boost payouts |
| neo's AI backend, providers and limits | [AI](/plugins/ai/) | AI providers and usage limits configured on the panel | noprofit.space's AI gateway and limits |

## Notes

- **Accounts.** With the plugin enabled, people also delete their account on noprofit.space, SFTP
  passwords of converted accounts are checked there, and inviting a subuser only reaches existing
  accounts. Standalone, all of that is Pelican's default behaviour.
- **The doctor.** While the plugin is enabled, `plugged-host:doctor` fails until it is connected.
  Disabled, it reports nothing for it.
- **Settings.** Its settings and commands only matter for plugged.host's own panels and are not
  documented here.
