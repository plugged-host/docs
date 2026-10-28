---
title: Versions
description: How plugged.host names its panel and Wings releases, where the release shows, and how it relates to Calagopus's version.
---

Every build of the panel knows its **release**: `v{VERSION}`, for example `v3.0.2`. `VERSION` is a
file at the root of the [panel repository](https://github.com/plugged-host/panel), bumped by hand
for every release, fixes included.

## Rules

- **One name per build.** The panel is a compiled binary, so what runs is what was built and
  installed. A fix for a released line is a new version (`3.0.1` → `3.0.2`); a release is never
  rebuilt under the same name.
- **No commit in the name.** Releases are named by the version only.
- **A GitHub release per version**, with the panel binaries for every architecture, the all-in-one
  builds, Docker images (`ghcr.io/plugged-host/panel:<version>`) and a source SBOM. The release
  notes name the [Wings release](https://github.com/plugged-host/wings/releases) that goes with it.
- **Wings releases** follow the panel's numbering and are only cut when Wings changes, so a panel
  release often names an older Wings release as its partner.
- **Calagopus's own version stays.** Cargo's package version is upstream's, so error reports and
  compatibility checks keep using Calagopus's numbers. The release notes say which Calagopus
  version a release is based on.

## Where it shows

| Where | What |
|---|---|
| The panel's footer | The release of the running build |
| `panel-rs version` | `release v3.0.2`, then Calagopus's version |
| `GET /api/settings` | `app.release`, for the frontend and outside tools |
| `/data/current.json` | `release`, for the [status page](/status/status-page/) |

## Your own builds

Set `PANEL_RELEASE` at build time to give a build of your own a name of its own (for example
`v3.0.2-yourname.1`), so it is never mistaken for an official release
([building from source](/panel/building/)).
