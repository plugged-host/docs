---
title: Status
description: Incidents, maintenance and component controls in the admin area, and the JSON and RSS export a public status page reads.
sidebar:
  order: 12
---

plugged-host-status gives the panel a public status page's back end. Every minute it records
whether each published node is up (and the website and the panel, when you give it their health
URLs), keeps the uptime history, and writes it all, with your incidents and maintenance notices,
as static JSON and RSS files. The admin area gets a Status page entry where you publish
incidents, pin a component's status by hand and choose which nodes the page shows. How the files
are served and read is on [Status export](/status/status-export/) and
[Status Worker](/status/status-worker/); this page covers the plugin itself.

## What it does

- **Checks every minute.** It requests the website's and the panel's health URLs (3 seconds to
  connect, 5 to answer; any 2xx counts as up; the User-Agent is `<APP_NAME> status monitor`). A
  blank health URL is not requested at all. It reads each published node's latest sample from
  [core's node telemetry](/plugins/core/#nodes). A node without a sample from the last 150 seconds,
  or without load figures, counts as unreachable. Each check is stored as a snapshot and added to
  that component's daily uptime.
- **Decides each component's status.**
  - A node is **degraded** from its second missed check in a row and **offline** from the third.
    One missed check changes nothing.
  - A reachable node whose CPU is at or above `STATUS_RESOURCE_THRESHOLD_PERCENT` for five checks
    in a row is **degraded**. Memory and disk never count: a full node is not a slow one.
  - A node in Pelican's maintenance mode shows **maintenance**.
  - A node coming back from degraded or offline needs two good checks before it is
    **operational** again.
  - The website and the panel are **degraded** after one failed check, **offline** after three,
    and **degraded** for the first good check after a failure.
- **Incidents.** Published incidents raise the status of the components they affect while they are
  open: impact critical → major outage, major → partial outage, maintenance → maintenance, minor →
  degraded. They never lower a status.
- **Component controls.** A control sets a component, or all of them, to a status you choose, with
  an optional public note, for an optional time window. Controls win over both the checks and the
  incidents.
- **The export.** After every check, and right after any change in the Status page admin, it
  writes `data/current.json`, `data/history.json`, `data/incidents.json`, `data/targets.json` and
  the RSS feed (`data/feed.xml` and `feed.xml`) into `STATUS_EXPORT_PATH`, each by writing a
  temporary file and renaming it. `current.json` carries the release the panel runs, for the sites'
  footers. The Website and Panel components appear in `current.json` and `history.json` only when
  their health URL is set. The format is described on
  [Status export](/status/status-export/#the-json).
- **The overall status.** Taken over the listed components only, so a website or panel that isn't
  checked doesn't count. Major outage when the website or the panel is offline, any component is
  in major outage, or every node is offline; partial outage when anything is offline or in partial
  outage; then degraded, maintenance and unknown, in that order; otherwise operational.
- **Retention.** Snapshots and daily rows older than `STATUS_HISTORY_DAYS` are deleted.

### Admin › Status page

One sidebar entry (in the Announcements & status group) with three tabs. All three need the admin
permission to view nodes.

- **Incidents**: title, impact (maintenance, minor, major, critical), status (investigating,
  identified, monitoring, resolved), the affected components (All systems, Website, Panel, each
  published node), the start time, and the public updates, each with a status, a time and a
  message. Updates are public and go into the RSS feed. Setting the status to Resolved fills in the
  resolved time; reopening clears it. The export keeps the last 50 incidents.
- **Nodes**: one entry per Pelican node. New nodes are added by the next check, published if the
  node has "Use for Deployments?" on in Pelican. The public label is always the node's name in
  Pelican (rename the node to change it); you choose whether it is published and monitored, and
  its order. Only published nodes appear in the export and in `targets.json`.
- **Components**: the component controls. Each has a component, a status (operational,
  maintenance, degraded, partial outage, major outage, offline), a public note, and optional start
  and end times (empty start: now; empty end: until you delete it).

## Requirements

- [plugged-host-core](/plugins/core/): the node figures come from its telemetry.
- The scheduler (see [Queue and scheduler](/panel/queue-and-scheduler/)).
- For the export: a directory the panel user can write, and a web server location that serves
  it. See [Status export](/status/status-export/#set-it-up).

## Setup

Follow [Status export](/status/status-export/#set-it-up): create the export directory, serve it,
fill in the settings, then pick the nodes to publish under Admin › Status page › Nodes. For a
status page that keeps working when the panel is down, add the
[Status Worker](/status/status-worker/).

## Settings

Admin › Plugins › plugged.host Status › Settings.

### Status site export

| Setting | Default | What it does |
|---|---|---|
| Export path (`STATUS_EXPORT_PATH`) | empty | The directory the files are written to. The panel creates it if it can. Empty, or not writable, turns the export off (logged once); the checks still run and are stored. |
| Status site URL (`STATUS_RSS_BASE_URL`) | empty | The public status page's URL, used only as the link in the RSS feed. |

### Health probes

| Setting | Default | What it does |
|---|---|---|
| Site health URL (`STATUS_SITE_HEALTH_URL`) | empty | Requested every minute for the "Website" component, e.g. `https://example.com/`. Empty: the website isn't checked, and the Website row is left out of the export and the overall status. |
| Site health Host header (`STATUS_SITE_HEALTH_HOST`) | empty | A `Host` header for that request, when the URL is an IP address. |
| Panel health URL (`STATUS_PANEL_HEALTH_URL`) | empty | Requested every minute for the "Panel" component, e.g. `https://panel.example.com/up` (Laravel's health route, which Pelican has). Empty: the panel isn't checked, and the Panel row is left out of the export and the overall status. |

### Retention & thresholds

| Setting | Default | What it does |
|---|---|---|
| History retention (days) (`STATUS_HISTORY_DAYS`) | `90` | How many days of snapshots and daily uptime are kept. 1 to 3650. |
| CPU pressure threshold (%) (`STATUS_RESOURCE_THRESHOLD_PERCENT`) | `95` | CPU use that, held for five checks in a row, marks a reachable node degraded. 0 to 100. |

## Commands

| Command | What it does |
|---|---|
| `plugged-host:status-collect` | Collect public service telemetry and atomically export the status page data. Also deletes data past the retention. |
| `plugged-host:status-export` | Regenerate the public status JSON and incident feed from what is stored. |
| `plugged-host:status-prune` | Delete status telemetry outside the configured retention period. |

On the scheduler:

| Task | How often |
|---|---|
| `plugged-host:status-collect` | every minute |
| `plugged-host:status-prune` | daily at 03:17 |

## Notes

- **An unreachable health URL is an outage.** A URL that is set but doesn't answer with a 2xx fails
  every check, so after three minutes the component is offline, and an offline website or panel
  makes the overall status a major outage. Leave the URL empty instead if you don't want that
  component.
- **Unchecked components can still be named.** The Incidents and Components tabs offer Website
  and Panel even when their health URL is empty. An incident that names one still lists it in
  `incidents.json`; a control on one does nothing, because the component isn't listed.
- **The page shows your node names.** The label of a node is its Pelican name and is resynced every
  minute, so name nodes the way visitors should see them.
- **"Use for Deployments?" only sets the start.** That node setting decides whether a new node is
  published when it is first added; after that, the Nodes tab decides.
- **The export always covers 90 days.** `history.json` holds the last 90 days of uptime whatever
  `STATUS_HISTORY_DAYS` says; a shorter retention leaves those days empty (`unknown`).
- **Fixed labels.** The components are labelled "Website" and "Panel" in the plugin's code. The RSS
  feed's title and description use the panel's name: with `APP_NAME="Example Host"` they read
  "Example Host incidents" and "Operational updates for Example Host."
