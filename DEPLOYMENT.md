# AC_contoler_HVAC Deployment Guide

## Overview

This project supports two deployment methods:
1. **Manual Deployment** - Run `remote-deploy.sh` from your local machine
2. **Automated CI/CD** - Push to `main` branch triggers GitLab pipeline

---

## Method 1: Manual Deployment (VS Code / Claude Code)

### Prerequisites
- SSH private key configured for server access
- `.env.production` file with your credentials

### Step 1: Set Up SSH Key

Ensure your SSH private key is available at `~/.ssh/id_ed25519` or set the path:

```bash
export SSH_PRIVATE_KEY_PATH=/path/to/your/private_key
```

### Step 2: Configure Environment Variables

Edit `.env.production` with your actual credentials:

```bash
# Fill in your values in .env.production
nano .env.production
```

### Step 3: Deploy

**Deploy without updating .env (if server already has it):**
```bash
./remote-deploy.sh
```

**Deploy and update .env file:**
```bash
./remote-deploy.sh --with-env
```

---

## Method 2: GitLab CI/CD (Recommended for Production)

### Step 1: Configure GitLab CI/CD Variables

Go to your GitLab project: **Settings > CI/CD > Variables**

Add the following variables (mark sensitive ones as "Masked" and "Protected"):

| Variable | Type | Protected | Masked | Example Value |
|----------|------|-----------|--------|---------------|
| `SSH_PRIVATE_KEY` | File | Yes | Yes | (Your SSH private key content) |
| `DB_PASSWORD` | Variable | Yes | Yes | `your_db_password` |
| `JWT_SECRET` | Variable | Yes | Yes | `your_jwt_secret_256bits` |
| `MOSQUITTO_HOST` | Variable | Yes | No | `trolley.proxy.rlwy.net` |
| `MOSQUITTO_PORT` | Variable | Yes | No | `26703` |
| `MOSQUITTO_USERNAME` | Variable | Yes | No | `generator-monitoring-system` |
| `MOSQUITTO_PASSWORD` | Variable | Yes | Yes | `your_mqtt_password` |
| `MAIL_USERNAME` | Variable | Yes | No | `your_email@gmail.com` |
| `MAIL_PASSWORD` | Variable | Yes | Yes | `your_gmail_app_password` |
| `GOOGLE_CLIENT_ID` | Variable | Yes | No | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Variable | Yes | Yes | `GOCSPX-xxx` |
| `CORS_ALLOWED_ORIGINS` | Variable | Yes | No | `https://live-ac.tech` |
| `NEXT_PUBLIC_API_URL` | Variable | Yes | No | `https://api.live-ac.tech` |

### Step 2: Set Up GitLab Runner

Ensure you have a GitLab Runner with the `production` tag. You can:

1. Use a shared runner (if available)
2. Install a runner on your server or another machine

```bash
# On your server or CI machine
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt install gitlab-runner
sudo gitlab-runner register
# Use tags: production
```

### Step 3: Deploy

Push to the `main` branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

---

## Server Setup (One-Time)

### Initial Clone

If the repository doesn't exist on the server yet:

```bash
ssh root@64.227.144.94

# Create directory
mkdir -p /opt/achvac
cd /opt/achvac

# Clone repository
git clone git@gitlab.com:your-username/AC_contoler_HVAC.git
cd AC_contoler_HVAC

# Set up initial .env
cp .env.example .env
nano .env  # Edit with real values
```

### Verify Docker

```bash
docker --version
docker compose version
```

---

## Troubleshooting

### SSH Connection Failed
```bash
# Test connection manually
ssh -i ~/.ssh/id_ed25519 root@64.227.144.94

# Check key permissions
chmod 600 ~/.ssh/id_ed25519
```

### GitLab Pipeline Fails
- Check CI/CD Variables are set correctly
- Verify Runner has `production` tag
- Check Runner is online: Settings > CI/CD > Runners

### Docker Issues
```bash
# On server, check logs
docker compose -f docker-compose.prod.yml logs

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### .env Issues
```bash
# On server, verify .env exists
cat /opt/achvac/AC_contoler_HVAC/.env

# Check for formatting issues
file /opt/achvac/AC_contoler_HVAC/.env
```

---

## Security Notes

1. **Never commit secrets** - All `.env*` files are in `.gitignore`
2. **Use GitLab CI/CD Variables** - Secrets are masked in logs
3. **Rotate credentials regularly** - Update passwords periodically
4. **Use SSH keys** - Never use password authentication
5. **Limit server access** - Only necessary users should have SSH access
