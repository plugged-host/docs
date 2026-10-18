---
title: Devboxes on nodes
description: Prepare nodes for plugged-host-devbox (Wings allowed_mounts, the node firewall, the devbox image), switch devboxes on, and set up VS Code in the browser.
---

A devbox from [plugged-host-devbox](/plugins/devbox/) is a hidden Pelican server that Wings runs
next to a game server, with the game server's volume mounted at `/server`. Wings only makes
mounts it is allowed to, so every node that should run devboxes needs one change to its Wings
config. This guide covers that change, the node firewall, the image, switching devboxes on, and
the optional browser version.

Do the nodes one at a time and check each before the next.

## Before you start

- [plugged-host-core](/plugins/core/) is enabled. Its mount guard is what makes the Wings change
  below safe.
- [plugged-host-abuse](/plugins/abuse/) is enabled with `ABUSE_MODE=suspend`, and its
  [node agent](/nodes/abuse-agent/) reports from every node that will run devboxes. Devboxes
  stay off without the abuse plugin.
- [plugged-host-economy](/plugins/economy/) is enabled, so people can have Plus.
- The scheduler runs (see [Queue and scheduler](/panel/queue-and-scheduler/)). It stops idle
  devboxes every minute.

:::danger
Never add the volumes directory to Wings' `allowed_mounts` on a node whose panel does not run
plugged-host-core. Wings only checks that a mount's source starts with an allowed path, so any
Mount pointing into another server's volume would pass. Core's guard drops every mount into a
volume directory from the configuration it sends to Wings, and refuses such mounts when they are
saved, except a devbox's mount of its own game server's volume.
:::

## 1. Set up the panel side

1. Enable plugged-host-devbox in Admin › Plugins (see [Plugins](/panel/plugins/)).
2. Run its two migrations, then create the devbox egg and the system account that owns every
   devbox server:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan migrate --force
   sudo -u www-data php artisan plugged-host:devbox-setup
   ```

   Run it again after an update and after changing the image. Do not delete the `ph-devbox`
   account it creates.
3. Pin the image. By default devboxes run `ghcr.io/plugged-host/devbox:<release>` (for example
   `2.2.0`), a tag that moves with every build. Look up the digest of the build you tested and set
   it as the image in Admin › Plugins › plugged.host Devbox › Settings (`DEVBOX_IMAGE`):

   ```bash
   docker pull ghcr.io/plugged-host/devbox:2.2.0
   docker inspect --format '{{index .RepoDigests 0}}' ghcr.io/plugged-host/devbox:2.2.0
   # ghcr.io/plugged-host/devbox@sha256:<digest>
   ```

   The image workflow also prints the digest of every build in its job summary.

To build the image yourself, from the plugins repository's `plugged-host-devbox` folder (the
build runs `ph`'s tests and fails when one fails):

```bash
cd plugged-host-devbox
docker build -f image/Dockerfile --build-arg PH_VERSION=2.2.0 -t registry.example.com/devbox:2.2.0 .
docker push registry.example.com/devbox:2.2.0
```

Then set `DEVBOX_IMAGE` to it, or build it on every node and set `~registry.example.com/devbox:2.2.0`
(the leading `~` tells Wings to use the local image and never pull). The repository's
`devbox image` workflow (`.github/workflows/devbox-image.yml`) does the same on GitHub; in a fork,
make the package public or give Wings credentials for the registry, because nodes pull it.

## 2. Prepare each node

### Allow the volume mount

Wings takes `allowed_mounts` from its own `config.yml`, never from the panel. Add the Wings data
directory, the `system.data` path in `/etc/pelican/config.yml` (Wings' default is
`/var/lib/pelican/volumes`). It must be the same path as the node's Daemon Base Directory in
Admin › Nodes, which the panel uses to build each devbox's mount.

```bash
sudo cp /etc/pelican/config.yml /etc/pelican/config.yml.bak
sudo grep -n -A3 '^allowed_mounts' /etc/pelican/config.yml
```

Edit the top-level `allowed_mounts` key so it lists the data directory (replace an empty
`allowed_mounts: []`, keep any paths already there):

```yaml
allowed_mounts:
  - /var/lib/pelican/volumes
