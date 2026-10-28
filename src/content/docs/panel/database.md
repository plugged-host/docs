---
title: Database and Redis
description: Create the PostgreSQL database and role the panel uses, and give it a Redis or Valkey database of its own.
---

The panel keeps everything in PostgreSQL and uses Redis (or Valkey, which speaks the same
protocol) for its cache, sessions and rate limits. Set both up before you install the panel.

## PostgreSQL

Install PostgreSQL 15 or newer from your distribution, then create a role and a database it owns:

```bash
sudo -u postgres createuser -P calagopus      # asks for the role's password
sudo -u postgres createdb -O calagopus calagopus
```

The connection string the panel needs is then:

```
postgresql://calagopus:<password>@127.0.0.1:5432/calagopus
```

The panel creates its tables itself: with `DATABASE_MIGRATE=true` it applies every migration it
has not run yet each time it starts. You never run schema SQL by hand.

:::caution
Back up this database like any production database (for example a nightly `pg_dump`). It holds
every user, server and setting, and the stored secrets, which are encrypted with the panel's
`APP_ENCRYPTION_KEY`: keep a copy of that key with your backups, or the secrets in a restored
database cannot be read.
:::

### Read replicas

With `DATABASE_URL_PRIMARY` set, the panel writes to that database and reads from `DATABASE_URL`
(a replica). Leave it unset for a single database.

## Redis or Valkey

Install Redis or Valkey from your distribution. A Redis that other applications use is fine, as
long as the panel gets its own database number and key prefix:

```
REDIS_URL="redis://127.0.0.1:6379/3"
REDIS_KEY_PREFIX="calagopus"
```

The prefix puts every key under `calagopus::`, so two panels (or a panel and another app) can share
one Redis. Changing it later orphans the old keys; nothing is lost but the cache and the open
sessions.

For a Redis with Sentinel, set `REDIS_MODE=sentinel`, `REDIS_SENTINEL_CLUSTER` (the master's name)
and `REDIS_SENTINELS` (the sentinels as comma-separated `host:port`) instead of `REDIS_URL`. The
panel then uses database 0, so set a key prefix when that Redis is shared.

## Next

[Install the panel](/panel/install/).
