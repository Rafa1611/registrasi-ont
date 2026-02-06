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

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Error: Please run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${GREEN}[1/8]${NC} Checking system requirements..."

# Check for required commands
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Error: Python 3 is required but not installed.${NC}" >&2; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo -e "${RED}Error: pip3 is required but not installed.${NC}" >&2; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo -e "${RED}Error: Yarn is required but not installed.${NC}" >&2; exit 1; }
command -v mongod >/dev/null 2>&1 || { echo -e "${YELLOW}Warning: MongoDB not found. Please install MongoDB separately.${NC}"; }

echo -e "${GREEN}✓${NC} System requirements check passed"
echo ""

echo -e "${GREEN}[2/8]${NC} Installing backend dependencies..."
cd /app/backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install Python dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend dependencies installed"
echo ""

echo -e "${GREEN}[3/8]${NC} Installing frontend dependencies..."
cd /app/frontend
yarn install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install frontend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend dependencies installed"
echo ""

echo -e "${GREEN}[4/8]${NC} Setting up environment files..."

# Backend .env
if [ ! -f /app/backend/.env ]; then
    cat > /app/backend/.env << 'EOF'
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=rafa_hotspot_ont

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET_KEY=your-secret-key-change-in-production-2024

# Server Configuration
HOST=0.0.0.0
PORT=8001
EOF
    echo -e "${GREEN}✓${NC} Created backend/.env"
else
    echo -e "${YELLOW}!${NC} backend/.env already exists, skipping..."
fi

# Frontend .env
if [ ! -f /app/frontend/.env ]; then
    cat > /app/frontend/.env << 'EOF'
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    echo -e "${GREEN}✓${NC} Created frontend/.env"
else
    echo -e "${YELLOW}!${NC} frontend/.env already exists, skipping..."
fi

echo ""

echo -e "${GREEN}[5/8]${NC} Setting up MongoDB..."
# Check if MongoDB is running
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB is already running"
else
    echo -e "${YELLOW}!${NC} MongoDB is not running. Please start MongoDB manually:"
    echo "  sudo systemctl start mongod"
    echo "  OR"
    echo "  sudo service mongod start"
fi
echo ""

echo -e "${GREEN}[6/8]${NC} Creating initial admin user..."
cd /app/backend
python3 create_admin.py
echo ""

echo -e "${GREEN}[7/8]${NC} Building frontend..."
cd /app/frontend
yarn build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build frontend${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend built successfully"
echo ""

echo -e "${GREEN}[8/8]${NC} Setting up systemd services..."

# Create backend service
cat > /etc/systemd/system/rafa-hotspot-backend.service << 'EOF'
[Unit]
Description=Rafa Hotspot Backend Service
After=network.target mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=/app/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create frontend service
cat > /etc/systemd/system/rafa-hotspot-frontend.service << 'EOF'
[Unit]
Description=Rafa Hotspot Frontend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/app/frontend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/yarn start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
systemctl daemon-reload
systemctl enable rafa-hotspot-backend.service
systemctl enable rafa-hotspot-frontend.service

echo -e "${GREEN}✓${NC} Systemd services created and enabled"
echo ""

echo "=================================================="
echo -e "${GREEN}  Installation Complete!${NC}"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure your environment variables:"
echo "   • Edit: /app/backend/.env (MongoDB URL, JWT Secret)"
echo "   • Edit: /app/frontend/.env (Backend URL for production)"
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
echo "📖 Documentation: /app/README.md"
echo "🔧 Logs:"
echo "   • Backend: sudo journalctl -u rafa-hotspot-backend -f"
echo "   • Frontend: sudo journalctl -u rafa-hotspot-frontend -f"
echo ""
echo "=================================================="
