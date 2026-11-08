---
title: Versions
description: How plugged.host names its panel and Wings releases, where the release shows, and how it relates to Calagopus's version.
---

Every build of the panel knows its **release**: `v{VERSION}`, for example `v3.1.0`. `VERSION` is a
file at the root of the [panel repository](https://github.com/plugged-host/panel), bumped by hand
for every release, fixes included.

Wings has its own `VERSION` file at the root of the
[Wings repository](https://github.com/plugged-host/wings). Its releases use the panel's number
(`v3.1.0`) and are cut only when Wings changed, so a panel release can name an older Wings release
as its partner.

## Rules

- **One name per build.** The panel and Wings are compiled binaries, so what runs is what was built
  and installed. A fix for a released line is a new version (`3.1.0` → `3.1.1`); a release is never
  rebuilt under the same name.
- **No commit in the name.** Releases are named by the version only. `calagopus-wings version`
  prints the release, then the commit it was built from and the Calagopus version it is based on.
- **A GitHub release per version.** The panel's carries the panel binaries for every architecture,
  the all-in-one builds, Docker images (`ghcr.io/plugged-host/panel:<version>`) and a source SBOM.
  Wings' carries `calagopus-wings-<arch>-linux` for every architecture, the Docker images
  (`ghcr.io/plugged-host/wings:<version>`) and a source SBOM. The panel's release notes name the
  Wings release that goes with it.
- **Wings updates come from its own repository.** `calagopus-wings` checks the latest
  [plugged-host/wings release](https://github.com/plugged-host/wings/releases) tagged `v{VERSION}`
  and the panel's Admin › Nodes › Upgrade installs it. A node with `ignore_panel_wings_upgrades:
  true` is updated by hand instead.
- **Calagopus's own version stays.** Cargo's package version is upstream's, so error reports and
  compatibility checks keep using Calagopus's numbers. The release notes say which Calagopus
  version a release is based on.

## Where it shows

| Where | What |
|---|---|
| The panel's footer | The panel release of the running build |
| `panel-rs version` | `release v3.1.0`, then Calagopus's version |
| `GET /api/settings` | `app.release`, for the frontend and outside tools |
| `/data/current.json` | `release`, for the [status page](/status/status-page/) |
| Admin › Nodes, and `GET /api/system` on a node | The Wings release (`v3.1.0`), and whether a newer one exists |
| `calagopus-wings version` | The Wings release and commit, the Calagopus version, and where it upgrades from |

## Your own builds

Set `PANEL_RELEASE` at build time to give a panel build of your own a name of its own (for example
`v3.1.0-yourname.1`), and `WINGS_VERSION` for a Wings build, so neither is ever mistaken for an
official release ([building from source](/panel/building/)).
