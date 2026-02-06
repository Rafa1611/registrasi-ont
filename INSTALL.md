# 📦 Panduan Instalasi Lengkap
# Rafa Hotspot ONT Registrasi System

## 📋 Daftar Isi
1. [Persyaratan Sistem](#persyaratan-sistem)
2. [Instalasi Otomatis](#instalasi-otomatis)
3. [Instalasi Manual](#instalasi-manual)
4. [Konfigurasi](#konfigurasi)
5. [Menjalankan Aplikasi](#menjalankan-aplikasi)
6. [Troubleshooting](#troubleshooting)

---

## 🖥️ Persyaratan Sistem

### Hardware Minimum
- **CPU:** 2 cores
- **RAM:** 2 GB
- **Storage:** 10 GB free space
- **Network:** Koneksi internet untuk instalasi

### Software Requirements
- **OS:** Ubuntu 20.04/22.04, Debian 11/12, atau distribusi Linux lainnya
- **Node.js:** v20.x atau lebih baru (REQUIRED: >= 20.0.0)
- **Python:** 3.8 atau lebih baru
- **MongoDB:** 4.4 atau lebih baru
- **Yarn:** Latest version
- **Git:** Latest version

### Instalasi Prerequisites

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20 LTS - REQUIRED)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3 & pip
sudo apt install -y python3 python3-pip

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Yarn
sudo npm install -g yarn

# Install Git
sudo apt install -y git
```

#### CentOS/RHEL
```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Python 3
sudo yum install -y python3 python3-pip

# Install MongoDB
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo << 'EOF'
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

sudo yum install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Yarn
sudo npm install -g yarn

# Install Git
sudo yum install -y git
```

---

## 🚀 Instalasi Otomatis (Recommended)

Cara tercepat dan termudah untuk menginstall aplikasi:

### Metode 1: Direct Download & Execute

```bash
# Download installation script
curl -o install.sh https://raw.githubusercontent.com/Rafa1611/registrasi-ont/main/install.sh

# Make it executable
chmod +x install.sh

# Run installation
./install.sh
```

### Metode 2: Clone Repository Dulu

```bash
# Clone repository
git clone https://github.com/Rafa1611/registrasi-ont.git

# Navigate to directory
cd registrasi-ont

# Make script executable
chmod +x install.sh

# Run installation
./install.sh
```

### Apa yang Dilakukan Script?

Script instalasi otomatis akan:

1. ✅ **Check system requirements** - Memastikan semua tools yang dibutuhkan sudah terinstall
2. ✅ **Clone repository** - Download source code dari GitHub
3. ✅ **Install backend dependencies** - Install semua Python packages yang dibutuhkan
4. ✅ **Install frontend dependencies** - Install semua Node.js packages
5. ✅ **Setup environment files** - Membuat file `.env` untuk backend dan frontend
6. ✅ **Setup MongoDB** - Check dan start MongoDB service
7. ✅ **Create admin user** - Membuat user admin default dengan username `admin` dan password `admin123`
8. ✅ **Build frontend** - Compile React application untuk production
9. ✅ **Setup systemd services** - Membuat service untuk auto-start aplikasi

### Output Instalasi

Setelah instalasi selesai, Anda akan melihat output seperti ini:

```
==================================================
  Installation Complete!
==================================================

📂 Installation Directory: /home/username/rafa-hotspot-ont

📋 Next Steps:

1. Configure your environment (optional):
   • Edit: /home/username/rafa-hotspot-ont/backend/.env
   • Edit: /home/username/rafa-hotspot-ont/frontend/.env

2. Start the services:
   sudo systemctl start rafa-hotspot-backend
   sudo systemctl start rafa-hotspot-frontend

3. Check service status:
   sudo systemctl status rafa-hotspot-backend
   sudo systemctl status rafa-hotspot-frontend

4. Access the application:
   • Frontend: http://localhost:3000
   • Backend API: http://localhost:8001/api

5. Login with default credentials:
   • Username: admin
   • Password: admin123
   ⚠️  IMPORTANT: Change this password after first login!
```

---

## 🛠️ Instalasi Manual

Jika Anda lebih suka menginstall secara manual atau script otomatis gagal:

### Step 1: Clone Repository

```bash
git clone https://github.com/Rafa1611/registrasi-ont.git
cd registrasi-ont
```

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip3 install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=rafa_hotspot_ont
JWT_SECRET_KEY=your-secret-key-change-in-production-2024
HOST=0.0.0.0
PORT=8001
EOF

# Create admin user
python3 create_admin.py
```

### Step 3: Setup Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
yarn install

# Create .env file
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Build for production
yarn build
```

### Step 4: Setup Systemd Services (Optional)

Untuk production, setup systemd services:

```bash
# Create backend service
sudo tee /etc/systemd/system/rafa-hotspot-backend.service > /dev/null << EOF
[Unit]
Description=Rafa Hotspot Backend Service
After=network.target mongodb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create frontend service
sudo tee /etc/systemd/system/rafa-hotspot-frontend.service > /dev/null << EOF
[Unit]
Description=Rafa Hotspot Frontend Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/frontend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/yarn start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable rafa-hotspot-backend
sudo systemctl enable rafa-hotspot-frontend
```

---

## ⚙️ Konfigurasi

### Backend Configuration (`backend/.env`)

```bash
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=rafa_hotspot_ont

# JWT Secret Key - WAJIB DIGANTI DI PRODUCTION!
JWT_SECRET_KEY=your-secret-key-change-in-production-2024

# Server Configuration
HOST=0.0.0.0
PORT=8001
```

**Penting:**
- Ganti `JWT_SECRET_KEY` dengan string random yang kuat untuk production
- Generate dengan: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`

### Frontend Configuration (`frontend/.env`)

```bash
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Untuk Production:**
- Ubah `REACT_APP_BACKEND_URL` ke URL server Anda (e.g., `https://api.yourdomain.com`)

---

## 🚀 Menjalankan Aplikasi

### Production Mode (dengan Systemd)

```bash
# Start services
sudo systemctl start rafa-hotspot-backend
sudo systemctl start rafa-hotspot-frontend

# Check status
sudo systemctl status rafa-hotspot-backend
sudo systemctl status rafa-hotspot-frontend

# Stop services
sudo systemctl stop rafa-hotspot-backend
sudo systemctl stop rafa-hotspot-frontend

# Restart services
sudo systemctl restart rafa-hotspot-backend
sudo systemctl restart rafa-hotspot-frontend

# View logs
sudo journalctl -u rafa-hotspot-backend -f
sudo journalctl -u rafa-hotspot-frontend -f
```

### Development Mode

```bash
# Terminal 1 - Start Backend
cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Start Frontend
cd frontend
yarn start
```

### Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **API Documentation:** http://localhost:8001/docs

### Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **WAJIB:** Ubah password setelah login pertama kali!

---

## 🔧 Troubleshooting

### MongoDB Tidak Bisa Connect

**Error:** `ConnectionRefusedError: [Errno 111] Connection refused`

**Solusi:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Enable auto-start
sudo systemctl enable mongod

# Test connection
mongosh
```

### Backend Tidak Start

**Error:** `ModuleNotFoundError: No module named 'xxx'`

**Solusi:**
```bash
# Reinstall dependencies
cd backend
pip3 install -r requirements.txt --force-reinstall

# Check Python version
python3 --version  # Should be 3.8 or higher
```

### Frontend Build Failed

**Error:** `yarn build` gagal

**Solusi:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules yarn.lock
yarn install
yarn build
```

### Port Already in Use

**Error:** `Address already in use`

**Solusi:**
```bash
# Check what's using the port
sudo lsof -i :8001  # Backend
sudo lsof -i :3000  # Frontend

# Kill the process
sudo kill -9 <PID>

# Or use different port
# Edit backend/.env: PORT=8002
# Edit frontend/.env: REACT_APP_BACKEND_URL=http://localhost:8002
```

### Service Won't Start

```bash
# Check logs untuk error details
sudo journalctl -u rafa-hotspot-backend -n 50
sudo journalctl -u rafa-hotspot-frontend -n 50

# Check service file syntax
sudo systemctl daemon-reload
sudo systemctl restart rafa-hotspot-backend
```

### Permission Denied Errors

```bash
# Fix ownership
cd /path/to/rafa-hotspot-ont
sudo chown -R $USER:$USER .

# Make scripts executable
chmod +x install.sh
```

---

## 🔒 Security Tips untuk Production

1. **Ganti JWT Secret Key**
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   # Copy output ke backend/.env JWT_SECRET_KEY
   ```

2. **Ubah Default Password**
   - Login dengan admin/admin123
   - Immediately change password via user management

3. **Setup Firewall**
   ```bash
   sudo ufw allow 3000/tcp  # Frontend
   sudo ufw allow 8001/tcp  # Backend
   sudo ufw enable
   ```

4. **Use HTTPS**
   - Setup reverse proxy (Nginx/Apache)
   - Get SSL certificate (Let's Encrypt)

5. **Backup MongoDB**
   ```bash
   mongodump --db rafa_hotspot_ont --out /backup/$(date +%Y%m%d)
   ```

---

## 📞 Support

Jika mengalami masalah:
1. Check dokumentasi lengkap di `/app/README.md`
2. Check logs: `sudo journalctl -u rafa-hotspot-backend -f`
3. Open issue di GitHub repository

---

**Selamat Menggunakan Rafa Hotspot ONT Registrasi! 🚀**
