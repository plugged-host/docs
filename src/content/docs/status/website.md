---
title: Website
description: How plugged.host's website is built and hosted on Cloudflare Workers, and how it shows live status.
---

[plugged-host/site](https://github.com/plugged-host/site) is plugged.host's marketing website:
plain HTML pages and one compiled stylesheet, served by Cloudflare Workers. It is plugged.host's
own content, so you'll write your own site; this page describes how it is put together, which is a
good starting point.

## How it is built

- **No framework, no build on Cloudflare.** What's in the repository is what's served. The
  stylesheet is Tailwind CSS v4, compiled locally (`npm run build:css`, `assets/app.src.css` →
  `assets/app.v5.css`) and committed.
- **Strict Content Security Policy** (`_headers`): no inline scripts or styles, no CDNs. Fonts
  (Space Grotesk, JetBrains Mono) are self-hosted in `assets/fonts/`.
- **Cache busting by file name.** Assets are served `immutable` for a week, so a changed
  stylesheet gets a new name (`app.v5.css` → `app.v6.css`).
- **`.assetsignore`.** The repository root is the asset directory, so tooling, sources and
  `node_modules` are listed there to keep them out of the upload.

## Live status on the page

`worker.js` answers `/data/*` by asking the [status Worker](/status/status-worker/) through a service
binding (`STATUS`), with the status page's public URL (`STATUS_URL`) as the fallback. Everything else
is a static file, and unknown paths get the real `404.html`. The page's script reads
`/data/current.json` for the live status strip.

If you copy this approach, deploy the status Worker before the website: a service binding to a
Worker that doesn't exist yet fails the deploy.

## Deploy

Like the status page: Workers Builds connected to the repository, no build command, deploy
command `npx wrangler deploy`, and the Worker's name equal to `name` in `wrangler.jsonc`. Pushing
`main` deploys production, so test locally first:

```bash
npm install
npx wrangler dev --persist-to ../site-state
npx wrangler deploy --dry-run    # checks the upload, including asset sizes
```

The plugged.host name and logo are not covered by the repository's licence.
