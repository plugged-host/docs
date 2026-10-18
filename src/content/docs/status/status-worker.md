---
title: Status Worker
description: Run the status page and its out-of-band prober on Cloudflare Workers, so it keeps working when the panel is down.
---

[plugged-host/status](https://github.com/plugged-host/status) is a static status page plus a
Cloudflare Worker. Once a minute the Worker probes your website, the panel's `/up` and every node's
Wings port from Cloudflare's network, fetches the panel's [export](/status/status-export/) for what
only the panel knows (load, incidents, maintenance), merges the two and serves the result at
`/data/*.json` and `/feed.xml`. When the panel is unreachable the page says **Panel: offline**
instead of going blank, and nodes show the Worker's own verdict.

Everything runs on the Workers Free plan: a Cron Trigger, a SQLite-backed Durable Object
(`StatusMonitor`) that keeps the state, and static assets for the page.

## Make it yours

Fork the repository, then change:

| File | What to change |
|---|---|
| `wrangler.jsonc` | `name` (your Worker's name), and the `vars`: `PANEL_URL` (base of the export, `https://panel.example.com`), `PANEL_HEALTH_URL` (`https://panel.example.com/up`), `SITE_URL` (your website), `RSS_BASE_URL` (the status page's own URL), `MONITOR_LOCATION` (a Durable Object location hint near your panel and nodes, e.g. `weur`, `enam`). |
| `wrangler.jsonc` `services` | The `SITE` binding names plugged.host's website Worker. Point it at your own website Worker, or delete the block if you don't have one (the site is then probed over its public URL only). |
| `index.html` | The name, logo, links and the `status-origin` meta tag (the panel URL the page falls back to when its own `/data/` fails). |
| `_headers` | `connect-src` in the Content Security Policy: your panel's and website's origins instead of plugged.host's. |
| `monitor/compose.js` | The RSS feed's title and description. |
| `assets/` | The logo. The stylesheet is compiled from `assets/status.src.css`; after changing styles run `npm run build:css` and commit the output. |

The plugged.host name and logo are not covered by the repository's licence, so replace them.

## Deploy

Create the Worker with **Workers Builds** connected to your fork:

1. Cloudflare dashboard › Workers & Pages › Create › Import a repository, pick the fork.
2. Build command: none. Deploy command: `npx wrangler deploy`. The Worker name must equal `name` in
   `wrangler.jsonc`.
3. Deploy. `wrangler deploy` creates the Cron Trigger and the Durable Object itself; there is no
   dashboard step for them.
4. Add a custom domain (Settings › Domains & Routes), e.g. `status.example.com`.

From then on every push to `main` deploys. To deploy from your machine instead: `npm install`, then
`npx wrangler deploy`.

Right after the very first deploy, `/data/*` can answer 502 for a few seconds until the first tick
has stored data; the page falls back to the panel's export meanwhile.

## Requirements on your side

- The panel's export is reachable at `PANEL_URL/data/` with CORS (the [nginx vhost](/panel/web-server/)
  does this).
- **Node names are not proxied by Cloudflare.** Workers can't open TCP connections to Cloudflare's
  own addresses, so a proxied node would always look down.
- If you have a website Worker that shows status, deploy the status Worker first: the website's
  service binding needs it to exist.

## Local preview

```bash
npm install
npx wrangler dev --persist-to ../status-state
```

Keep `--persist-to` outside the repository: the repository root is the asset directory, and state
written inside it makes the dev server reload in a loop.
