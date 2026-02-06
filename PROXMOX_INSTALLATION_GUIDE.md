# 🚀 Panduan Lengkap: Instalasi di Proxmox CT Ubuntu 22.04

## 📋 Checklist Instalasi

- [ ] Proxmox CT dengan Ubuntu 22.04 Standard sudah dibuat
- [ ] CT sudah running dan bisa SSH
- [ ] Internet connection tersedia
- [ ] Root access tersedia

---

## Step-by-Step Installation

### Step 1: Login ke Container

```bash
# Via Proxmox Console atau SSH
ssh root@[IP-CONTAINER]
```

### Step 2: Update System

```bash
apt update && apt upgrade -y
```

### Step 3: Install Git & Basic Tools

```bash
apt install -y curl wget git vim nano
```

### Step 4: Install Node.js 20.x (CRITICAL!)

⚠️ **Node.js v20+ adalah WAJIB** - react-router-dom membutuhkan minimal Node.js 20.0.0

```bash
# Remove old Node.js repository (jika ada)
rm -f /etc/apt/sources.list.d/nodesource.list

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt update
apt install -y nodejs

# Verify version
node --version    # HARUS >= v20.0.0

# Install Yarn
npm install -g yarn

# Verify Yarn
yarn --version
```

**Expected Output:**
```
node --version
v20.11.1  # atau versi 20.x lainnya

yarn --version
1.22.22
```

### Step 5: Install Python & pip

```bash
apt install -y python3 python3-pip python3-venv

# Verify
python3 --version   # Should be 3.10.x
pip3 --version
```

### Step 6: Install MongoDB

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
  gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Verify MongoDB is running
systemctl status mongod
# Should show: Active: active (running)

# Test MongoDB connection
mongosh --eval "db.version()" --quiet
# Should show MongoDB version
```

### Step 7: Clone Repository

```bash
# Clone dari GitHub
cd ~
git clone https://github.com/Rafa1611/registrasi-ont.git
cd registrasi-ont

# Verify files
ls -la
# Should see: install.sh, backend/, frontend/, README.md, etc.
```

### Step 8: Run Installation Script

```bash
# Make script executable
chmod +x install.sh

# Run installation
./install.sh
```

**Installation will:**
1. ✅ Check system requirements
2. ✅ Install backend dependencies (Python packages)
3. ✅ Install frontend dependencies (Node packages)
4. ✅ Create .env files
5. ✅ Check MongoDB status
6. ✅ Create admin user (admin/admin123)
7. ✅ Build frontend for production
8. ✅ Setup systemd services

**Installation should complete in 2-5 minutes.**

### Step 9: Start Services

```bash
# Start backend service
systemctl start rafa-hotspot-backend

# Start frontend service
systemctl start rafa-hotspot-frontend

# Check status
systemctl status rafa-hotspot-backend
systemctl status rafa-hotspot-frontend

# Both should show: Active: active (running)
```

### Step 10: Enable Auto-Start on Boot

```bash
systemctl enable rafa-hotspot-backend
systemctl enable rafa-hotspot-frontend
```

### Step 11: Verify Installation

```bash
# Check backend is responding
curl http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return JSON with access_token

# Check frontend is serving
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK
```

### Step 12: Get Container IP Address

```bash
# Find your container IP
ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d'/' -f1

# Or simply
hostname -I
```

### Step 13: Access from Browser

Buka browser dari komputer lain di network yang sama:

```
http://[IP-CONTAINER]:3000
```

**Login dengan:**
- Username: `admin`
- Password: `admin123`

---

## 🔧 Common Issues & Solutions

### Issue 1: Node.js Version Error

**Error:**
```
error react-router-dom@7.13.0: The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Your Node.js is too old. Upgrade to v20:
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version  # Verify it's >= 20.0.0
```

### Issue 2: MongoDB Not Running

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Start MongoDB
systemctl start mongod

# Check status
systemctl status mongod

# If fails, check logs
journalctl -u mongod -n 50
```

### Issue 3: Permission Error on MongoDB