```

Then restart Wings. Running game servers keep running; Wings picks them up again.

```bash
sudo systemctl restart wings
sudo systemctl status wings --no-pager
```

When a node lacks this, Wings silently skips the mount, the devbox reports that `/server` is
missing, the card says "Can't reach the server's files", and the doctor names the node with the
directory to add (its Daemon Base Directory).

### Add the node firewall

A devbox is a full Linux shell on the node's container network. Keep it, and every game
container, away from the node itself, the cloud metadata service and private networks, and stop
it from sending mail directly. The table below does that. It is its own nftables table, runs
before Docker's rules, and Docker never touches it. It is worth having on every node, devboxes or
not.

:::caution
Do not put these rules in `/etc/nftables.conf` with `nftables.service`. Debian's file starts with
`flush ruleset`, which wipes Docker's rules whenever it is reloaded. Use the separate unit below.
:::

Read the bridge name and subnets from `docker.network` in the node's `/etc/pelican/config.yml`
(Wings' defaults are shown), the node's allocation port range or ranges from Admin › Nodes › the
node › Allocations, and its Wings port from Admin › Nodes › the node: the **Port**, or the
**Connection Port** when the node lists a Connection and a Listening Port (the port `ph`'s
websocket reaches Wings on):

```bash
sudo install -d /etc/nftables.d
sudo tee /etc/nftables.d/ph-node-guard.nft >/dev/null <<'EOF'
#!/usr/sbin/nft -f
# Node guard: what containers on the Wings bridge may reach.

define WINGS_BRIDGE = "pelican0"             # Wings' bridge interface
define WINGS_V4 = 172.18.0.0/16              # docker.network.interfaces.v4.subnet
define WINGS_V6 = fdba:17c8:6c94::/64        # docker.network.interfaces.v6.subnet
define GAME_PORTS = { <FIRST_PORT>-<LAST_PORT> }   # the node's allocation range(s)
define WINGS_API_PORT = 8080                 # the node's (Connection) Port in the panel

table inet ph_node_guard
delete table inet ph_node_guard

