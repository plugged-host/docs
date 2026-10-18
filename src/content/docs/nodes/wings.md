---
title: Wings nodes
description: Add a game node with plugged.host's conventions for names, allocations, locations and deployment tags.
---

Game nodes run unmodified [Wings](https://pelican.dev/docs/wings/install), exactly as Pelican
documents it. plugged.host adds a few conventions on the panel side and two small pieces on the
node: the [abuse agent](/nodes/abuse-agent/) and, with a storage box, the
[mirror key](/storage/storage-box/#authorize-the-mirror-key-on-every-node).

## Before you start

- **A DNS name per node**, e.g. `node1.example.com`, pointing straight at it (**not proxied**).
  It is what players connect to and what browsers open the console websocket to.
- Ports 80 and 443 reachable for the Let's Encrypt certificate, the Wings API port (`8080` by
  default) reachable from the panel and from browsers, SFTP (`2022`) and your game port range
  reachable from everywhere.
- Docker, as Pelican's Wings guide installs it. Turning on Docker's `live-restore` keeps game
  servers running while Docker itself restarts.

## Create the node

1. Install Wings as in [Pelican's guide](https://pelican.dev/docs/wings/install).
2. In Admin › Nodes, create the node with its FQDN, memory, disk and the ports above. **Don't give
   it its deployment tag yet**, so nothing is placed on it before it works.
3. Copy the node's configuration to `/etc/pelican/config.yml` on the node and start Wings:
   `systemctl enable --now wings`.
4. Check that the node shows a green heart in Admin › Nodes.
5. Tag it (next section). From then on new servers can land on it.

## Allocations

You don't create allocations by hand. For each new server the servers plugin takes two
consecutive free ports (the game port and the one after it) from the deployment port range
(`UCS_DEPLOYMENT_PORTS`), creating them if needed, on **`0.0.0.0`** with the node's FQDN as the
allocation's alias. Wings binds every interface, and the address a player sees and dials is the
alias, so servers keep working when a node changes IP address. Anything that needs a routable IP
(a subdomain record, for example) resolves the alias.

Open the whole deployment port range in the node's firewall.

## Tags

The servers plugin reads Pelican's node tags to decide where servers go:

| Tag | Meaning |
|---|---|
| a deployment tag (`UCS_DEPLOYMENT_TAGS`) | new servers may be placed here. Remove it to stop new servers on a node without touching the running ones. |
| a two-letter country code (`fr`, `nl`, `us` …) | the node's **location**: users pick a country when they create a server, and each code becomes one location with its flag. |
| `plus` (`UCS_PLUS_TAG`), `premium` (`UCS_PREMIUM_TAG`) | a paid location tier. |
| `limbo` (`LIMBO_NODE_TAG`) | where [limbo](/plugins/limbo/) parks hibernated servers. Usually the storage box's own Wings node. |

The full rules, including how a node is paused when it is busy (memory or CPU above the start
queue's line, `START_QUEUE_THRESHOLD_PERCENT`, 85 % by default and 10 points lower on small nodes), are on
the [Servers](/plugins/servers/) page.

## Telemetry

Core probes every node's Wings once a minute (`plugged-host:sample-nodes`): reachability, latency
and load. The servers plugin uses it for balancing and deployment pauses, storage for failover,
and the status page for the node list. A node that stops answering shows up there first.

## On the node

| Piece | Guide |
|---|---|
| Abuse agent (process and connection reports, every minute) | [Abuse agent](/nodes/abuse-agent/) |
| Storage mirror key (lets the storage box copy server files) | [Storage box](/storage/storage-box/#authorize-the-mirror-key-on-every-node) |
| Devbox mounts (`allowed_mounts`) | [Devboxes](/nodes/devboxes/) |
| FiveM image | [FiveM image](/nodes/fivem-image/) |

## SSH

The storage box copies server files from the nodes over SSH as root, with a key it installs
itself. If your nodes' SSH isn't on port 22, tell the storage installer (it asks). Keep SSH
key-only on nodes: they run other people's code.
