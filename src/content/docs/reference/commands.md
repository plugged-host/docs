---
title: Commands
description: The panel-rs and wings-rs command-line commands, and how to run them with the panel's environment.
---

## Running panel commands

`panel-rs` without arguments starts the panel. With a subcommand it reads the environment, does the
job and exits; it never starts a second panel. Run subcommands with the same environment and user as
the service:

```bash
sudo systemd-run --quiet --pty --collect \
  -p User=calagopus -p WorkingDirectory=/var/lib/calagopus \
  -p EnvironmentFile=/etc/calagopus/panel.env \
  /opt/calagopus/current/panel-rs <command>
```

`panel-rs <command> --help` lists a command's options. Most commands take `--json` for output a
script can read.

## panel-rs

| Command | What it does |
|---|---|
| `version` | Prints the release (`release v3.0.2`) and Calagopus's version |
| `diagnostics` | Collects a report for troubleshooting; asks before uploading it ([troubleshooting](/panel/troubleshooting/#diagnostics)) |
| `completions <shell>` | Shell completions |
| `service-install` | Writes upstream's basic systemd (or OpenRC) unit for the binary. These docs use [their own unit](/panel/install/#4-the-systemd-unit) instead |
| `users create` | Creates a user: `--username`, `--email`, `--password`, `--name-first`, `--name-last`, `--admin true`. Asks for what is missing |
| `users reset-password --user <user>` | Sets a new password (username, email or UUID) |
| `users disable-2fa --user <user>` | Removes two-factor authentication from an account |
| `users verify-email --user <user>` | Marks the email address as verified |
| `nodes create` | Creates a node from the command line (location, name, URL, SFTP, memory, disk) |
| `nodes reset-token <node>` | Issues a new token for a node (name or UUID); reconfigure its Wings afterwards |
| `nests create` | Creates a nest |
| `nests mass-import <nest> <dir>` | Imports every egg in a folder into a nest ([eggs](/nodes/eggs/)) |
| `backups s3 import` | Imports backups that exist in an S3 backup configuration but not in the panel |
| `oobe reset --step <step>` | Puts the first-run setup back to a step |
| `oobe finish` | Marks the first-run setup as finished |
| `devboxes edge-certificates --dir <dir>` | Writes the certificates the browser edge for devboxes needs ([devboxes](/servers/devboxes/)) |
| `database-migrator status` | Shows which migrations are applied |
| `database-migrator migrate` | Applies pending migrations (when `DATABASE_MIGRATE=false`) |

The `import` and `extensions` groups are upstream's. The binary build does not support extensions,
and plugged.host's features are in the source, not extensions.

## wings-rs

Always with `--config` ([Wings](/nodes/wings/)):

| Command | What it does |
|---|---|
| `wings-rs --config <file>` | Runs Wings |
| `wings-rs --config <file> configure --enroll <code> --panel-url <url>` | Writes the node's configuration from a one-time enrollment code |
| `wings-rs version` | Prints the Wings version |
| `wings-rs --config <file> diagnostics` | Collects a report for troubleshooting |

## The panel's API

The panel documents its own HTTP API at `https://panel.example.com/docs/api`, generated from the
routes of the running build, plugged.host's included: the client API at `/docs/api/client` and the
admin API at `/docs/api/admin`, each with "Try It", and their OpenAPI documents at
`/docs/api/client.json` and `/docs/api/admin.json` (`/openapi.json` is the whole document). Only
signed-in users see them.
