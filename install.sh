#!/bin/bash

echo "=================================================="
echo "  Rafa Hotspot - ONT Registration System"
echo "  Installation Script v1.0.0"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# GitHub Repository
REPO_URL="https://github.com/Rafa1611/registrasi-ont.git"
INSTALL_DIR="$HOME/rafa-hotspot-ont"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}Warning: Running as root. Installation will be at /root/rafa-hotspot-ont${NC}"
   echo -e "${YELLOW}Consider running as a normal user for better security.${NC}"
   echo ""
fi

echo -e "${GREEN}[1/9]${NC} Checking system requirements..."

# Check for required commands
command -v git >/dev/null 2>&1 || { echo -e "${RED}Error: Git is required but not installed. Install: sudo apt install git${NC}" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js is required but not installed. Install: sudo apt install nodejs${NC}" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Error: Python 3 is required but not installed. Install: sudo apt install python3${NC}" >&2; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo -e "${RED}Error: pip3 is required but not installed. Install: sudo apt install python3-pip${NC}" >&2; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo -e "${RED}Error: Yarn is required but not installed. Install: sudo npm install -g yarn${NC}" >&2; exit 1; }
command -v mongod >/dev/null 2>&1 || { echo -e "${YELLOW}Warning: MongoDB not found. Please install MongoDB: sudo apt install mongodb${NC}"; }

echo -e "${GREEN}✓${NC} System requirements check passed"
echo ""

echo -e "${GREEN}[2/9]${NC} Cloning repository from GitHub..."
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}!${NC} Directory $INSTALL_DIR already exists."
    read -p "Do you want to remove it and reinstall? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
        echo -e "${GREEN}✓${NC} Old installation removed"
    else
        echo -e "${RED}Installation cancelled.${NC}"
        exit 1
    fi
fi

git clone "$REPO_URL" "$INSTALL_DIR"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to clone repository${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Repository cloned successfully"
echo ""

echo -e "${GREEN}[3/9]${NC} Installing backend dependencies..."
cd "$INSTALL_DIR/backend"
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install Python dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend dependencies installed"
echo ""

echo -e "${GREEN}[4/9]${NC} Installing frontend dependencies..."
cd "$INSTALL_DIR/frontend"
yarn install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install frontend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend dependencies installed"
echo ""

echo -e "${GREEN}[5/9]${NC} Setting up environment files..."

# Backend .env
if [ ! -f "$INSTALL_DIR/backend/.env" ]; then
    cat > "$INSTALL_DIR/backend/.env" << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=rafa_hotspot_ont
JWT_SECRET_KEY=your-secret-key-change-in-production-2024
HOST=0.0.0.0
PORT=8001
EOF
    echo -e "${GREEN}✓${NC} Created backend/.env"
else
    echo -e "${YELLOW}!${NC} backend/.env already exists, skipping..."
fi

# Frontend .env
if [ ! -f "$INSTALL_DIR/frontend/.env" ]; then
    cat > "$INSTALL_DIR/frontend/.env" << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    echo -e "${GREEN}✓${NC} Created frontend/.env"
else
    echo -e "${YELLOW}!${NC} frontend/.env already exists, skipping..."
fi

echo ""

echo -e "${GREEN}[6/9]${NC} Setting up MongoDB..."
# Check if MongoDB is running
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB is already running"
else
    echo -e "${YELLOW}!${NC} MongoDB is not running. Attempting to start..."
    sudo systemctl start mongod 2>/dev/null || sudo service mongod start 2>/dev/null
    sleep 2
    if pgrep -x "mongod" > /dev/null; then
        echo -e "${GREEN}✓${NC} MongoDB started successfully"
    else
        echo -e "${YELLOW}!${NC} Could not start MongoDB automatically. Please start it manually:"
        echo "  sudo systemctl start mongod"
        echo "  OR"
        echo "  sudo service mongod start"
    fi
fi
echo ""

echo -e "${GREEN}[7/9]${NC} Creating initial admin user..."
cd "$INSTALL_DIR/backend"
python3 create_admin.py
echo ""

echo -e "${GREEN}[8/9]${NC} Building frontend..."
cd "$INSTALL_DIR/frontend"
yarn build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build frontend${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend built successfully"
echo ""

echo -e "${GREEN}[9/9]${NC} Setting up systemd services..."

# Create backend service
sudo tee /etc/systemd/system/rafa-hotspot-backend.service > /dev/null << EOF
[Unit]
Description=Rafa Hotspot Backend Service
After=network.target mongodb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create frontend service (using serve to serve built files)
sudo tee /etc/systemd/system/rafa-hotspot-frontend.service > /dev/null << EOF
[Unit]
Description=Rafa Hotspot Frontend Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/frontend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/yarn start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
sudo systemctl daemon-reload
sudo systemctl enable rafa-hotspot-backend.service
sudo systemctl enable rafa-hotspot-frontend.service

echo -e "${GREEN}✓${NC} Systemd services created and enabled"
echo ""

echo "=================================================="
echo -e "${GREEN}  Installation Complete!${NC}"
echo "=================================================="
echo ""
echo "📂 Installation Directory: $INSTALL_DIR"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure your environment (optional):"
echo "   • Edit: $INSTALL_DIR/backend/.env (MongoDB URL, JWT Secret)"
echo "   • Edit: $INSTALL_DIR/frontend/.env (Backend URL for production)"
echo ""
echo "2. Start the services:"
echo "   sudo systemctl start rafa-hotspot-backend"
echo "   sudo systemctl start rafa-hotspot-frontend"
echo ""
echo "3. Check service status:"
echo "   sudo systemctl status rafa-hotspot-backend"
echo "   sudo systemctl status rafa-hotspot-frontend"
echo ""
echo "4. Access the application:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:8001/api"
echo ""
echo "5. Login with default credentials:"
echo "   • Username: admin"
echo "   • Password: admin123"
echo "   ⚠️  IMPORTANT: Change this password after first login!"
echo ""
echo "📖 Documentation: $INSTALL_DIR/README.md"
echo "🔧 Logs:"
echo "   • Backend: sudo journalctl -u rafa-hotspot-backend -f"
echo "   • Frontend: sudo journalctl -u rafa-hotspot-frontend -f"
echo ""
echo "🛠️  Troubleshooting:"
echo "   • Restart services: sudo systemctl restart rafa-hotspot-backend rafa-hotspot-frontend"
echo "   • Stop services: sudo systemctl stop rafa-hotspot-backend rafa-hotspot-frontend"
echo ""
echo "=================================================="
