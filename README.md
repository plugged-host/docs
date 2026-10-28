# plugged.host docs

The documentation site at [docs.plugged.host](https://docs.plugged.host): how to run a panel like
[plugged.host](https://plugged.host), which is [plugged-host/panel](https://github.com/plugged-host/panel)
(a fork of [Calagopus](https://calagopus.com) with plugged.host's features built in) and its Wings
fork [plugged-host/wings](https://github.com/plugged-host/wings), plus the status page and website.

## How it's built

- **[Starlight](https://starlight.astro.build)** (Astro). Pages are Markdown in
  `src/content/docs/`, the sidebar is in `astro.config.mjs`.
- **The panel's look**: `src/styles/theme.css` maps the v3 panel's Theme v2 tokens onto
  Starlight's variables, dark only like the panel; the fonts are self-hosted in `public/fonts/`.
- **Hosting:** the Cloudflare Worker `docs-plugged`, static assets only (`wrangler.jsonc`, no
  Worker script). `npm run build` writes `dist/`, then `scripts/headers.mjs` writes
  `dist/_headers`: security headers and a Content Security Policy with the hashes of the few inline
  scripts Starlight emits. Only `dist/` is uploaded. `public/_redirects` sends the addresses of
  removed pages to their replacements.

## Working on it

```bash
npm ci
npm run build     # static site in dist/ (git-ignored)
```

Node.js 22 or newer (`.node-version` says 26). How to write pages: [CONTRIBUTING.md](CONTRIBUTING.md).

## Deploy and roll back

Pushing to `main` deploys: Workers Builds runs `npm run build` and `npx wrangler deploy`. A build
that fails leaves the previous version online.

Roll back by reverting the commit and pushing. In a hurry, Cloudflare's dashboard (Workers &
Pages › `docs-plugged` › Deployments) rolls back to an earlier version at once; push the revert
afterwards so `main` matches what is served.

No secrets and no settings: the site is static.

## Related

- The panel's own developer docs (architecture, one page per feature) are in the panel repository's
  [docs/](https://github.com/plugged-host/panel/tree/main/docs); these pages are for people running
  a panel.
- [plugged-host/site](https://github.com/plugged-host/site) and
  [plugged-host/status](https://github.com/plugged-host/status): plugged.host and its status page.

## Security

Please report vulnerabilities privately, see [SECURITY.md](SECURITY.md).

## Licence

MIT, © noprofit.space, see [LICENSE](LICENSE). The plugged.host name and logo are not covered by
the licence.

Come say hi on [Discord](https://discord.gg/plugged-host-1502647500295635085).