**Error:**
```
Failed to start mongod.service
```

**Solution:**
```bash
# Fix permissions
chown -R mongodb:mongodb /var/lib/mongodb
chown -R mongodb:mongodb /var/log/mongodb

# Restart
systemctl restart mongod
```

### Issue 4: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find what's using the port
lsof -i :3000
lsof -i :8001

# Kill the process
kill -9 [PID]

# Or restart services
systemctl restart rafa-hotspot-backend
systemctl restart rafa-hotspot-frontend
```

### Issue 5: Frontend Won't Start

**Solution:**
```bash
# Check logs
journalctl -u rafa-hotspot-frontend -n 50

# Reinstall frontend dependencies
cd ~/registrasi-ont/frontend
rm -rf node_modules yarn.lock
yarn install
yarn build

# Restart service
systemctl restart rafa-hotspot-frontend
```

### Issue 6: Backend Won't Start

**Solution:**
```bash
# Check logs
journalctl -u rafa-hotspot-backend -n 50

# Reinstall backend dependencies
cd ~/registrasi-ont/backend
pip3 install -r requirements.txt --force-reinstall

# Restart service
systemctl restart rafa-hotspot-backend
```

---

## 📊 Resource Monitoring

### Check Service Status
```bash
systemctl status rafa-hotspot-backend
systemctl status rafa-hotspot-frontend
systemctl status mongod
```

### View Logs in Real-time
```bash
# Backend logs
journalctl -u rafa-hotspot-backend -f

# Frontend logs
journalctl -u rafa-hotspot-frontend -f

# MongoDB logs
journalctl -u mongod -f
```

### Check Resource Usage
```bash
# CPU & RAM
htop

# Disk usage
df -h

# Network
netstat -tulpn | grep -E "3000|8001|27017"
```

---

## 🔒 Security Tips

### 1. Change Default Password
- Login ke aplikasi dengan admin/admin123
- Segera ubah password via User Management

### 2. Setup Firewall
```bash
apt install -y ufw
ufw allow 22/tcp      # SSH
ufw allow 3000/tcp    # Frontend
ufw allow 8001/tcp    # Backend
ufw enable
ufw status
```

### 3. Update JWT Secret
```bash
# Generate random secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Edit backend/.env
nano ~/registrasi-ont/backend/.env
# Update JWT_SECRET_KEY with generated value

# Restart backend
systemctl restart rafa-hotspot-backend
```

### 4. Disable Root Login (Optional)
```bash
# Create non-root user
adduser ontadmin
usermod -aG sudo ontadmin

# Disable root SSH
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd
```

---

## 📦 Backup & Restore

### Backup Container (from Proxmox)
1. Go to Proxmox web interface
2. Select your container
3. Click "Backup" > "Backup now"
4. Choose storage and compression

### Backup Database
```bash
# Create backup directory
mkdir -p /backup

# Backup MongoDB
mongodump --db rafa_hotspot_ont --out /backup/$(date +%Y%m%d)

# Compress
tar -czf /backup/mongo-$(date +%Y%m%d).tar.gz /backup/$(date +%Y%m%d)
```

### Restore Database
```bash
# Extract backup
tar -xzf /backup/mongo-20250206.tar.gz -C /tmp

# Restore
mongorestore --db rafa_hotspot_ont /tmp/backup/20250206/rafa_hotspot_ont
```

---

## ✅ Post-Installation Checklist

- [ ] All services running (backend, frontend, mongodb)
- [ ] Can access http://[IP]:3000 from browser
- [ ] Can login with admin/admin123
- [ ] Default password changed
- [ ] JWT secret updated
- [ ] Firewall configured
- [ ] Backup created

---

## 📞 Support

Jika mengalami masalah:
1. Check logs: `journalctl -u rafa-hotspot-backend -n 50`
2. Verify services: `systemctl status rafa-hotspot-*`
3. Check documentation: README.md, FIX_INSTALLATION_ERROR.md

---

**Selamat! Aplikasi Rafa Hotspot ONT Registrasi sudah siap digunakan! 🎉**
