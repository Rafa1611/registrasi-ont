# 🌐 Rafa Hotspot ONT Registrasi

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production-green.svg)

Sistem registrasi ONT Huawei berbasis web yang komprehensif untuk GPON/EPON dengan fitur lengkap untuk konfigurasi, monitoring, dan management ONT devices.

## 📦 Instalasi Cepat

### Persyaratan Sistem
- Ubuntu/Debian Linux (atau distribusi Linux lainnya)
- Node.js (v14 atau lebih baru)
- Python 3.8+
- MongoDB
- Yarn package manager
- Git

### Instalasi Otomatis (Recommended)

Jalankan perintah berikut di terminal:

```bash
curl -o install.sh https://raw.githubusercontent.com/Rafa1611/registrasi-ont/main/install.sh
chmod +x install.sh
./install.sh
```

Atau clone dulu repository dan jalankan scriptnya:

```bash
git clone https://github.com/Rafa1611/registrasi-ont.git
cd registrasi-ont
chmod +x install.sh
./install.sh
```

Script akan secara otomatis:
1. ✅ Check system requirements
2. ✅ Clone repository dari GitHub
3. ✅ Install semua dependencies (backend & frontend)
4. ✅ Setup environment files
5. ✅ Setup MongoDB
6. ✅ Create admin user default
7. ✅ Build frontend
8. ✅ Setup systemd services

### Instalasi Manual

Jika ingin install secara manual:

```bash
# 1. Clone repository
git clone https://github.com/Rafa1611/registrasi-ont.git
cd registrasi-ont

# 2. Install backend dependencies
cd backend
pip3 install -r requirements.txt

# 3. Create backend/.env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=rafa_hotspot_ont
JWT_SECRET_KEY=your-secret-key-change-in-production-2024
HOST=0.0.0.0
PORT=8001
EOF

# 4. Create admin user
python3 create_admin.py

# 5. Install frontend dependencies
cd ../frontend
yarn install

# 6. Create frontend/.env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# 7. Start services (development mode)
# Terminal 1 - Backend
cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001

# Terminal 2 - Frontend
cd frontend
yarn start
```

## 🚀 Menjalankan Aplikasi

### Menggunakan Systemd (Production)

```bash
# Start services
sudo systemctl start rafa-hotspot-backend
sudo systemctl start rafa-hotspot-frontend

# Check status
sudo systemctl status rafa-hotspot-backend
sudo systemctl status rafa-hotspot-frontend

# Enable auto-start on boot
sudo systemctl enable rafa-hotspot-backend
sudo systemctl enable rafa-hotspot-frontend

# View logs
sudo journalctl -u rafa-hotspot-backend -f
sudo journalctl -u rafa-hotspot-frontend -f
```

### Development Mode

```bash
# Terminal 1 - Backend
cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend
cd frontend
yarn start
```

## 🔐 Login Default

Setelah instalasi, gunakan kredensial berikut untuk login pertama kali:

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **PENTING:** Segera ubah password setelah login pertama kali!

## 🌐 Akses Aplikasi

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **API Docs:** http://localhost:8001/docs

## ✨ Fitur Utama

### 🔐 **Authentication & Authorization**
- ✅ Login system dengan JWT authentication
- ✅ Role-based access control (Admin & Operator)
- ✅ User management (untuk Admin)
- ✅ Secure password hashing dengan bcrypt

### 🔌 **Device Management**
- ✅ Kelola multiple OLT devices
- ✅ Koneksi Telnet real-time ke OLT
- ✅ Auto-reconnect functionality
- ✅ Status monitoring live
- ✅ CRUD operations (Create, Read, Update, Delete)

### ⚙️ **Configuration Management**
- ✅ Konfigurasi Frame, Board, Port
- ✅ Template GPON & EPON
- ✅ VLAN Configuration (Service, IPTV, Multicast) dengan panduan lengkap
- ✅ Service Flow Configuration
- ✅ Registration Code Rules
- ✅ Import/Export config.ini files
- ✅ Command Templates

### 📡 **ONT Management**
- ✅ Auto-registration ONT (Scan ONT Baru)
- ✅ Manual registration dengan serial number
- ✅ Port mapping & VLAN assignment
- ✅ Status monitoring (Online/Offline/Registered)
- ✅ Description field untuk setiap ONT
- ✅ "Registered By" tracking - mencatat user yang melakukan registrasi
- ✅ Post-registration result dengan Rx Optical Power
- ✅ Bulk ONT operations

### 💻 **Terminal Console**
- ✅ Real-time command execution
- ✅ Command history (↑/↓ arrows)
- ✅ Quick command templates
- ✅ Log export functionality
- ✅ Response viewer dengan syntax highlighting

### 📊 **Monitoring & Logging**
- ✅ Real-time logging system
- ✅ Command execution history
- ✅ Export logs ke file
- ✅ Connection status tracking
- ✅ Device statistics dashboard

