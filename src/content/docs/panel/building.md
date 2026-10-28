---
title: Building from source
description: Build the panel and Wings binaries yourself, for your own changes or an architecture without a release binary.
---

You only need this to run changes of your own. The [releases](https://github.com/plugged-host/panel/releases)
carry ready binaries for every supported architecture.

## What you need

The Rust build is heavy: plan for 8 GB of memory and 20 GB of disk for `target/`. Build on a
separate machine if your panel box is small, then copy the binary over.

| Tool | Version |
|---|---|
| Rust | stable, at least `rust-version` in `Cargo.toml` (`rustup update stable`) |
| Node.js | 26 (24 works) |
| pnpm | 11 (`corepack enable`) |
| mold | optional, a faster linker (`RUSTFLAGS='-C link-arg=-fuse-ld=mold'`) |

## Build the panel

The frontend is embedded in the binary, so build it first:

```bash
git clone https://github.com/plugged-host/panel.git && cd panel

cd frontend && pnpm install && pnpm build && cd ..
SQLX_OFFLINE=true cargo build --profile release-fast -p panel-rs
```

The binary is `target/release-fast/panel-rs`. Install it like a release binary
([install](/panel/install/), [updating](/panel/updating/)).

| Profile | Use |
|---|---|
| `cargo build` | Development: fast to build, slow to run |
| `--profile release-fast` | Optimised without link-time optimisation, incremental: minutes. What plugged.host runs |
| `--release` | Upstream's release profile (full LTO, size-optimised): close to an hour |

`SQLX_OFFLINE=true` lets the build check its SQL against the committed `.sqlx/` data instead of a
live database.

The binary contains the frontend from the last `pnpm build`: rebuild the frontend whenever it
changed, or you ship the old one.

### The release name

The release comes from the `VERSION` file at the repository root (`3.0.2` → `v3.0.2`). Set
`PANEL_RELEASE` at build time to name a build of your own differently, so it is never confused
with an official release.

### Languages

Every offered language must have every string, or the panel shows English in its place.
`pnpm build:translations && pnpm coverage:translations` in `frontend/` checks it (plugged.host's
own build refuses to ship while it fails); see [branding](/panel/branding/#languages) for changing
the offered languages.

## Build Wings

```bash
git clone https://github.com/plugged-host/wings.git && cd wings
cargo build --profile release-fast -p wings-rs
```

The binary is `target/release-fast/wings-rs`. Install it as in [Wings](/nodes/wings/). A build on
a newer distribution than your nodes can need a newer glibc than the nodes have: build on the
oldest distribution you run (for example in a `rust:<version>-bookworm` container for Debian 12
nodes).

## Working on the code

The panel repository's own documentation covers development: running it from a clone, the
frontend dev server, tests, checks, migrations and strings. Start with
[docs/README.md](https://github.com/plugged-host/panel/blob/main/docs/README.md) and
[docs/development.md](https://github.com/plugged-host/panel/blob/main/docs/development.md).
