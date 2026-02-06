# HVAC System - Server Deployment & CI/CD Setup

## Architecture

```
Internet
   │
   ├─ https://live-ac.tech        ──► Nginx (443) ──► Next.js (3000)
   ├─ https://www.live-ac.tech    ──► Nginx (443) ──► Next.js (3000)
   └─ https://api.live-ac.tech    ──► Nginx (443) ──► Spring Boot (8080)
                                                          │
                                                     PostgreSQL (5432)
```

All services run as Docker containers on the server, orchestrated by `docker-compose.yml`.

---

## 1. Server Prerequisites (One-Time Setup)

SSH into your server (`ssh root@64.227.144.94`) and run:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Install Certbot (for initial SSL certificate)
apt install -y certbot

# Install Git
apt install -y git

# Create project directory
mkdir -p /opt/hvac
```

### Add Swap Space (REQUIRED for 2GB RAM servers)

On low-memory servers, Docker builds will fail without swap:

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verify
swapon --show
```

### Disable System PostgreSQL (if installed)

Docker runs its own PostgreSQL container on port 5432. If the system has PostgreSQL installed, it will conflict:

```bash
systemctl stop postgresql
systemctl disable postgresql
```

### Initial SSL Certificates

```bash
certbot certonly --standalone \
  -d live-ac.tech \
  -d www.live-ac.tech \
  -d api.live-ac.tech \
  --non-interactive --agree-tos \
  --email your-email@gmail.com
```

### Initial Git Clone

```bash
cd /opt/hvac
git init
git remote add origin https://gitlab.com/isira.aw/hvac-production.git
git fetch origin main
git reset --hard origin/main
```

> **Note:** If `/opt/hvac` already has files, use `git init` + `git fetch` instead of `git clone`
> (clone fails if the directory is not empty).

---

## 2. GitLab CI/CD Variables

Go to your GitLab project: **Settings > CI/CD > Variables**

Add each variable below. Mark sensitive ones as **Protected** and **Masked**.

### Database

| Variable      | Value           | Protected | Masked |
|---------------|-----------------|-----------|--------|
| `DB_NAME`     | `hvac_db`       | Yes       | No     |
| `DB_USERNAME` | `postgres`      | Yes       | No     |
| `DB_PASSWORD` | *your-db-password* | Yes    | Yes    |

### MQTT Broker

| Variable             | Value                              | Protected | Masked |
|----------------------|------------------------------------|-----------|--------|
| `MOSQUITTO_HOST`     | `trolley.proxy.rlwy.net`           | Yes       | No     |
| `MOSQUITTO_PORT`     | `26703`                            | Yes       | No     |
| `MOSQUITTO_USERNAME` | `generator-monitoring-system`      | Yes       | No     |
| `MOSQUITTO_PASSWORD` | *your-mqtt-password*               | Yes       | Yes    |

### JWT

| Variable         | Value                     | Protected | Masked |
|------------------|---------------------------|-----------|--------|
| `JWT_SECRET`     | *your-jwt-secret-key*     | Yes       | Yes    |
| `JWT_EXPIRATION` | `21600000`                | Yes       | No     |

### Email (Gmail SMTP)

| Variable        | Value                  | Protected | Masked |
|-----------------|------------------------|-----------|--------|
| `MAIL_HOST`     | `smtp.gmail.com`       | Yes       | No     |
| `MAIL_PORT`     | `465`                  | Yes       | No     |
| `MAIL_USERNAME` | *your-email@gmail.com* | Yes       | No     |
| `MAIL_PASSWORD` | *your-app-password*    | Yes       | Yes    |

**How to get a Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and generate a password (16 characters, e.g., `cedm mgtv ykaq bgcz`)
5. Use that as `MAIL_PASSWORD`

### Google OAuth2

| Variable              | Value                       | Protected | Masked |
|-----------------------|-----------------------------|-----------|--------|
| `GOOGLE_CLIENT_ID`    | *your-google-client-id*     | Yes       | No     |
| `GOOGLE_CLIENT_SECRET`| *your-google-client-secret* | Yes       | Yes    |

**How to get Google OAuth credentials:**
1. Go to https://console.cloud.google.com/
2. Create or select a project
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins:
   - `https://live-ac.tech`
   - `https://www.live-ac.tech`
7. Authorized redirect URIs:
   - `https://api.live-ac.tech/login/oauth2/code/google`
8. Copy Client ID and Client Secret

### Application URLs

| Variable                | Value                                                    | Protected | Masked |
|-------------------------|----------------------------------------------------------|-----------|--------|
| `CORS_ALLOWED_ORIGINS`  | `https://live-ac.tech,https://www.live-ac.tech`          | Yes       | No     |
| `NEXT_PUBLIC_API_URL`   | `https://api.live-ac.tech`                               | Yes       | No     |
| `DOMAIN`                | `live-ac.tech`                                           | Yes       | No     |
| `API_DOMAIN`            | `api.live-ac.tech`                                       | Yes       | No     |

---

## 3. GitLab Runner Setup (REQUIRED)

The free GitLab.com shared runners have a **400 min/month limit**. You must install a
**self-hosted runner** on your server. This is free, unlimited, and faster.

SSH into your server and run:

```bash
# 1. Install GitLab Runner
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | bash
apt install -y gitlab-runner
```

