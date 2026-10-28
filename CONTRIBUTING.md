# Writing these docs

The site is [Starlight](https://starlight.astro.build) (Astro). Pages are Markdown in
`src/content/docs/<section>/<page>.md`; the sidebar is listed page by page in `astro.config.mjs`,
so a new page also needs its line there.

```bash
npm ci
npm run build     # static site in dist/, then dist/_headers (scripts/headers.mjs)
```

## What goes here

How to set up and run a panel like plugged.host: the v3 panel
([plugged-host/panel](https://github.com/plugged-host/panel), a fork of
[Calagopus](https://calagopus.com)), its Wings fork
([plugged-host/wings](https://github.com/plugged-host/wings)) on the nodes, the plugged.host
features built into both, and the status page and website. Not how plugged.host's own machines are
set up.

What the fork leaves as Calagopus has it (eggs and nests, locations, databases, backups, mail,
OAuth, the API) belongs to the [Calagopus documentation](https://calagopus.com/docs): link there
instead of repeating it. The plugged.host features are the point of these docs.

### Public, so placeholders only

Everything here is public. Use placeholders: `panel.example.com`, `node1.example.com`,
`play.example.com`, `example.com`, documentation addresses (`192.0.2.10`), port `8080` for Wings.
Never:

- plugged.host's real host names, IP addresses, SSH ports or node names;
- people, Discord ids, incident history or dates of incidents;
- a secret, token or real `.env` value;
- noprofit.space wiring: its endpoints, request formats, client ids or accounts-side settings.
  noprofit.space is plugged.host's closed-source account service; a page says in a sentence or two
  what changes while it is connected and links to `/accounts/noprofit/`.

Before pushing, run `public-scan.sh` (or search the diff for IPs, hostnames and keys).

## Voice

- Plain, direct English for someone who runs Linux servers but has never seen this code.
  Second person ("set", "run"), present tense, short sentences.
- Say what a thing does before how to configure it. Lead with the command or setting the
  reader needs; explain why only when it prevents a mistake.
- Panel paths are written with `›`: Admin › Settings › Hosting › Limbo.
- Panel commands are written as `panel-rs <command>` and run with the service's environment, as
  [Commands](src/content/docs/reference/commands.md) shows.
- Asides (`:::note`, `:::caution`, `:::danger`) only for things that lose data or break a
  panel. No emoji, no marketing language.
- Markdown only: no HTML, no inline styles, no MDX components in pages.

## Facts

Read the code before writing about it: the feature's page in the panel's
[`docs/features/`](https://github.com/plugged-host/panel/tree/main/docs/features), the settings
struct in `shared/src/settings/<section>.rs` (names, defaults, ranges), the labels in
`frontend/src/translations.ts`, the tasks in `backend/src/tasks.rs`, the permissions in
`shared/src/permissions.rs`. When the code and a doc disagree, the code wins. Don't document what
you didn't find.

Leave out what a person running the panel cannot use: source paths, struct and table names, SQL,
API route lists, test lists. Task names (they show on Admin › Overview › Health) and permission
names (admins hand them out) stay.

## Feature pages

In this order, leaving out a section that would be empty:

1. One paragraph: what the feature is for and who sees it.
2. `## What it does`: the behaviour, as a list or short `###` subsections.
3. `## Requirements`: the Wings fork, an egg feature, an outside account or API key, another
   feature, and what happens without it.
4. `## Setup`: numbered steps from nothing to working, with the exact Admin › Settings path.
5. `## Settings`: a table `| Setting | Default | What it does |`, grouped under `###` headings by
   tab, with the labels the panel shows.
6. `## Permissions`: server and admin permissions the feature adds.
7. `## Background tasks`: task names and how often they run.
8. `## Notes`: limits and things that bite, and the noprofit.space difference if any.

## Look

`src/styles/theme.css` maps the v3 panel's Theme v2 tokens (`frontend/src/app.css`,
`frontend/src/theme.ts` in the panel) onto Starlight's variables. Keep it in step with the panel:
dark only, flat colours (the page floor is the only gradient), no decorative shapes, icons, shadows
or glass, one primary action per section, and only the panel's existing colours, fonts and radii.
`scripts/headers.mjs` writes the CSP from the build: no inline styles in pages.
