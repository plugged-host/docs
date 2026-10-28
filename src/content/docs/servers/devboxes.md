---
title: Devboxes
description: VS Code devboxes next to game servers, what users get, the devbox egg and image, preparing nodes, the optional browser edge and its certificates, and the settings.
---

A devbox is a small Linux box next to a game server, with the game server's files at `/server`.
Users open it in VS Code over SSH (the Remote - SSH extension) or, when the browser edge is set
up, as VS Code in the browser. Inside, the `ph` command shows the game server's state and console
and sends power actions. Users find it on the server's **VS Code** page. Admins import the
devbox egg, prepare the nodes, switch devboxes on and, optionally, set up the edge for the browser
version.

## What it does

### What a devbox is

- An ordinary server of the devbox egg that the panel creates, starts, stops and deletes itself.
  It is owned by a suspended system account the panel makes on first use (its email is the user
  `devboxes` at the reserved domain `system.invalid`), so it never shows in anyone's server list
  and nobody opens its own pages.
- It runs on the game server's node, on a free allocation of that node (its SSH port; made inside
  the deployment port ranges when missing, see [allocations](/nodes/allocations/)), with the
  resources from the settings on top of the game server's.
- Its own volume is its home, `/home/container` (VS Code's server, extensions, shell history,
  caches). The game server's volume is mounted at `/server`.
- The image is Debian with git, Python, Node.js, a Java 21 JDK, build tools and code-server.
- `ph` inside it: `ph status`, `ph logs [-n 100]`, `ph logs -f`, `ph cmd "say hi"`, `ph console`
  and `ph start | stop | restart | kill`. What it may do follows the person's permissions on the
  game server, or in a shared devbox what the owner allowed. Starts go through the
  [start gates](/starts/start-gates/) like the Start button.

### Who gets one

- **The owner**, and **subusers** holding `devbox.connect` plus `files.sftp`, `files.read`,
  `files.read-content`, `files.create`, `files.update` and `files.delete`. A devbox can read and
  change every file anyway, so a subuser without those gets none. Only the subuser's own permissions
  count, never an admin's or a role's.
- With **Members Only** (the default), the person needs a membership (see
  [credits and tokens](/economy/credits-and-tokens/)). The second membership gets the second set of
  resources.
- Devboxes are offered only while they are switched on, an egg is chosen and
  [abuse protection](/safety/abuse/) is not off. Without abuse protection a devbox would be a free
  shell nobody checks.

**Personal or shared.** By default everyone has their own devbox on a server. The owner may switch
on **Shared** instead: one devbox for the owner and every subuser who may have one, paid by the
owner's membership. Its **Rights** say what `ph` in it may do on the game server: see its state and
resources, read the console, send console commands, start, stop and restart it. Switching sharing
on deletes everyone's personal devbox on that server; switching it off deletes the shared one with
its home.

### Signing in

- **SSH**: the page shows the SSH command (`ssh -p <port> <user>@<host>`) and a **connect code**
  (`xxxx-xxxx-xxxx-xxxx`), each with a copy button. The code is the SSH password: one per person
  per start, shown only behind the panel's sign-in, gone at the next stop. Account passwords are
  never accepted. SSH keys from Account › SSH Keys work too.
- **Open in VS Code**: a link for the Remote - SSH extension that opens `/server`. The host key is
  shown under the SSH command, to compare on the first connection.
- **Open in browser**: when the browser edge is set up (below).

### Lifecycle

| Action | What happens |
|---|---|
| Start | The devbox and its server are made on the first start. Each start makes a new token and connect codes, points the devbox's DNS record (browser version) and starts it. The first start on a node shows **Creating…** while the node downloads the image. |
| Running | `ph` reports back to the panel, then sends a heartbeat every minute with its open sessions. |
| Stop | Ends every code and session at once and stops it; after 60 seconds it is killed. |
| Delete | A devbox nobody used for **Cleanup** days, one whose game server is gone or moved to another node, and the personal ones of people who lost access, are deleted with their server and home. |

