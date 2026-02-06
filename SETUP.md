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

### Generate SSH Key Pair (for CI/CD)

On the server, generate a deploy key:

```bash
ssh-keygen -t ed25519 -C "gitlab-deploy" -f /root/.ssh/gitlab_deploy -N ""
cat /root/.ssh/gitlab_deploy.pub >> /root/.ssh/authorized_keys
cat /root/.ssh/gitlab_deploy   # Copy this private key for GitLab
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
git clone https://gitlab.com/YOUR_USERNAME/YOUR_REPO.git .
```

---

## 2. GitLab CI/CD Variables

Go to your GitLab project: **Settings > CI/CD > Variables**

Add each variable below. Mark sensitive ones as **Protected** and **Masked**.

### SSH & Server

| Variable         | Value                  | Protected | Masked |
|------------------|------------------------|-----------|--------|
| `SSH_PRIVATE_KEY`| *(contents of /root/.ssh/gitlab_deploy)* | Yes | Yes |

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

| Variable                | Value                                                                          | Protected | Masked |
|-------------------------|--------------------------------------------------------------------------------|-----------|--------|
| `CORS_ALLOWED_ORIGINS`  | `https://live-ac.tech,https://www.live-ac.tech`                                | Yes       | No     |
| `NEXT_PUBLIC_API_URL`   | `https://api.live-ac.tech`                                                     | Yes       | No     |
| `DOMAIN`                | `live-ac.tech`                                                                 | Yes       | No     |
| `API_DOMAIN`            | `api.live-ac.tech`                                                             | Yes       | No     |

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

# 4. Start the runner
gitlab-runner start

# 5. Verify it's running
gitlab-runner status
```

After this, go to **GitLab > Settings > CI/CD > Runners** and you should see your
runner listed with a green circle. The pipeline will now use your server directly
instead of shared runners -- no minute limits, no extra cost.

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
│  validate-backend│  Compiles Java code (mvn compile)
│  validate-frontend│  Builds Next.js (npm run build)
└────────┬────────┘
         │ Both pass
         ▼
┌─────────────────┐
│ deploy-production│
│                 │
│  1. Generate .env from GitLab CI/CD Variables
│  2. SCP .env to server
│  3. SSH: git pull latest code
│  4. SSH: run deploy.sh
│     ├─ Build Docker images
│     ├─ Stop old containers
│     ├─ Start new containers
│     └─ Health check verification
└─────────────────┘
```

**Auto-deploy:** Every push to `main` triggers the full pipeline automatically.

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
```

---

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check logs: `docker compose logs backend`. Verify DB_PASSWORD and SPRING_DATASOURCE_URL. |
| Email not sending | Verify MAIL_PASSWORD is a Gmail App Password (not your account password). |
| Google OAuth not working | Check GOOGLE_CLIENT_ID, ensure authorized origins include `https://live-ac.tech`. |
| SSL certificate expired | Run `certbot renew` or check the certbot container: `docker compose logs certbot`. |
| MQTT not connecting | Verify MOSQUITTO_HOST, PORT, USERNAME, PASSWORD. Test with: `apt install mosquitto-clients && mosquitto_sub -h HOST -p PORT -u USER -P PASS -t '#'` |
| 502 Bad Gateway | Backend or frontend container may have crashed. Check: `docker compose ps` and restart. |
| Pipeline fails at SSH | Verify SSH_PRIVATE_KEY variable in GitLab. Ensure the public key is in server's `authorized_keys`. |
