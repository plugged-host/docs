---
title: Versions
description: How a plugged.host release is numbered, where the version shows, and how agents follow it.
---

One version names the whole release: **`vMAJOR.MINOR.PATCH.COMMIT`**, for example `v2.2.0.9c396e7`.

| Part | Meaning |
|---|---|
| `2` | the generation of plugged.host; changes rarely |
| `.2` | the release (2.1, 2.2 …), developed on its own branch of the plugins repository |
| `.0` | fixes, sometimes with small features |
| `.9c396e7` | the commit the panel's `plugins/` clone has checked out, so every deploy is a new version |

The first three parts are the `VERSION` file at the root of the plugins repository. The commit is
read from the clone's `.git` directory at runtime (no `git` binary needed).
`PLUGGED_HOST_RELEASE` in `.env` overrides the whole string, for a deploy without `.git`.

## Where it shows

The panel footer, error pages, the backups portal, `plugged-host:doctor`, Admin › Plugins (each
first-party plugin as `2.2.0` plus the commit), neo's knowledge of the panel, and the status
export's `current.json` (`release`), which the status page and website footers display.

## Plugins

Every first-party plugin has the release's version in its `plugin.json`, even plugins a release
didn't touch, and they are bumped together with `VERSION` in one commit. The third-party plugins
(`announcements`, `subdomains`, `mclogs-uploader`) keep their own versions.

## Agents

Agents follow the release too. An agent's version is `VERSION` plus the start of a SHA-256 of the
agent's own code (`2.2.0.1a2b3c4`), so it changes only when the agent or the release changes.

- **Storage agent**: updates itself. It compares its version with the panel's manifest and
  downloads the new bundle from the panel.
- **Abuse agent**: reports its version; Admin › Servers › Abuse › Node agents marks outdated nodes.
  Re-run the installer on them to update ([Abuse agent](/nodes/abuse-agent/)).

## Pelican

Each release is built against one Pelican version (2.2: **v1.0.0-rc.1**). See
[Updating](/panel/updating/#upgrading-pelican) before moving either.
