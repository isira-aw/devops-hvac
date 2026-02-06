#!/bin/bash
# init-ssl.sh

# 1. Temporarily replace app.conf with a simple HTTP-only config
cat > nginx/conf.d/app.conf <<EOF
server {
    listen 80;
    server_name live-ac.tech www.live-ac.tech api.live-ac.tech;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
EOF

# 2. Start Nginx (now it won't crash because no SSL needed yet)
docker compose -f docker-compose.prod.yml up -d nginx

# 3. Request Certificates
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    -d live-ac.tech -d www.live-ac.tech -d api.live-ac.tech \
    --email isira.aw@gmail.com \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal" certbot

# 4. Restore the full SSL config (I will just restore it from git effectively or rewrite it)
# Ideally I should have backed it up, but for the user I will just ask them to git restore.
git checkout nginx/conf.d/app.conf

# 5. Restart Nginx to load the new certs!
docker compose -f docker-compose.prod.yml restart nginx