The `reconcile_devboxes` task also stops a devbox that:

- had no open connection for **Idle Stop** minutes, or ran for **Longest Run** hours;
- never reported back within 10 minutes of its start;
- whose game server is suspended or out of disk, or that is suspended itself;
- whose payer lost their membership or got an abuse block;
- Wings shows as stopped for more than 3 minutes after it booted.

A shared devbox restarts when someone who could sign in at its start lost access, so their codes and
keys stop working. Devbox containers that run on a node without a devbox that may run are killed.
When devboxes are switched off, or abuse protection is, running devboxes are stopped.

**Limits.** A person may have **Running per Person** devboxes running at once (their own and the
shared ones on servers they own). A node takes no new devbox while its deployment is paused, while
it is over 90 % memory, CPU or disk in [node telemetry](/nodes/telemetry/), or while it is
unreachable.

### Abuse

Devbox servers are scanned like every other server ([abuse protection](/safety/abuse/)). A
critical finding on a devbox stops every running devbox of the person who pays for it and blocks
them from devboxes until an admin dismisses or resolves the finding. The devbox's server is kept,
stopped, while the finding is open, since its evidence is on it.

### Kept out of other features

A devbox server has no system backups, is never parked by [limbo](/starts/limbo/), never failed
over, never moved and never cut by [allowance cuts](/servers/allowance-cuts/). When its game server
moves to another node, the devbox is deleted and a new one is made there at its next start.

### VS Code in the browser

Optional. Each devbox then answers at `https://<slug>.<browser domain>`, the slug being 16 random
lowercase letters and digits. An nginx server, **the edge**, asks the panel on every request whether
the browser's devbox cookie belongs to that host, devbox and person, then proxies to the devbox's
node and port over TLS with a client certificate:

