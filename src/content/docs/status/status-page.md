---
title: Status page
description: The panel checks the website, itself and every node each minute and publishes the results, incidents and uptime for a public status page.
---

The panel watches the website, itself and every node once a minute and publishes what it finds as
JSON files and an RSS feed under `/data/`. Admins post incidents, override a component's status for
a while and choose which components are listed. The public status page is a separate site that
reads those files: plugged.host's is [plugged-host/status](https://github.com/plugged-host/status),
run as a [Cloudflare Worker](/status/status-worker/) that keeps working while the panel is down.

## What it does

- **Components**: one per checked thing. The panel adds and removes them itself: a node gets one
  when it is created and loses it (with its uptime) when it is deleted, a node's label follows its
  name, and the website or panel component goes when its URL is emptied. Admins can hide a component
  (it is still checked) and set the order.
- **Checks**, every minute:

  | Component | Checked by | Listed while |
  |---|---|---|
  | Website | a `GET` of the Website URL; any 2xx is up | the Website URL is set |
  | Panel | a `GET` of the Panel URL | the Panel URL is set |
  | Each node | its newest [telemetry](/nodes/telemetry/) sample (no extra request to Wings) | the node exists |

- **From checks to a status**:
  - Website and panel: one failed check is `degraded`, three in a row `offline`; the first good
    check after a failure is still `degraded`.
  - Nodes: no answer is `degraded` from the second check in a row and `offline` from the third. A
    node whose Wings refused the connection (the machine is up, its servers keep running) stays at
    `degraded`. A node in maintenance mode is `maintenance`. CPU at or over the CPU threshold for
    five checks in a row is `degraded` (full memory or disk does not count). Coming back from
    `degraded` or `offline` takes two good checks. A sample older than 150 seconds counts as no
    answer.
- **Incidents** (Admin › Status › Incidents), each with updates. An unresolved incident raises its
  components (none chosen: all) to its impact's status if that is worse: `minor` → `degraded`,
  `major` → `partial_outage`, `critical` → `major_outage`, `maintenance` → `maintenance`. An update
  with the status `resolved` resolves it.
- **Overrides** (Admin › Status › Overrides) set a component (none chosen: all) to a status with a
  note, from a start to an end, whatever the checks and incidents say. Use them for planned work.
- **Overall status**: `major_outage` when the website or the panel is `offline` or `major_outage`,
  any component is `major_outage`, or every node is `offline`; otherwise `partial_outage` when
  something is `offline` or `partial_outage` (one node down is not the whole service); otherwise the
  worst of `degraded`, `maintenance`, `unknown` and `operational` any listed component has.
- **Uptime**: every check counts towards its component's day; 90 days are kept by default.

Statuses, best to worst: `operational`, `maintenance`, `degraded`, `partial_outage`,
`major_outage`, `offline` (`unknown` before the first check).

## Setup

1. Admin › Settings › General › Status Page: turn on **Enable the Status Page**, set the
   **Website URL** and the **Panel URL** (for example `https://panel.example.com/api/settings`) and
   save.
2. Within a minute, Admin › Status › Components lists the website, the panel and every node, each
   with a status and when it was last checked.
3. Hide what should not be public (Admin › Status › Components › a component › Edit › Published)
   and set the order.
4. Optional: in Admin › Nodes › a node › Edit, fill in the CPU model and memory type; the files
   carry them for the status page to show.
5. Point a status page at `https://panel.example.com/data/`, for example the
   [status Worker](/status/status-worker/).

## Settings

Admin › Settings › General › Status Page:

| Setting | Default | What it does |
|---|---|---|
| Enable the Status Page | off | Runs the checks and serves `/data/*`. Off: nothing is checked and `/data/*` answers 404 |
| Website URL | empty | Probed each minute; empty: no website component |
| Website Host Header | empty | Sent with the website probe when the Website URL is an address instead of a name |
| Panel URL | empty | Probed each minute; empty: no panel component |
| Status Page URL | empty (the panel's URL) | Linked from the RSS feed |
| CPU Threshold | 95 % | Node CPU that, held for five checks, makes the node `degraded` |
| History | 90 days | How long daily uptime is kept (the files show up to 90 days) |

## The files

Served at `https://panel.example.com/data/...` with `Access-Control-Allow-Origin: *` and a
30-second cache. Only published components appear. Every JSON file has `schema_version` 1 and
`generated_at`.

| File | Holds |
|---|---|
| `current.json` | The overall status, each component's label, status and note, each node's CPU, memory and storage use and their sum, each node's CPU model and memory type, and the panel's release |
| `history.json` | The last hour of each node's CPU and memory, and per component the uptime percentage and up to 90 days of daily results |
| `incidents.json` | The newest 50 incidents with their components (labels, or "All systems"), times and updates |
| `targets.json` | Each published node's label, host and Wings port, for an outside monitor that probes the nodes while the panel is down |
| `feed.xml` | The incidents as RSS 2.0, linking to the Status Page URL |

The panel also answers `GET /up` with `200 ok` while it reaches its database within 3 seconds, and
`503` otherwise. The status Worker probes it as the panel's health URL.

## Permissions

| Permission | Allows |
|---|---|
| `status.read` | Viewing Admin › Status (components, incidents, overrides) |
| `status.manage` | Editing components, posting and updating incidents, creating and deleting overrides |

Every change is in the admin activity log.

## Background tasks

| Task | When |
|---|---|
| `collect_status` | Every minute, after the telemetry sample |
| `prune_status` | Daily at 04:20, deletes uptime days older than History |
