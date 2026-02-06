# 🚀 Quick Start Guide
# Rafa Hotspot ONT Registrasi

## Instalasi Super Cepat (5 Menit)

### Prerequisites
Pastikan sudah terinstall: Git, Node.js, Python 3, MongoDB, Yarn

### Langkah Instalasi

```bash
# 1. Download dan jalankan installation script
curl -o install.sh https://raw.githubusercontent.com/Rafa1611/registrasi-ont/main/install.sh
chmod +x install.sh
./install.sh

# 2. Start services
sudo systemctl start rafa-hotspot-backend
sudo systemctl start rafa-hotspot-frontend

# 3. Buka browser
# http://localhost:3000

# 4. Login
# Username: admin
# Password: admin123
```

Selesai! 🎉

---

## Alternative: Development Mode

```bash
# Clone repository
git clone https://github.com/Rafa1611/registrasi-ont.git
cd registrasi-ont

# Setup backend
cd backend
pip3 install -r requirements.txt
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=rafa_hotspot_ont
JWT_SECRET_KEY=your-secret-key-change-in-production-2024
HOST=0.0.0.0
PORT=8001
EOF
python3 create_admin.py

# Setup frontend (terminal baru)
cd ../frontend
yarn install
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Start backend
cd ../backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload &

# Start frontend
cd ../frontend
yarn start
```

---

## Perintah Berguna

```bash
# Check status
sudo systemctl status rafa-hotspot-backend
sudo systemctl status rafa-hotspot-frontend

# Restart services
sudo systemctl restart rafa-hotspot-backend
sudo systemctl restart rafa-hotspot-frontend

# View logs
sudo journalctl -u rafa-hotspot-backend -f
sudo journalctl -u rafa-hotspot-frontend -f

# Stop services
sudo systemctl stop rafa-hotspot-backend
sudo systemctl stop rafa-hotspot-frontend
```

---

## Default Credentials

- **Username:** admin
- **Password:** admin123

⚠️ **Ubah password setelah login pertama!**

---

## Troubleshooting Cepat

**MongoDB tidak berjalan?**
```bash
sudo systemctl start mongod
```

**Port sudah digunakan?**
```bash
sudo lsof -i :8001
sudo lsof -i :3000
```

**Service tidak start?**
```bash
sudo journalctl -u rafa-hotspot-backend -n 50
```

---

Untuk dokumentasi lengkap, lihat [INSTALL.md](./INSTALL.md) atau [README.md](./README.md)