### 👥 **User Management (Admin Only)**
- ✅ Create, Edit, Delete users
- ✅ Role assignment (Admin/Operator)
- ✅ Permission management
- ✅ User activity tracking

## 🏗️ Teknologi Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database untuk flexibility
- **Motor** - Async MongoDB driver
- **Telnetlib3** - Async telnet client untuk OLT connection
- **WebSocket** - Real-time communication

### Frontend
- **React 19** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Lucide Icons** - Modern icon library
- **Sonner** - Toast notifications
- **Axios** - HTTP client

## 🚀 Penggunaan

### 1. Tambah OLT Device
1. Klik tab **"Devices"**
2. Klik tombol **"Tambah Device"**
3. Masukkan informasi device:
   - Nama Device
   - IP Address OLT
   - Port (default: 23)
   - Username
   - Password
   - Identifier (optional)
4. Klik **"Tambah Device"**

### 2. Connect ke OLT
1. Pilih device dari list
2. Klik tombol **"Connect"**
3. Tunggu hingga status berubah menjadi "Connected"

### 3. Konfigurasi OLT
1. Pilih device yang sudah connected
2. Klik tab **"Configuration"**
3. Atur parameter:
   - **Dasar**: Frame, Board, Port, Registration Rule
   - **VLAN**: Service VLAN, VOD VLAN, Multicast VLAN
   - **Templates**: GPON/EPON templates & commands
   - **Advanced**: Feature toggles, BTV service
4. Klik **"Simpan"** untuk save configuration

### 4. Register ONT
1. Klik tab **"ONT Management"**
2. Klik **"Register ONT"**
3. Masukkan:
   - ONT ID
   - Serial Number
   - Frame/Board/Port
   - VLAN
4. ONT akan otomatis terdaftar dengan registration code

### 5. Gunakan Terminal
1. Klik tab **"Terminal"**
2. Pastikan device sudah connected
3. Ketik command di input terminal
4. Tekan Enter atau klik **"Send"**
5. Lihat response di terminal output
6. Gunakan ↑/↓ untuk command history

### 6. Import/Export Config
- **Export**: Klik "Export" untuk download config.ini
- **Import**: Klik "Import" dan pilih file config.ini

## 📋 API Endpoints

### Devices
```
GET    /api/devices              - List all devices
POST   /api/devices              - Create device
GET    /api/devices/{id}         - Get device by ID
PUT    /api/devices/{id}         - Update device
DELETE /api/devices/{id}         - Delete device
POST   /api/devices/{id}/connect - Connect to device
POST   /api/devices/{id}/disconnect - Disconnect
```

### Configuration
```
GET    /api/configurations       - List configurations
POST   /api/configurations       - Create configuration
GET    /api/configurations/device/{device_id} - Get by device
PUT    /api/configurations/{id}  - Update configuration
DELETE /api/configurations/{id}  - Delete configuration
```

### ONT
```
GET    /api/ont                  - List all ONTs
POST   /api/ont                  - Register ONT
GET    /api/ont/device/{device_id} - Get ONTs by device
DELETE /api/ont/{id}             - Delete ONT
```

### Commands
```
POST   /api/devices/command      - Execute command
GET    /api/logs/{device_id}     - Get command logs
DELETE /api/logs/{device_id}     - Clear logs
```

### Config Import/Export
```
POST   /api/config/import        - Import config file
GET    /api/config/export/{device_id} - Export config
```

## 🔧 Troubleshooting

### Backend tidak start
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Restart backend
sudo supervisorctl restart backend
```

### Frontend error
```bash
# Restart frontend
sudo supervisorctl restart frontend
```

### Connection ke OLT gagal
- Pastikan IP address dan port benar
- Check firewall settings
- Verify username & password
- Pastikan OLT device accessible dari server

## 📝 Configuration File Format

Format config.ini yang didukung:

```ini
[OLT]
ip_address=10.11.104.2
port=23
username=root
password=encryptedpassword
identifier=My OLT Device

[Basic]
frame=0
board=1
port=3
service_board=0/1
g_line_template=1
g_service_template=1
service_outer_vlan=41
service_inner_vlan=41
vod_outer_vlan=42
vod_inner_vlan=42
multicast_vlan=69
registration_rule=0-(B)-(P)-(O)
gemport=1,2,3
```

## 🎯 Roadmap

### Version 1.1
- [ ] User authentication & authorization
- [ ] Multi-user support
- [ ] Role-based access control
- [ ] Scheduled commands
- [ ] Backup/restore functionality

### Version 1.2
- [ ] Real-time monitoring dashboard
- [ ] Alert notifications (Email/SMS)
- [ ] API rate limiting
- [ ] Audit logging
- [ ] Performance optimization

---

**Happy Managing! 🚀**
