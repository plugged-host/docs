---
title: Web server
description: nginx with TLS in front of the panel, with websockets, long requests and cached frontend assets.
---

The panel listens on the loopback address (`BIND=127.0.0.1`, `PORT=8000`) and nginx serves it to
the world over HTTPS. The panel needs nothing special from the proxy: pass every request through,
allow websocket upgrades and long-running requests, and tell the panel which proxies to trust.

## The site

`/etc/nginx/sites-available/panel.example.com.conf`:

```nginx
map $http_upgrade $panel_connection_upgrade {
    default upgrade;
    ''      '';
}

# Keep-alive connections to the panel instead of a new one per request.
upstream panel_backend {
    server 127.0.0.1:8000;
    keepalive 64;
    keepalive_timeout 60s;
}

# The frontend's assets have hashed names and never change: nginx keeps them on disk after the
# first request. The key includes Accept-Encoding because the panel serves gzip variants.
proxy_cache_path /var/cache/nginx/panel-assets levels=1:2 keys_zone=panel_assets:32m
                 max_size=1g inactive=30d use_temp_path=off;

server {
    listen 80;
    server_name panel.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name panel.example.com;

    ssl_certificate     /etc/letsencrypt/live/panel.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/panel.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:panel_ssl:10m;
    ssl_session_timeout 1d;

    # Uploads through the panel (eggs, world archives, files).
    client_max_body_size 100m;

    location /assets/ {
        proxy_pass http://panel_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        proxy_cache panel_assets;
        proxy_cache_key "$scheme$request_method$host$request_uri$http_accept_encoding";
        proxy_cache_valid 200 1y;
        proxy_cache_lock on;
        proxy_cache_use_stale error timeout updating;
    }

    location / {
        proxy_pass http://panel_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $panel_connection_upgrade;
        proxy_buffering on;
        proxy_request_buffering off;
        # Websockets and streamed answers (neo) stay open for a long time.
        proxy_read_timeout 1h;
        proxy_send_timeout 1h;
    }
}
```

```bash
sudo install -d -o www-data /var/cache/nginx/panel-assets
sudo ln -s /etc/nginx/sites-available/panel.example.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Get the certificate however you like (for example `certbot certonly --nginx -d panel.example.com`,
or a CDN's origin certificate).

## Real client addresses

The panel logs activity, rate-limits and checks sign-ins by the client's address. Behind nginx it
only sees `127.0.0.1` unless it trusts the proxy's `X-Forwarded-For`:

```bash
# /etc/calagopus/panel.env
APP_TRUSTED_PROXIES="127.0.0.1/32,::1/128"
```

Behind a CDN such as Cloudflare, add the CDN's published address ranges to the same list
(comma-separated CIDRs), or every visitor looks like the CDN. Restart the panel after changing it.

## A page while the panel restarts

During an [update](/panel/updating/) the panel is down for a few seconds and nginx answers 502.
To show a page that says so instead, add a static file of your own:

```nginx
    error_page 502 503 504 /maintenance.html;
    location = /maintenance.html {
        root /var/www/panel-maintenance;
        internal;
        add_header Cache-Control "no-store" always;
        add_header Retry-After "15" always;
    }
```

## Health check

`GET /up` answers `200 ok` while the panel reaches its database within 3 seconds and `503`
otherwise. Point load balancers and uptime monitors at it.

## Next

Go through [configuration](/panel/configuration/), then add your first [node](/nodes/wings/).
