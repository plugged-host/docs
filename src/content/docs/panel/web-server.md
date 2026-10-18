---
title: Web server
description: The nginx vhost for the panel, with the status export location and the upload and timeout limits the plugins need.
---

The panel is a normal Laravel app behind nginx and PHP-FPM. This vhost is Pelican's, with two
plugged.host additions: the `/data/` location for the [status export](/status/status-export/),
and longer timeouts for the plugins' slow requests (modpack uploads, archive downloads).

Save it as `/etc/nginx/sites-available/pelican.conf`, link it into `sites-enabled`, and replace
`panel.example.com`, the certificate paths and the PHP-FPM socket with yours.

```nginx
server {
    listen 80;
    server_name panel.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name panel.example.com;

    root /var/www/pelican/public;
    index index.php;

    access_log /var/log/nginx/pelican.app-access.log;
    error_log  /var/log/nginx/pelican.app-error.log error;

    client_max_body_size 100m;
    client_body_timeout 120s;
    sendfile off;

    ssl_certificate /etc/letsencrypt/live/panel.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/panel.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header X-Content-Type-Options nosniff;
    add_header X-Robots-Tag none;
    add_header Content-Security-Policy "frame-ancestors 'self'";
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy same-origin;

    # The status export (plugged-host-status, STATUS_EXPORT_PATH). The status Worker
    # and your website read it from here.
    location /data/ {
        alias /var/www/status-export/data/;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        default_type application/json;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 64k;
        fastcgi_buffers 16 32k;
        fastcgi_busy_buffers_size 128k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pelican.conf /etc/nginx/sites-enabled/pelican.conf
sudo nginx -t && sudo systemctl reload nginx
```

Leave the `/data/` block out if you don't run the status plugin. If you do, create the export
directory and give it to the panel user:

```bash
sudo mkdir -p /var/www/status-export/data
sudo chown -R www-data:www-data /var/www/status-export
```

## More host names

- **Backups portal** (`plugged-host-storage`): the panel itself, answering on its own name such
  as `backups.example.com`. Its vhost is on [Failover](/storage/failover/).
- **Devboxes in the browser** (`plugged-host-devbox`): see [Devboxes](/nodes/devboxes/).

## Behind Cloudflare

The panel works proxied through Cloudflare. Two things to know:

- Node names must stay **DNS only**. Browsers open the console websocket straight to Wings, and
  players connect to the node name.
- Cloudflare's bot protection can block API clients and AI agents that call the panel's
  `/api`. If you rely on API access, allow those paths in your Cloudflare security rules.
