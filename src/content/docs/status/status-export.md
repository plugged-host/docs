---
title: Status export
description: How the panel collects status data every minute and publishes it as JSON and RSS for a status page.
---

The [status plugin](/plugins/status/) turns what the panel knows (node health and load, incidents,
maintenance) into a few static files. A status page reads them; on plugged.host that page is the
[status Worker](/status/status-worker/) on Cloudflare, which also probes everything from outside
so it keeps working when the panel is down.

```
scheduler (every minute)
  └─ plugged-host:status-collect   reads node telemetry and the health URLs, stores a snapshot,
                                   then writes the export:
       STATUS_EXPORT_PATH/
         data/current.json      every component's status now, CPU and memory per node, the release
         data/history.json      daily uptime per component (STATUS_HISTORY_DAYS)
         data/incidents.json    the last 50 incidents with their updates
         data/feed.xml, feed.xml  the incidents as RSS
         data/targets.json      what the Worker should probe: each published node's label, host, Wings port
nginx /data/  →  the status Worker, your website, anyone
```

## Set it up

1. **Export directory**, owned by the panel user:

   ```bash
   sudo mkdir -p /var/www/status-export/data
   sudo chown -R www-data:www-data /var/www/status-export
   ```

2. **Serve it** at `https://panel.example.com/data/` with the `location /data/` block from the
   [nginx vhost](/panel/web-server/). It sends `Access-Control-Allow-Origin: *` so pages on other
   domains can read it, and `no-store` so nothing caches it.
3. **Settings** in Admin › Plugins › plugged.host Status:

   | Setting | Example | What it does |
   |---|---|---|
   | `STATUS_EXPORT_PATH` | `/var/www/status-export` | Where the files are written. Empty turns the export off; snapshots are still collected. |
   | `STATUS_RSS_BASE_URL` | `https://status.example.com` | The link in the RSS feed. |
   | `STATUS_SITE_HEALTH_URL` | `https://example.com/` | Probed to decide whether the website is up. The default, `http://127.0.0.1/healthz`, only works if something answers there. |
   | `STATUS_SITE_HEALTH_HOST` | | A `Host` header for that probe, when the URL is an IP address. |
   | `STATUS_PANEL_HEALTH_URL` | `https://panel.example.com/up` | Probed for the panel's own status. |
   | `STATUS_HISTORY_DAYS` | `90` | How many days of uptime history are kept and exported. |
   | `STATUS_RESOURCE_THRESHOLD_PERCENT` | `95` | CPU use that, held for five checks in a row, marks a node degraded. Memory and disk don't count. |

   :::caution
   Set both health URLs to addresses that answer with a 2xx. An empty or unreachable URL counts as
   a failed check: after three of them the website or panel shows as offline, and the page's
   overall status becomes a major outage.
   :::

4. **Choose the nodes**: Admin › Status page › Nodes. The collector adds every Pelican node by
   itself, published at first when the node is set to "Use for Deployments". Switch entries on or
   off and set their order here. The public label is the Pelican node's name, synced every minute:
   rename the node (`France 1` rather than a host name) to change what visitors see. Only enabled
   entries are exported, and only they end up in `targets.json`.
5. Wait a minute, then check: `curl -s https://panel.example.com/data/current.json | head -c 300`.

## Incidents and maintenance

- **Admin › Status page › Incidents**: an incident has a title, an impact, the affected components
  and a timeline of updates. Open incidents override the components' measured status on the
  page, and every update stays visible after it is resolved.
- **Admin › Status page › Components**: set a component's status by hand for a time window, for
  planned maintenance or a known problem the probes can't see. Each entry has a note and a start
  and end.

## The JSON

The files are meant to be read by any page, not only plugged.host's. The component status values
are:

`operational`, `degraded`, `maintenance`, `partial_outage`, `major_outage`, `offline`, `unknown`

In `incidents.json`, an incident's `components` are the components' **labels** as they appear in
`current.json` (`"Website"`, `"France 1"`), not keys.

`targets.json` contains node host names and Wings ports. They aren't secret (every server's
address is its node's name, and browsers connect to Wings directly), but leave it out of the
nginx location if you'd rather not publish them, and the Worker then won't probe nodes itself.

## Commands

```bash
sudo -u www-data php artisan plugged-host:status-collect   # what the scheduler runs each minute
sudo -u www-data php artisan plugged-host:status-export    # rewrite the files from stored data
sudo -u www-data php artisan plugged-host:status-prune     # drop data older than the retention (daily)
```
