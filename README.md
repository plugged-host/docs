# plugged.host docs

The documentation site at [docs.plugged.host](https://docs.plugged.host): how to set up a panel
like [plugged.host](https://plugged.host), which is [Pelican Panel](https://pelican.dev) with the
[plugged.host plugins](https://github.com/plugged-host/plugins), plus its nodes, storage box,
Discord bots and status page.

## How it's built

- **[Starlight](https://starlight.astro.build)** (Astro). Pages are Markdown in
  `src/content/docs/`, the sidebar is in `astro.config.mjs`.
- **plugged.host's look**: `src/styles/theme.css` maps the shared token layer of the website and
  status page onto Starlight's variables; the fonts are self-hosted in `public/fonts/`.
- **Hosting:** a Cloudflare Worker with static assets only (`wrangler.jsonc`, no Worker script).
  Workers Builds runs `npm run build` and deploys `dist/` with `npx wrangler deploy` on every push
  to `main`. `scripts/headers.mjs` writes `dist/_headers` after the build: security headers and a
  Content Security Policy with the hashes of the few inline scripts Starlight emits.

## Working on it

```bash
npm ci
npm run dev       # local preview
npm run build     # static site in dist/
```

Node.js 22 or newer (`.node-version` says 26). How to write pages: [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Please report vulnerabilities privately, see [SECURITY.md](SECURITY.md).

## Licence

MIT, © noprofit.space, see [LICENSE](LICENSE). The plugged.host name and logo are not covered by
the licence.

Come say hi on [Discord](https://discord.gg/plugged-host-1502647500295635085).