- Inside the devbox, `ph` serves code-server (Coder's MIT build of VS Code) only to the edge's client
  certificate, with a certificate for its own host name that the panel issues at every start from
  its devbox CA (valid 30 days).
- nginx checks each devbox's certificate against that CA.
- The panel creates one proxied Cloudflare A record per devbox, pointing at the edge, with the
  comment `devbox record (managed by the panel)`, and removes it with the devbox. Records it did not
  make are never touched.

**Open in browser** asks the panel for a one-time ticket (one minute) that the edge turns into a
cookie for that host alone, valid 12 hours. Without a valid cookie, the edge sends the browser
through the panel's sign-in for a fresh link.

## Requirements

- **The devbox egg** (see [Eggs](/nodes/eggs/)) and **the devbox image**, pullable on every node.
- **Abuse protection** not off: Admin › Settings › Security › Abuse › Mode is Suspend or Report only.
- **Memberships**, while **Members Only** is on: Admin › Settings › Economy › Memberships. With
  memberships off and Members Only on, nobody gets a devbox.
- **On each node**: Wings' data directory in `allowed_mounts`, a spare allocation per devbox, and a
  firewall that keeps containers away from the node and private networks (below). This works with
  stock wings-rs and the fork alike.
- **The panel reachable from the node's containers** at its URL, or at **Panel URL for Devboxes**.
- **For the browser version**: a domain of its own on Cloudflare, a Cloudflare API token with
  Zone › DNS › Edit on that zone (or the [subdomains](/servers/subdomains/) token, when it covers
  that zone), and an nginx box with a public IPv4 address for the edge.

## Setup

### 1. The egg and the image

Import `devbox.json` from the panel repository's
[eggs](https://github.com/plugged-host/panel/tree/main/docs/eggs) into any nest (see
[Eggs](/nodes/eggs/)). Never create servers from it by hand, and do not add it to the games catalog.

The image is built from `docker/devbox` in the panel repository by its GitHub workflow
`devbox-image.yml`, as `ghcr.io/<owner>/<repository>-devbox` with the tags `latest` and
`sha-<commit>`. The egg names `ghcr.io/plugged-host/panel-devbox:latest`; a fork publishes under its
own name. The package must be public, or every node needs a registry login. Pin a digest in the
settings, and pull it on each node ahead of the first start:

```bash
docker pull ghcr.io/<owner>/<repository>-devbox@sha256:<digest>
```

### 2. Each node

**Allow the mount.** Wings takes `allowed_mounts` from its own configuration, never from the panel.
Add its data directory (`system.data`, by default `/var/lib/calagopus-wings/volumes`) to the node's
Wings `config.yml` and restart Wings. Running game servers keep running.

```yaml
allowed_mounts:
  - /var/lib/calagopus-wings/volumes
```

A node without it refuses new devboxes ("the node isn't ready for devboxes"), and a devbox that
started without its files shows "Can't reach the server's files".

:::danger
This line lets Wings mount any server's files into a container. It is safe here because this panel
sends Wings no mount except a devbox's mount of its own game server's volume. Never add it on a node
that something else can send mounts to.
:::

**The node firewall.** A devbox is a full shell on the node's container network. Keep it, and every
game container, away from the node itself, the cloud metadata service and private networks, and
from sending mail. Put the rules in an nftables table of their own that loads before Docker, never
in `/etc/nftables.conf`, whose `flush ruleset` wipes Docker's rules. Take the bridge and subnets from
`docker.network` in the Wings configuration (the defaults are shown), the game port range from
Admin › Nodes, and the Wings API port (`ph logs` and `ph console` reach Wings' websocket at the
node's address):

```bash
sudo install -d /etc/nftables.d
sudo tee /etc/nftables.d/node-guard.nft >/dev/null <<'EOF'
#!/usr/sbin/nft -f
define WINGS_BRIDGE = "calagopus_nw"
define WINGS_V4 = 172.18.0.0/16
define WINGS_V6 = fdba:17c8:6c94::/64
define GAME_PORTS = { <FIRST_PORT>-<LAST_PORT> }
define WINGS_API_PORT = 8080

table inet node_guard
delete table inet node_guard

table inet node_guard {
    chain forward {
        type filter hook forward priority -10; policy accept;
        iifname != $WINGS_BRIDGE return
        ct state established,related return
        ip daddr $WINGS_V4 return
        ip6 daddr $WINGS_V6 return
        ip daddr { 10.0.0.0/8, 100.64.0.0/10, 169.254.0.0/16, 172.16.0.0/12, 192.168.0.0/16 } counter drop
        ip6 daddr { fc00::/7, fe80::/10 } counter drop
        tcp dport 25 counter drop
    }

    chain input {
        type filter hook input priority -10; policy accept;
        iifname != $WINGS_BRIDGE return
        ct state established,related return
        meta l4proto { icmp, ipv6-icmp } return
        tcp dport $GAME_PORTS return
        udp dport $GAME_PORTS return
        tcp dport $WINGS_API_PORT return
        counter drop
    }
}
EOF
sudo nft -c -f /etc/nftables.d/node-guard.nft
```

Load it at boot with a oneshot unit that runs before Docker:

```ini
# /etc/systemd/system/node-guard.service
[Unit]
Description=Firewall for game and devbox containers
Before=docker.service

[Service]
Type=oneshot
ExecStart=/usr/sbin/nft -f /etc/nftables.d/node-guard.nft
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now node-guard.service
```

Add `return` lines for what containers must reach on the host or a private network: a database host
on the node, a resolver on the host, or a panel reached at a private address.

**Spare allocations.** Each devbox takes one free allocation of its node, open to the internet like
the game ports.

**Check the node.** Start a devbox on a server of that node (the server's **VS Code** page, **Start
devbox**) and connect with the SSH command and the connect code. `ls /server` lists the game
server's files and `ph status` shows the game server. `curl -sm5 https://example.com` works, while
`curl -sm5 http://169.254.169.254/` and the node's SSH port at the bridge gateway fail.

### 3. Switch it on

In Admin › Settings › Hosting › Devboxes choose the **Devbox Egg**, pin the **Image**, check the
resources and the lifecycle, then turn **Devboxes** on and save.

### 4. VS Code in the browser (optional)

The browser domain must be a domain of its own: never the panel's registrable domain, nor a name
under or above it, which the panel's cookies could reach. The panel refuses one that is. This example
uses `example.net` next to a panel at `panel.example.com`.

1. Put `example.net` on Cloudflare as a zone of its own. Create an origin certificate for
   `*.example.net` and save it on the edge box. Set SSL to Full (strict).
2. In Admin › Settings › Hosting › Devboxes set **Browser Domain** (`example.net`), **Edge Address**
   (the edge's public IPv4) and, unless the subdomains token covers that zone, a **Cloudflare API
   Token** with Zone › DNS › Edit on it. Save, then click **Create Certificates**.
3. Write the certificates for nginx. Run this where the panel runs, with the panel's environment
   (from the directory holding its `.env`):

   ```bash
   panel-rs devboxes edge-certificates --dir /etc/nginx/devbox
   ```

   It writes `ca.crt`, `edge.crt` and `edge.key` (mode 0600). When the edge is another machine,
   copy the three files there and keep `edge.key` private.
4. Add this nginx site on the edge and reload nginx. Running devboxes get their certificate and DNS
   record at their next start.

```nginx
proxy_cache_path /var/cache/nginx/devbox-auth levels=1 keys_zone=devbox_auth:2m max_size=20m inactive=5m use_temp_path=off;

map $http_upgrade $devbox_connection {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name "~^[a-z0-9]{16}\.example\.net$";
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name "~^[a-z0-9]{16}\.example\.net$";

    ssl_certificate     /etc/ssl/example.net/fullchain.pem;
    ssl_certificate_key /etc/ssl/example.net/privkey.pem;
    client_max_body_size 256m;

    # node host names come from the panel per request
    resolver 1.1.1.1 8.8.8.8 ipv6=off valid=300s;
    resolver_timeout 5s;

    # The panel's answer for this host and cookie, cached 30 s. nginx can't name a cookie with a
    # hyphen ($cookie___Host-devbox would end at the hyphen), so the key is the whole header.
    location = /_devbox/auth {
        internal;
        proxy_pass https://panel.example.com/api/devbox/web/authorize;
        proxy_ssl_server_name on;
        proxy_set_header X-Devbox-Host $host;
        proxy_set_header Cookie $http_cookie;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_cache devbox_auth;
        proxy_cache_key "$host|$http_cookie";
        proxy_cache_valid 204 30s;
        proxy_cache_valid any 0;
    }

    # the one-time ticket becomes the devbox cookie, on this host
    location = /_devbox/login {
        proxy_pass https://panel.example.com/api/devbox/web/login$is_args$args;
        proxy_ssl_server_name on;
        proxy_set_header X-Devbox-Host $host;
        proxy_set_header Cookie "";
    }

    # no valid cookie: through the panel's sign-in for a fresh link
    location @devbox_reopen {
        return 302 https://panel.example.com/account/devbox/open?host=$host;
    }

    location / {
        auth_request /_devbox/auth;
        auth_request_set $devbox_upstream $upstream_http_x_devbox_upstream;
        error_page 401 = @devbox_reopen;

        proxy_pass https://$devbox_upstream;
        proxy_ssl_certificate         /etc/nginx/devbox/edge.crt;
        proxy_ssl_certificate_key     /etc/nginx/devbox/edge.key;
        proxy_ssl_trusted_certificate /etc/nginx/devbox/ca.crt;
        proxy_ssl_verify on;
        proxy_ssl_verify_depth 2;
        proxy_ssl_server_name on;
        proxy_ssl_name $host;
        proxy_ssl_session_reuse on;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $devbox_connection;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 1d;
        proxy_send_timeout 1d;
    }
}
```

When the edge runs on the panel's machine, the two panel locations can go to the panel directly:
`proxy_pass http://127.0.0.1:<port>/api/devbox/web/…` with `proxy_set_header Host panel.example.com`.

## Settings

### Admin › Settings › Hosting › Devboxes

| Setting | Default | What it does |
|---|---|---|
| Devboxes | off | Servers get a VS Code page. Needs abuse protection on and the devbox egg. |
| Devbox Egg | none | The egg devbox servers are made from. |
| Image | empty | The image devboxes run. Empty uses the egg's first image. A digest (`…@sha256:…`) pins one build. Running devboxes pick a change up at their next start. |
| Members Only | on | Only members get a devbox. Off: everyone. |

### Resources

On top of the game server's resources. CPU is in percent (100 is one thread), memory and disk in MiB.

| Setting | Default | What it does |
|---|---|---|
| CPU | 200 | CPU of a devbox (25 to 3200). |
| Memory | 2048 | Memory of a devbox (256 to 65536). |
| Disk | 5120 | Disk of a devbox (512 to 262144). |
| CPU (Second Membership) | 400 | For a devbox paid by someone with the second membership. |
| Memory (Second Membership) | 4096 | The same, memory. |
| Disk (Second Membership) | 10240 | The same, disk. |

### Lifecycle

| Setting | Default | What it does |
|---|---|---|
| Idle Stop | 15 | Minutes without a connection before a devbox stops (1 to 1440). |
| Longest Run | 12 | Hours after its start a devbox stops, connected or not (1 to 168). |
| Running per Person | 2 | Devboxes one person may have running at once: their own and the shared ones on servers they own (1 to 20). |
| Cleanup | 14 | Days without use after which a stopped devbox is deleted with its home (1 to 365). |
| Panel URL for Devboxes | empty | Where devboxes reach the panel. Empty: the panel's URL from Admin › Settings › Application. |

### VS Code in the Browser

| Setting | Default | What it does |
|---|---|---|
| Browser Domain | empty | Each devbox answers at `https://<name>.<this domain>` through the edge. A domain of its own, never the panel's. Empty switches the browser version off. |
| Edge Address | empty | The edge's public IPv4. Each devbox gets a proxied DNS record pointing at it. |
| Cloudflare API Token | empty | Needs Zone › DNS › Edit on the browser domain. Empty uses the subdomains token. Stored encrypted. |

### Certificates

**Create Certificates** makes the devbox CA and the edge's client certificate (both valid 10
years); their keys are stored encrypted and never sent to the browser. Once they exist the button
reads **Replace Certificates**. The browser version needs both a Browser Domain and the
certificates.

## Permissions

| Permission | Allows |
|---|---|
| `devbox.connect` | A devbox on this server. The subuser also needs `files.sftp`, `files.read`, `files.read-content`, `files.create`, `files.update` and `files.delete`. |

Inside a personal devbox, `ph` can start, restart and stop the game server with the person's
`control.start`, `control.restart` and `control.stop`, and read or use the console with
`control.read-console` and `control.console`. In a shared devbox the owner's **Rights** decide
instead. Power actions from `ph` are logged on the game server.

## Background tasks

| Task | Runs | What it does |
|---|---|---|
| `reconcile_devboxes` | Every minute | Stops idle, over-time and orphaned devboxes, deletes unused or moved ones, restarts shared ones whose people changed, and kills stray devbox containers. |

## Notes

- After **Replace Certificates**, run `panel-rs devboxes edge-certificates` again, reload nginx and
  restart running devboxes; until then the edge and the devboxes do not trust each other.
- The connect code changes at every start. A person's SSH keys from Account › SSH Keys keep working
  across starts.
- Turning **Members Only** off gives every owner and qualifying subuser a devbox. People without a
  membership get the first set of resources; the second membership still gets the second set.
- A devbox's home is deleted with it: after **Cleanup** days unused, when sharing is switched on or
  off, and when its game server moves to another node. Files in `/server` belong to the game server
  and stay.