```bash
# 2. Register the runner
#    Get your registration token from:
#    GitLab > Your Project > Settings > CI/CD > Runners > "New project runner"
#
#    When prompted, enter:
#      - GitLab URL:    https://gitlab.com/
#      - Token:         (paste the token from GitLab)
#      - Description:   production-server
#      - Tags:          production
#      - Executor:      shell

gitlab-runner register
```

```bash
# 3. Add gitlab-runner user to docker group (so it can run docker commands)
usermod -aG docker gitlab-runner

# 4. Give gitlab-runner passwordless sudo (needed for certbot)
echo "gitlab-runner ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/gitlab-runner
chmod 440 /etc/sudoers.d/gitlab-runner

# 5. Set /opt/hvac ownership so gitlab-runner can manage it
chown -R gitlab-runner:gitlab-runner /opt/hvac

# 6. Add /opt/hvac as a safe git directory for both users
git config --global --add safe.directory /opt/hvac
su - gitlab-runner -c "git config --global --add safe.directory /opt/hvac"

# 7. Start the runner and restart to pick up group changes
gitlab-runner restart

# 8. Verify it's running
gitlab-runner status
```

After this, go to **GitLab > Settings > CI/CD > Runners** and:
1. You should see your runner listed with a **green circle**
2. **Disable shared runners** for the project (toggle them off) to avoid hitting the free tier limit
3. The pipeline will now use your server directly -- no minute limits, no extra cost

---

## 4. DNS Configuration

Point these DNS records to your server IP (`64.227.144.94`):

| Type | Name              | Value            |
|------|-------------------|------------------|
| A    | `live-ac.tech`    | `64.227.144.94`  |
| A    | `www.live-ac.tech`| `64.227.144.94`  |
| A    | `api.live-ac.tech`| `64.227.144.94`  |

Configure these at your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare).

---

## 5. How the CI/CD Pipeline Works

```
Push to main branch
        │
        ▼
┌─────────────────┐
│ deploy-production│  (runs on self-hosted runner via shell executor)
│                 │
│  1. Clone/pull latest code to /opt/hvac
│  2. Generate .env from GitLab CI/CD Variables
│  3. Run deploy.sh:
│     ├─ Obtain SSL certs if needed (certbot)
│     ├─ Build backend Docker image (Maven/Java)
│     ├─ Build customer-portal Docker image (Next.js)
│     ├─ Stop old containers
│     ├─ Start new containers
│     └─ Health check verification
└─────────────────┘
```

**Auto-deploy:** Every push to `main` triggers the pipeline automatically.

**Note:** Docker images are built **sequentially** (not in parallel) to avoid running out of
memory on 2GB RAM servers.

---

## 6. Manual Deployment (without CI/CD)

If you need to deploy manually:

```bash
ssh root@64.227.144.94
cd /opt/hvac
git pull origin main

# Create .env file manually (copy from .env.example and fill in values)
# Then:
./deploy.sh
```

---

## 7. Useful Commands (on the server)

```bash
cd /opt/hvac

# View all service status
docker compose ps

# View logs
docker compose logs -f backend        # Backend logs
docker compose logs -f customer-portal # Frontend logs
docker compose logs -f nginx           # Nginx logs
docker compose logs -f postgres        # Database logs

# Restart a single service
docker compose restart backend

# Rebuild and restart everything
docker compose down && docker compose up -d --build

# Enter PostgreSQL
docker compose exec postgres psql -U postgres -d hvac_db

# Check disk usage
docker system df

# Check swap usage
swapon --show
free -h
```

---

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check logs: `docker compose logs backend`. Verify DB_PASSWORD and SPRING_DATASOURCE_URL. |
| Backend unhealthy (slow start) | On 2GB servers, Spring Boot can take 2+ minutes to start. Check `docker compose logs -f backend` and wait. Java memory is capped at 384MB via `JAVA_OPTS`. |
| Customer portal unhealthy | Check `docker compose logs customer-portal`. The healthcheck uses Node.js HTTP (not wget). |
| Email not sending | Verify MAIL_PASSWORD is a Gmail App Password (not your account password). |
| Google OAuth not working | Check GOOGLE_CLIENT_ID, ensure authorized origins include `https://live-ac.tech`. |
| SSL certificate expired | Run `certbot renew` or check the certbot container: `docker compose logs certbot`. |
| MQTT not connecting | Verify MOSQUITTO_HOST, PORT, USERNAME, PASSWORD. Test with: `apt install mosquitto-clients && mosquitto_sub -h HOST -p PORT -u USER -P PASS -t '#'` |
| 502 Bad Gateway | Backend or frontend container may have crashed. Check: `docker compose ps` and restart. |
| Port 5432 in use | Stop system PostgreSQL: `systemctl stop postgresql && systemctl disable postgresql` |
| Permission denied (git/docker) | Ensure `/opt/hvac` is owned by `gitlab-runner`: `chown -R gitlab-runner:gitlab-runner /opt/hvac` |
| Pipeline stuck in "Pending" | Runner may be offline. Run `gitlab-runner restart` on the server. Also disable shared runners in GitLab settings. |
| Docker build OOM / SSL errors | Add swap: `fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` |
| "dubious ownership" git error | Run: `su - gitlab-runner -c "git config --global --add safe.directory /opt/hvac"` |
