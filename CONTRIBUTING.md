# Writing these docs

The site is [Starlight](https://starlight.astro.build) (Astro). Pages are Markdown in
`src/content/docs/<section>/<page>.md`; the sidebar is in `astro.config.mjs` (the Plugins section
is generated from `src/content/docs/plugins/`, ordered by `sidebar.order`).

```bash
npm ci
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
```

## What goes here

How to set up and run a panel like plugged.host: Pelican Panel with the
[plugged.host plugins](https://github.com/plugged-host/plugins), its nodes, storage box, Discord
bots and status page. Not how plugged.host's own machines are set up: no host names, IP
addresses, SSH ports, node names, people or incident history. Use placeholders:
`panel.example.com`, `node1.example.com`, `storage.example.com`, `backup.example.com`,
`/var/www/pelican`, port `2222`.

Everything here is public. Never paste a secret, token or real `.env` value. Before pushing,
search the diff for IPs, hostnames and keys.

## Voice

- Plain, direct English for someone who runs Linux servers but has never seen this code.
  Second person ("set", "run"), present tense, short sentences.
- Say what a thing does before how to configure it. Lead with the command or setting the
  reader needs; explain why only when it prevents a mistake.
- Panel paths are written with `›`: Admin › Plugins › plugged.host Storage › Settings.
- Artisan runs as the panel user from the panel directory:
  `sudo -u www-data php artisan plugged-host:doctor` (in `/var/www/pelican`).
- Asides (`:::note`, `:::caution`, `:::danger`) only for things that lose data or break a
  panel. No emoji, no marketing language.

## Facts

Read the code before writing about it: `plugin.json`, `config/<plugin>.php` (setting names and
defaults), `src/Console/Commands` (`$signature`, `$description`), the schedule in the
providers, the settings form (`getSettingsForm()`), the plugin's README and CHANGELOG. When the
code and an older README disagree, the code wins. Don't document what you didn't find.

## Plugin pages

`src/content/docs/plugins/<name>.md`, in this order (leave a section out when it would be empty):

1. One paragraph: what the plugin is for.
2. `## What it does`: the features, as a list.
3. `## Requirements`: `plugged_host.requires` / `optional` from `plugin.json`, and anything
   outside the panel (a box, an API key, a node change).
4. `## Setup`: the steps, or a link to the guide that has them.
5. `## Settings`: a table `| Setting | Default | What it does |`, the `.env` key in code font,
   grouped under `###` headings when the settings page has tabs or sections.
6. `## Commands`: artisan commands, and what runs on the scheduler and how often.
7. `## Doctor checks`: what `plugged-host:doctor` checks for it.
8. `## Notes`: limits and things that bite.