table inet ph_node_guard {
    # Containers to elsewhere: the internet yes; private ranges, link-local (the cloud
    # metadata service at 169.254.169.254) and SMTP no. Containers on the bridge keep
    # reaching each other, and replies to connections from outside always pass.
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

    # Containers to this host (the bridge's gateway or any of its addresses): only the game
    # ports (servers on a 127.0.0.1 allocation are reached at the gateway), Wings' API and
    # ICMP. Nothing else: not SSH, Wings' SFTP, a database, Redis or metrics.
    # Wings' API: a devbox's ph logs, ph cmd and ph console open Wings' websocket at the node's
    # address, which is this host. It is open to the internet anyway, and needs a token.
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

sudo tee /etc/systemd/system/ph-node-guard.service >/dev/null <<'EOF'
[Unit]
Description=Node guard (nftables rules for the Wings bridge)
After=network-pre.target
Before=docker.service wings.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/sbin/nft -f /etc/nftables.d/ph-node-guard.nft
ExecReload=/usr/sbin/nft -f /etc/nftables.d/ph-node-guard.nft
ExecStop=/usr/sbin/nft delete table inet ph_node_guard

[Install]
WantedBy=multi-user.target
EOF

sudo nft -c -f /etc/nftables.d/ph-node-guard.nft   # syntax check, changes nothing
sudo systemctl daemon-reload
sudo systemctl enable --now ph-node-guard.service
sudo nft list table inet ph_node_guard
```

Add exceptions before loading the table where a node needs them:

- **The node is also a database host** (Admin › Database Hosts lists a host at this node's
  address): its own servers must reach that port, or every server database on the node stops
  working. Add `tcp dport 3306 return` (the host's port) to `input` before the drop. Check Admin
  › Database Hosts for every node before you load the table.
- **`docker.network.dns` points at a resolver on the host**: add `udp dport 53 return` and
  `tcp dport 53 return` to `input`.
- **Something containers need sits in a private network** (a database in your provider's private
  network, or a panel that devboxes reach at a private address through `DEVBOX_PANEL_URL`): add a
  `return` for that address before the `drop` in `forward`.

The `tcp dport $WINGS_API_PORT return` line is there for devboxes: `ph logs`, `ph cmd` and
`ph console` read the game server's console straight from Wings' API at the node's address. On a
node that never runs devboxes you can leave it out; `ph status` and the power commands go through
the panel and do not need it.

Servers whose egg forces an outgoing IP run on Wings' per-address Docker networks, not on the
Wings bridge, and are not covered. The devbox egg never does that.

To undo it: `sudo systemctl disable --now ph-node-guard.service`.

### Pre-pull the image

The first devbox on a node pulls the image, which takes a few minutes and shows as "Creating…"
on the card. Pull it ahead, with the image from your settings:

```bash
docker pull ghcr.io/plugged-host/devbox@sha256:<digest>
```

### Keep spare allocations

Each devbox takes one free allocation of its node as its port. People connect to the node's FQDN
on that port (SSH), and the browser edge connects to the same port over TLS. Keep spare
allocations on devbox nodes, and keep the allocation range open to the internet in the node's
own firewall, as it already is for game servers.

## 3. Switch devboxes on

1. Admin › Plugins › plugged.host Devbox › Settings › **Devboxes on**. Check the resources per
   tier and the lifecycle values while you are there (see [Devbox › Settings](/plugins/devbox/#settings)).
2. Run the doctor until it is clean:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan plugged-host:doctor plugged-host-devbox
   ```

   It checks the egg and system account, that the image is pinned, that the reconcile ran in the
   last three minutes, and that no devbox reported a missing `/server`.

## 4. Check a node

1. As a user with Plus, open a server you own on that node › Settings › **VS Code** › **Start
   devbox**. The card goes through "Creating…" and "Starting…" to "Running".
2. Copy the SSH command and sign in with the connect code. `ls /server` shows the game server's
   files and `ph status` shows the game server.
3. From the devbox terminal, check the firewall:

   ```bash
   curl -sm5 https://example.com >/dev/null && echo ok      # works
   curl -sm5 http://169.254.169.254/                         # times out
   timeout 5 bash -c '</dev/tcp/172.18.0.1/<SSH_PORT>'       # fails (the node's SSH, at the gateway)
   ```

   The same for Wings' SFTP port fails. `ph logs -n 5` prints the game server's last console
   lines (Wings' API passes), and a game server on the node is still reachable from outside.
   `sudo nft list table inet ph_node_guard` on the node shows the counters going up.
4. Stop the devbox from the card. It shows "Stopping…" until Wings confirms it.

## VS Code in the browser

Optional. Each devbox then answers at `https://<slug>.<devbox domain>`, where `<slug>` is 16
random lowercase letters and digits. An nginx server on the panel box (the edge) asks the panel on
every request whether the browser's devbox cookie still belongs to that host, devbox and person,
then proxies to the devbox's node and port over TLS with a client certificate. `ph` serves its web
side to that certificate only, and nginx checks each devbox's own certificate against the
panel's private devbox CA. The examples use `example.net` as the devbox domain and
`panel.example.com` as the panel.

What you need:

- **A domain of its own, as a whole zone on Cloudflare** (`example.net` here). The panel creates a
  proxied A record per devbox through Cloudflare's API, and Cloudflare's free edge certificate
  covers only one level (`*.example.net`), so use the zone itself, not a subdomain of it.
- **Never a domain your panel's session cookie reaches.** Anything a devbox serves would receive
  that cookie. The panel refuses its own registrable domain (from `APP_URL`: `example.com` for
  `panel.example.com`), `SESSION_DOMAIN` when it is set, and any name under or above either, in
  the settings and in `plugged-host:devbox-web-setup`.
- **A Cloudflare API token** with Zone › DNS › Edit on that zone. When the subdomains plugin is
  enabled, the panel uses that plugin's token instead, so give that token access to this zone too.
- **The panel box's public IPv4**, which every devbox record points at.

Steps:

1. Add the domain to Cloudflare. Create an origin certificate for `*.example.net` (SSL/TLS ›
   Origin Server) and save it on the panel box as `/etc/ssl/example.net/fullchain.pem` and
   `/etc/ssl/example.net/privkey.pem`. Set the zone's SSL mode to Full (strict).
2. In Admin › Plugins › plugged.host Devbox › Settings › **In the browser**, set the domain, the
   edge IPv4 and, without the subdomains plugin, the Cloudflare token.
3. Create the devbox CA and the edge's client certificate, and the records of running devboxes:

   ```bash
   cd /var/www/pelican
   sudo -u www-data php artisan plugged-host:devbox-web-setup
   ```

   It prints the three certificate paths nginx needs, by default under
   `/var/www/pelican/storage/app/private/plugged-host-devbox` (`DEVBOX_PKI_PATH`). nginx reads them
   as root; the CA key never leaves that folder.
4. Add the nginx site below as `/etc/nginx/sites-available/devbox-web.conf`, link it into
   `sites-enabled`, then `sudo nginx -t && sudo systemctl reload nginx`.
5. Running devboxes get their web certificate at their next start. New ones get their DNS record
   when they start and lose it when they are deleted. There is no wildcard record.

Replace `example.net`, `panel.example.com`, the certificate paths and `/var/www/pelican`:

```nginx
# VS Code in the browser for devboxes: https://<slug>.example.net, on the panel box.
# Never under a domain the panel's session cookie covers.

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
    server_name "~^(?<devbox_slug>[a-z0-9]{16})\.example\.net$";

    access_log /var/log/nginx/devbox-web-access.log;
    error_log  /var/log/nginx/devbox-web-error.log error;

    ssl_certificate     /etc/ssl/example.net/fullchain.pem;
    ssl_certificate_key /etc/ssl/example.net/privkey.pem;
    # Use the same ssl_protocols and ssl_ciphers as your panel's site on this port: they share
    # the listening socket and its session cache, and Cloudflare reuses sessions across them.
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 256m;

    # Node host names come from the panel per request, so nginx needs a resolver.
    resolver 1.1.1.1 8.8.8.8 ipv6=off valid=300s;
    resolver_timeout 5s;

    # The panel's answer for this host and cookie, cached 30 s so one page load does not ask
    # hundreds of times. Calls the panel's own site on this box; never forwards the body.
    location = /_ph/auth {
        internal;
        proxy_pass https://127.0.0.1/plugged-host/devbox/web/authorize;
        proxy_ssl_server_name on;
        proxy_ssl_name panel.example.com;
        proxy_set_header Host panel.example.com;
        proxy_set_header X-Devbox-Host $host;
        proxy_set_header Cookie $http_cookie;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_cache devbox_auth;
        proxy_cache_key "$host|$cookie___Host-ph_devbox";
        proxy_cache_valid 204 30s;
        proxy_cache_valid any 0;
    }

    # The one-time ticket from the panel becomes the devbox cookie, on this host.
    location = /_ph/login {
        proxy_pass https://127.0.0.1/plugged-host/devbox/web/login$is_args$args;
        proxy_ssl_server_name on;
        proxy_ssl_name panel.example.com;
        proxy_set_header Host panel.example.com;
        proxy_set_header X-Devbox-Host $host;
        proxy_set_header Cookie "";
    }

    # No valid cookie: through the panel's sign-in for a fresh ticket.
    location @devbox_reopen {
        return 302 https://panel.example.com/plugged-host/devbox/web/open?host=$host;
    }

    location / {
        auth_request /_ph/auth;
        auth_request_set $devbox_upstream $upstream_http_x_devbox_upstream;
        error_page 401 = @devbox_reopen;

        proxy_pass https://$devbox_upstream;
        proxy_ssl_certificate         /var/www/pelican/storage/app/private/plugged-host-devbox/edge.crt;
        proxy_ssl_certificate_key     /var/www/pelican/storage/app/private/plugged-host-devbox/edge.key;
        proxy_ssl_trusted_certificate /var/www/pelican/storage/app/private/plugged-host-devbox/ca.crt;
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

The `/_ph/auth` and `/_ph/login` locations reach the panel through its own nginx site on the same
box (`https://127.0.0.1` with the panel's host name). If the panel's site listens elsewhere, change
those two `proxy_pass` lines.

To check: start a devbox, click **Open in browser** on its card. The browser goes to
`https://<slug>.example.net`, gets its cookie and opens VS Code with `/server`. A used-up or expired
link shows a short page that sends you back to the panel.

## Turning devboxes off

Switch **Devboxes on** off in the settings. "Open in VS Code" disappears, no new devbox starts,
and the reconcile stops the running ones within a minute. To take a node out of devboxes for good,
remove the data directory from `allowed_mounts` and restart Wings; keep the node firewall.
