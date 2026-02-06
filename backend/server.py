from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import configparser
import asyncio
import telnetlib3
import json
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Huawei OLT Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# ==================== MODELS ====================

class OLTDevice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    ip_address: str
    port: int = 23
    username: str
    password: str
    identifier: str = ""
    is_connected: bool = False
    last_connected: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OLTDeviceCreate(BaseModel):
    name: str
    ip_address: str
    port: int = 23
    username: str
    password: str
    identifier: str = ""

class OLTConfiguration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    
    # Basic Configuration
    frame: int = 0
    board: int = 1
    port: int = 3
    service_board: str = "0/1"
    
    # Templates
    g_line_template: int = 1
    g_service_template: int = 1
    e_line_template: int = 2
    e_service_template: int = 2
    
    # VLAN Configuration
    service_outer_vlan: int = 41
    service_inner_vlan: int = 41
    vod_outer_vlan: int = 42
    vod_inner_vlan: int = 42
    multicast_vlan: int = 69
    
    # Increment/Decrement
    increment_value: int = 100
    decrement_value: int = 100
    
    # Registration
    start_number: int = 0
    registration_rule: str = "0-(B)-(P)-(O)"
    gemport: str = "1,2,3"
    period: float = 1.0
    
    # Advanced Settings
    enable_log: bool = True
    auto_reconnect: bool = True
    special_system_support: bool = False
    auto_registration: bool = True
    enable_iptv: bool = False
    auto_migration: bool = True
    
    # Command Templates
    gpon_default: str = ""
    gpon_service_flow: str = ""
    epon_default: str = ""
    epon_service_flow: str = ""
    btv_service: str = ""
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OLTConfigurationCreate(BaseModel):
    device_id: str
    frame: int = 0
    board: int = 1
    port: int = 3
    service_board: str = "0/1"
    g_line_template: int = 1
    g_service_template: int = 1
    e_line_template: int = 2
    e_service_template: int = 2
    service_outer_vlan: int = 41
    service_inner_vlan: int = 41
    vod_outer_vlan: int = 42
    vod_inner_vlan: int = 42
    multicast_vlan: int = 69
    increment_value: int = 100
    decrement_value: int = 100
    start_number: int = 0
    registration_rule: str = "0-(B)-(P)-(O)"
    gemport: str = "1,2,3"
    period: float = 1.0
    enable_log: bool = True
    auto_reconnect: bool = True
    special_system_support: bool = False
    auto_registration: bool = True
    enable_iptv: bool = False
    auto_migration: bool = True
    gpon_default: str = ""
    gpon_service_flow: str = ""
    epon_default: str = ""
    epon_service_flow: str = ""
    btv_service: str = ""

class ONTDevice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    olt_device_id: str
    ont_id: int
    serial_number: str
    registration_code: str
    status: str = "registered"  # registered, online, offline
    frame: int
    board: int
    port: int
    vlan: str = "41"  # Support comma-separated VLANs
    line_profile_id: int = 1
    service_profile_id: int = 1
    dba_profile_id: int = 1  # DBA Profile ID
    gemport: str = "1"
    description: str = ""
    service_port_index: int = 0  # Starting service-port index
    registered_by: str = ""  # Username of person who registered
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ONTDeviceCreate(BaseModel):
    olt_device_id: str
    ont_id: int
    serial_number: str
    frame: int
    board: int
    port: int
    vlan: str = "41"  # Support comma-separated VLANs
    line_profile_id: int = 1
    service_profile_id: int = 1
    dba_profile_id: int = 1  # DBA Profile ID
    gemport: str = "1"
    description: str = ""
    service_port_index: int = -1  # -1 = auto-generate

# ==================== USER & AUTH MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    full_name: str
    role: str  # "admin" or "operator"
    permissions: Dict[str, bool] = {
        "devices": False,
        "configuration": False,
        "ont_management_view": False,
        "ont_management_register": False,
        "ont_management_edit": False,
        "ont_management_delete": False,
        "terminal": False,
        "user_management": False
    }
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    permissions: Optional[Dict[str, bool]] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    permissions: Dict[str, bool]
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ==================== EXISTING MODELS ====================

class CommandLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    command: str
    response: str
    status: str  # success, error
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TelnetCommand(BaseModel):
    device_id: str
    command: str

class ConfigFileUpload(BaseModel):
    device_id: str
    config_content: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return User(**user)

async def require_permission(permission: str):
    """Dependency to check if user has specific permission"""
    async def permission_checker(current_user: User = Depends(get_current_user)):
        if current_user.role == "admin":
            return current_user  # Admins have all permissions
        if not current_user.permissions.get(permission, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}"
            )
        return current_user
    return permission_checker

# ==================== TELNET CONNECTION ====================

class TelnetConnection:
    def __init__(self):
        self.connections: Dict[str, Any] = {}
    
    async def connect(self, device_id: str, host: str, port: int, username: str, password: str):
        try:
            reader, writer = await telnetlib3.open_connection(host, port, connect_minwait=2.0)
            
            # Wait for login prompt
            await asyncio.sleep(1)
            output = await asyncio.wait_for(reader.read(1024), timeout=5.0)
            
            # Send username
            writer.write(username + '\n')
            await asyncio.sleep(0.5)
            
            # Wait for password prompt
            output = await asyncio.wait_for(reader.read(1024), timeout=5.0)
            
            # Send password
            writer.write(password + '\n')
            await asyncio.sleep(1)
            
            # Read welcome message
            output = await asyncio.wait_for(reader.read(2048), timeout=5.0)
            
            self.connections[device_id] = {'reader': reader, 'writer': writer}
            
            # Update device connection status
            await db.olt_devices.update_one(
                {"id": device_id},
                {"$set": {"is_connected": True, "last_connected": datetime.now(timezone.utc).isoformat()}}
            )
            
            return True, "Connected successfully"
        except Exception as e:
            return False, str(e)
    
    async def disconnect(self, device_id: str):
        if device_id in self.connections:
            writer = self.connections[device_id]['writer']
            writer.close()
            await writer.wait_closed()
            del self.connections[device_id]
            
            # Update device connection status
            await db.olt_devices.update_one(
                {"id": device_id},
                {"$set": {"is_connected": False}}
            )
    
    async def send_command(self, device_id: str, command: str):
        if device_id not in self.connections:
            return False, "Not connected", ""
        
        try:
            reader = self.connections[device_id]['reader']
            writer = self.connections[device_id]['writer']
            
            # Send command
            writer.write(command + '\n')
            await asyncio.sleep(0.5)
            
            # Read response
            response = ""
            try:
                output = await asyncio.wait_for(reader.read(4096), timeout=10.0)
                response = output
            except asyncio.TimeoutError:
                response = "Command executed (timeout waiting for response)"
            
            return True, "success", response
        except Exception as e:
            return False, "error", str(e)
    
    def is_connected(self, device_id: str):
        return device_id in self.connections

telnet_manager = TelnetConnection()

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Huawei OLT Management System API", "version": "1.0.0"}

# ==================== AUTHENTICATION ====================

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login endpoint"""
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user['username']})
    
    # Prepare user response
    user_response = UserResponse(
        id=user['id'],
        username=user['username'],
        full_name=user['full_name'],
        role=user['role'],
        permissions=user.get('permissions', {}),
        is_active=user.get('is_active', True),
        created_at=user['created_at']
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        permissions=current_user.permissions,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@api_router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint (client should discard token)"""
    return {"message": "Logged out successfully"}

# ==================== USER MANAGEMENT (ADMIN ONLY) ====================

@api_router.post("/users", response_model=UserResponse)
async def create_user(
    input: UserCreate,
    current_user: User = Depends(require_permission("user_management"))
):
    """Create new user (admin only)"""
    # Check if username already exists
    existing = await db.users.find_one({"username": input.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Set default permissions based on role
    if input.role == "admin":
        permissions = {
            "devices": True,
            "configuration": True,
            "ont_management_view": True,
            "ont_management_register": True,
            "ont_management_edit": True,
            "ont_management_delete": True,
            "terminal": True,
            "user_management": True
        }
    else:  # operator
        permissions = {
            "devices": False,
            "configuration": False,
            "ont_management_view": True,
            "ont_management_register": True,
            "ont_management_edit": False,
            "ont_management_delete": False,
            "terminal": False,
            "user_management": False
        }
    
    # Override with custom permissions if provided
    if input.permissions:
        permissions.update(input.permissions)
    
    # Create user
    user_dict = {
        "id": str(uuid.uuid4()),
        "username": input.username,
        "password_hash": hash_password(input.password),
        "full_name": input.full_name,
        "role": input.role,
        "permissions": permissions,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.username
    }
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(
        id=user_dict['id'],
        username=user_dict['username'],
        full_name=user_dict['full_name'],
        role=user_dict['role'],
        permissions=user_dict['permissions'],
        is_active=user_dict['is_active'],
        created_at=user_dict['created_at']
    )

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(require_permission("user_management"))):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(require_permission("user_management"))
):
    """Get user by ID (admin only)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    input: UserCreate,
    current_user: User = Depends(require_permission("user_management"))
):
    """Update user (admin only)"""
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {
        "full_name": input.full_name,
        "role": input.role
    }
    
    # Update password if provided
    if input.password:
        update_data["password_hash"] = hash_password(input.password)
    
    # Update permissions
    if input.permissions:
        update_data["permissions"] = input.permissions
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return UserResponse(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_permission("user_management"))
):
    """Delete user (admin only)"""
    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# ==================== OLT DEVICES ====================

@api_router.post("/devices", response_model=OLTDevice)
async def create_device(input: OLTDeviceCreate):
    device_dict = input.model_dump()
    device_obj = OLTDevice(**device_dict)
    
    doc = device_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('last_connected'):
        doc['last_connected'] = doc['last_connected'].isoformat()
    
    await db.olt_devices.insert_one(doc)
    return device_obj

@api_router.get("/devices", response_model=List[OLTDevice])
async def get_devices():
    devices = await db.olt_devices.find({}, {"_id": 0}).to_list(1000)
    
    for device in devices:
        if isinstance(device.get('created_at'), str):
            device['created_at'] = datetime.fromisoformat(device['created_at'])
        if device.get('last_connected') and isinstance(device['last_connected'], str):
            device['last_connected'] = datetime.fromisoformat(device['last_connected'])
    
    return devices

@api_router.get("/devices/{device_id}", response_model=OLTDevice)
async def get_device(device_id: str):
    device = await db.olt_devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if isinstance(device.get('created_at'), str):
        device['created_at'] = datetime.fromisoformat(device['created_at'])
    if device.get('last_connected') and isinstance(device['last_connected'], str):
        device['last_connected'] = datetime.fromisoformat(device['last_connected'])
    
    return device

@api_router.put("/devices/{device_id}", response_model=OLTDevice)
async def update_device(device_id: str, input: OLTDeviceCreate):
    device = await db.olt_devices.find_one({"id": device_id})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    update_data = input.model_dump()
    await db.olt_devices.update_one({"id": device_id}, {"$set": update_data})
    
    updated_device = await db.olt_devices.find_one({"id": device_id}, {"_id": 0})
    if isinstance(updated_device.get('created_at'), str):
        updated_device['created_at'] = datetime.fromisoformat(updated_device['created_at'])
    if updated_device.get('last_connected') and isinstance(updated_device['last_connected'], str):
        updated_device['last_connected'] = datetime.fromisoformat(updated_device['last_connected'])
    
    return updated_device

@api_router.delete("/devices/{device_id}")
async def delete_device(device_id: str):
    result = await db.olt_devices.delete_one({"id": device_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Also delete related configurations
    await db.olt_configurations.delete_many({"device_id": device_id})
    await db.ont_devices.delete_many({"olt_device_id": device_id})
    await db.command_logs.delete_many({"device_id": device_id})
    
    return {"message": "Device deleted successfully"}

# ==================== TELNET CONNECTION ====================

@api_router.post("/devices/{device_id}/connect")
async def connect_device(device_id: str):
    device = await db.olt_devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    success, message = await telnet_manager.connect(
        device_id,
        device['ip_address'],
        device['port'],
        device['username'],
        device['password']
    )
    
    if success:
        await manager.broadcast(json.dumps({
            "type": "connection",
            "device_id": device_id,
            "status": "connected",
            "message": message
        }))
    
    return {"success": success, "message": message}

@api_router.post("/devices/{device_id}/disconnect")
async def disconnect_device(device_id: str):
    await telnet_manager.disconnect(device_id)
    
    await manager.broadcast(json.dumps({
        "type": "connection",
        "device_id": device_id,
        "status": "disconnected"
    }))
    
    return {"message": "Disconnected successfully"}

@api_router.get("/devices/{device_id}/status")
async def get_connection_status(device_id: str):
    is_connected = telnet_manager.is_connected(device_id)
    return {"device_id": device_id, "is_connected": is_connected}

@api_router.post("/devices/command")
async def send_command(input: TelnetCommand):
    success, status, response = await telnet_manager.send_command(input.device_id, input.command)
    
    # Log command
    log_dict = {
        "id": str(uuid.uuid4()),
        "device_id": input.device_id,
        "command": input.command,
        "response": response,
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.command_logs.insert_one(log_dict)
    
    # Broadcast to WebSocket
    await manager.broadcast(json.dumps({
        "type": "command",
        "device_id": input.device_id,
        "command": input.command,
        "response": response,
        "status": status
    }))
    
    return {"success": success, "status": status, "response": response}

# ==================== CONFIGURATIONS ====================

@api_router.post("/configurations", response_model=OLTConfiguration)
async def create_configuration(input: OLTConfigurationCreate):
    config_dict = input.model_dump()
    config_obj = OLTConfiguration(**config_dict)
    
    doc = config_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.olt_configurations.insert_one(doc)
    return config_obj

@api_router.get("/configurations", response_model=List[OLTConfiguration])
async def get_configurations():
    configs = await db.olt_configurations.find({}, {"_id": 0}).to_list(1000)
    
    for config in configs:
        if isinstance(config.get('created_at'), str):
            config['created_at'] = datetime.fromisoformat(config['created_at'])
        if isinstance(config.get('updated_at'), str):
            config['updated_at'] = datetime.fromisoformat(config['updated_at'])
    
    return configs

@api_router.get("/configurations/device/{device_id}", response_model=OLTConfiguration)
async def get_configuration_by_device(device_id: str):
    config = await db.olt_configurations.find_one({"device_id": device_id}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if isinstance(config.get('created_at'), str):
        config['created_at'] = datetime.fromisoformat(config['created_at'])
    if isinstance(config.get('updated_at'), str):
        config['updated_at'] = datetime.fromisoformat(config['updated_at'])
    
    return config

@api_router.put("/configurations/{config_id}", response_model=OLTConfiguration)
async def update_configuration(config_id: str, input: OLTConfigurationCreate):
    config = await db.olt_configurations.find_one({"id": config_id})
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    update_data = input.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.olt_configurations.update_one({"id": config_id}, {"$set": update_data})
    
    updated_config = await db.olt_configurations.find_one({"id": config_id}, {"_id": 0})
    if isinstance(updated_config.get('created_at'), str):
        updated_config['created_at'] = datetime.fromisoformat(updated_config['created_at'])
    if isinstance(updated_config.get('updated_at'), str):
        updated_config['updated_at'] = datetime.fromisoformat(updated_config['updated_at'])
    
    return updated_config

@api_router.delete("/configurations/{config_id}")
async def delete_configuration(config_id: str):
    result = await db.olt_configurations.delete_one({"id": config_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return {"message": "Configuration deleted successfully"}

# ==================== ONT DEVICES ====================

@api_router.get("/ont/next-id/{device_id}")
async def get_next_ont_id(device_id: str, frame: int = 0, board: int = 1, port: int = 3):
    """
    Get next available ONT ID for a specific port.
    Returns the next sequential ONT ID that hasn't been used.
    """
    # Find all ONTs on this specific port
    existing_onts = await db.ont_devices.find({
        "olt_device_id": device_id,
        "frame": frame,
        "board": board,
        "port": port
    }, {"_id": 0, "ont_id": 1}).to_list(1000)
    
    if not existing_onts:
        # No ONTs yet, start from 0
        return {"next_ont_id": 0, "available_ids": list(range(0, 128))}
    
    # Get list of used ONT IDs
    used_ids = sorted([ont["ont_id"] for ont in existing_onts])
    
    # Find first available ID (starting from 0)
    next_id = 0
    for used_id in used_ids:
        if next_id == used_id:
            next_id += 1
        else:
            break
    
    # Get list of all available IDs
    all_ids = set(range(0, 128))  # GPON max
    used_ids_set = set(used_ids)
    available_ids = sorted(list(all_ids - used_ids_set))
    
    return {
        "next_ont_id": next_id,
        "used_count": len(used_ids),
        "available_count": len(available_ids),
        "available_ids": available_ids[:10]  # Return first 10 available
    }

@api_router.post("/ont", response_model=ONTDevice)
async def create_ont(input: ONTDeviceCreate, current_user: User = Depends(require_permission("ont_management_register"))):
    # Generate registration code
    device = await db.olt_devices.find_one({"id": input.olt_device_id})
    if not device:
        raise HTTPException(status_code=404, detail="OLT Device not found")
    
    config = await db.olt_configurations.find_one({"device_id": input.olt_device_id})
    
    # Auto-increment ONT ID if set to -1 (auto mode)
    ont_id = input.ont_id
    if ont_id == -1:
        # Get next available ONT ID
        next_id_data = await get_next_ont_id(
            input.olt_device_id, 
            input.frame, 
            input.board, 
            input.port
        )
        ont_id = next_id_data["next_ont_id"]
    
    registration_rule = config.get('registration_rule', '0-(B)-(P)-(O)') if config else '0-(B)-(P)-(O)'
    registration_code = registration_rule.replace('(B)', str(input.board)).replace('(P)', str(input.port)).replace('(O)', str(ont_id))
    
    ont_dict = input.model_dump()
    ont_dict['ont_id'] = ont_id  # Use auto-generated or provided ID
    ont_dict['registration_code'] = registration_code
    ont_dict['registered_by'] = current_user.full_name  # Auto-fill from logged user
    ont_obj = ONTDevice(**ont_dict)
    
    doc = ont_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.ont_devices.insert_one(doc)
    
    # Execute registration command if connected
    generated_commands = []
    if telnet_manager.is_connected(input.olt_device_id):
        try:
            cmd = f"ont add {input.frame}/{input.board}/{input.port} {ont_id} sn-auth \"{input.serial_number}\" omci ont-lineprofile-id {input.line_profile_id} ont-srvprofile-id {input.service_profile_id}"
            if input.description:
                cmd += f" desc \"{input.description}\""
            generated_commands.append(cmd)
            print(f"\n{'='*80}")
            print(f"📋 COMMAND 1 - ONT Registration:")
            print(f"{'='*80}")
            print(cmd)
            await telnet_manager.send_command(input.olt_device_id, cmd)
            
            # Note: DBA Profile sudah included dalam Line Profile
            # Tidak perlu execute "ont dba-profile" terpisah
            
            # Get service-port index
            if input.service_port_index == -1:
                # Auto-generate: count existing service ports
                existing_ports = await db.ont_devices.count_documents({})
                service_port_index = existing_ports + 1
            else:
                service_port_index = input.service_port_index
            
            # Save service_port_index to ONT record
            ont_dict['service_port_index'] = service_port_index
            
            # Parse VLANs (support comma-separated)
            vlans = [v.strip() for v in input.vlan.split(',')]
            gemports = [g.strip() for g in input.gemport.split(',')]
            
            # If single VLAN but multiple gemports, use same VLAN for all
            if len(vlans) == 1 and len(gemports) > 1:
                vlans = vlans * len(gemports)
            
            # Create service ports with VLAN mapping
            print(f"\n{'='*80}")
            print(f"📋 COMMAND 2+ - Service Port Configuration:")
            print(f"{'='*80}")
            for idx, gp in enumerate(gemports):
                sp_idx = service_port_index + idx
                vlan_id = vlans[idx] if idx < len(vlans) else vlans[0]
                
                sp_cmd = f"service-port {sp_idx} vlan {vlan_id} gpon {input.frame}/{input.board}/{input.port} ont {ont_id} gemport {gp} multi-service user-vlan {vlan_id} tag-transform translate"
                generated_commands.append(sp_cmd)
                print(f"Command {idx + 2}: {sp_cmd}")
                await telnet_manager.send_command(input.olt_device_id, sp_cmd)
            print(f"{'='*80}\n")
        except Exception as e:
            print(f"Registration command failed: {e}")
    
    return ont_obj

@api_router.get("/ont", response_model=List[ONTDevice])
async def get_ont_devices():
    onts = await db.ont_devices.find({}, {"_id": 0}).to_list(1000)
    
    for ont in onts:
        if isinstance(ont.get('created_at'), str):
            ont['created_at'] = datetime.fromisoformat(ont['created_at'])
    
    return onts

@api_router.get("/ont/device/{device_id}", response_model=List[ONTDevice])
async def get_ont_by_device(device_id: str):
    onts = await db.ont_devices.find({"olt_device_id": device_id}, {"_id": 0}).to_list(1000)
    
    for ont in onts:
        if isinstance(ont.get('created_at'), str):
            ont['created_at'] = datetime.fromisoformat(ont['created_at'])
    
    return onts

@api_router.delete("/ont/{ont_id}")
async def delete_ont(ont_id: str):
    result = await db.ont_devices.delete_one({"id": ont_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="ONT not found")
    return {"message": "ONT deleted successfully"}

# ==================== AUTO-DETECT ONT ====================

class DetectedONT(BaseModel):
    serial_number: str
    frame: int
    board: int
    port: int
    ont_id: int
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/ont/detect/{device_id}")
async def detect_unauthorized_onts(device_id: str):
    """
    Detect unauthorized ONTs that are connected but not registered yet.
    This sends 'display ont autofind all' command to OLT.
    """
    device = await db.olt_devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if not telnet_manager.is_connected(device_id):
        raise HTTPException(status_code=400, detail="Device not connected")
    
    try:
        # Send command to detect unauthorized ONTs
        success, status, response = await telnet_manager.send_command(
            device_id, 
            "display ont autofind all"
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to detect ONTs")
        
        # Parse response to extract ONT information
        # This is a simplified parser - actual parsing depends on OLT response format
        detected_onts = []
        lines = response.split('\n')
        
        for line in lines:
            # Example line format: "0/1/3      1    HWTC12345678    ..."
            # This parsing logic should be adjusted based on actual OLT response
            parts = line.strip().split()
            if len(parts) >= 3 and '/' in parts[0]:
                try:
                    fsp = parts[0].split('/')  # Frame/Slot/Port
                    if len(fsp) == 3:
                        detected_onts.append({
                            "serial_number": parts[2] if len(parts) > 2 else "UNKNOWN",
                            "frame": int(fsp[0]),
                            "board": int(fsp[1]),
                            "port": int(fsp[2]),
                            "ont_id": int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0,
                            "detected_at": datetime.now(timezone.utc).isoformat()
                        })
                except (ValueError, IndexError):
                    continue
        
        return {
            "success": True,
            "device_id": device_id,
            "detected_count": len(detected_onts),
            "onts": detected_onts,
            "raw_response": response
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting ONTs: {str(e)}")

@api_router.post("/ont/simulate-detect/{device_id}")
async def simulate_detect_onts(device_id: str):
    """
    DEMO/TESTING: Simulate detecting unauthorized ONTs.
    Returns fake ONT data for demonstration purposes.
    """
    device = await db.olt_devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Generate 3-5 fake detected ONTs
    import random
    num_onts = random.randint(3, 5)
    
    detected_onts = []
    base_serial = "HWTC"
    
    for i in range(num_onts):
        serial_suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
        detected_onts.append({
            "serial_number": f"{base_serial}{serial_suffix}",
            "frame": 0,
            "board": 1,
            "port": random.choice([1, 2, 3, 4, 5]),
            "ont_id": i,
            "detected_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {
        "success": True,
        "device_id": device_id,
        "detected_count": len(detected_onts),
        "onts": detected_onts,
        "simulation": True,
        "message": "⚠️ SIMULASI - Data ONT ini hanya untuk demo/testing"
    }

@api_router.post("/ont/auto-register/{device_id}")
async def auto_register_detected_ont(device_id: str, ont_data: Dict[str, Any], current_user: User = Depends(require_permission("ont_management_register"))):
    """
    Auto-register a detected ONT.
    Takes detected ONT info and registers it in the system.
    """
    device = await db.olt_devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    config = await db.olt_configurations.find_one({"device_id": device_id})
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found for device")
    
    # Generate registration code
    registration_rule = config.get('registration_rule', '0-(B)-(P)-(O)')
    registration_code = registration_rule.replace('(B)', str(ont_data['board'])).replace('(P)', str(ont_data['port'])).replace('(O)', str(ont_data['ont_id']))
    
    # Get service VLAN from config
    vlan = config.get('service_inner_vlan', 41)
    
    # Create ONT entry
    ont_dict = {
        "olt_device_id": device_id,
        "ont_id": ont_data['ont_id'],
        "serial_number": ont_data['serial_number'],
        "frame": ont_data['frame'],
        "board": ont_data['board'],
        "port": ont_data['port'],
        "vlan": ont_data.get('vlan', str(vlan)),
        "line_profile_id": ont_data.get('line_profile_id', 1),
        "service_profile_id": ont_data.get('service_profile_id', 1),
        "gemport": ont_data.get('gemport', '1'),
        "description": ont_data.get('description', ''),
        "registration_code": registration_code,
        "registered_by": current_user.full_name  # Auto-fill from logged user
    }
    
    ont_obj = ONTDevice(**ont_dict)
    
    doc = ont_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    # Check if ONT already exists
    existing = await db.ont_devices.find_one({
        "olt_device_id": device_id,
        "serial_number": ont_data['serial_number']
    })
    
    if existing:
        return {
            "success": False,
            "message": "ONT already registered",
            "ont": existing
        }
    
    await db.ont_devices.insert_one(doc)
    
    # If device is connected, execute registration command on OLT
    if telnet_manager.is_connected(device_id) and config.get('auto_registration', True):
        try:
            # Build registration command based on config
            line_template = config.get('g_line_template', 1)
            service_template = config.get('g_service_template', 1)
            
            register_cmd = f"ont add {ont_data['frame']}/{ont_data['board']}/{ont_data['port']} {ont_data['ont_id']} sn-auth \\\"{ont_data['serial_number']}\\\" omci ont-lineprofile-id {line_template} ont-srvprofile-id {service_template}"
            
            success, status, response = await telnet_manager.send_command(device_id, register_cmd)
            
            # Log the command
            log_dict = {
                "id": str(uuid.uuid4()),
                "device_id": device_id,
                "command": register_cmd,
                "response": response,
                "status": status,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await db.command_logs.insert_one(log_dict)
            
        except Exception as e:
            print(f"Warning: Failed to execute registration command: {e}")
    
    return {
        "success": True,
        "message": "ONT auto-registered successfully",
        "ont": ont_obj.model_dump()
    }

# ==================== COMMAND LOGS ====================

@api_router.get("/logs/{device_id}")
async def get_logs(device_id: str, limit: int = 100):
    logs = await db.command_logs.find({"device_id": device_id}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for log in logs:
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

@api_router.delete("/logs/{device_id}")
async def clear_logs(device_id: str):
    await db.command_logs.delete_many({"device_id": device_id})
    return {"message": "Logs cleared successfully"}

# ==================== CONFIG FILE IMPORT/EXPORT ====================

@api_router.post("/config/import")
async def import_config(input: ConfigFileUpload):
    try:
        # Parse INI content
        config = configparser.ConfigParser()
        config.read_string(input.config_content)
        
        # Extract OLT section
        if 'OLT' in config:
            olt_section = config['OLT']
            device_data = {
                "ip_address": olt_section.get('IP地址', olt_section.get('ip_address', '')),
                "port": int(olt_section.get('端口', olt_section.get('port', '23'))),
                "username": olt_section.get('帐号', olt_section.get('username', '')),
                "password": olt_section.get('密码', olt_section.get('password', '')),
            }
            
            await db.olt_devices.update_one(
                {"id": input.device_id},
                {"$set": device_data}
            )
        
        # Extract Basic section
        if '基本' in config or 'Basic' in config:
            basic_section = config.get('基本', config.get('Basic', {}))
            config_data = {
                "frame": int(basic_section.get('框', basic_section.get('frame', '0'))),
                "board": int(basic_section.get('板', basic_section.get('board', '1'))),
                "port": int(basic_section.get('端口', basic_section.get('port', '3'))),
                "service_board": basic_section.get('业务板', basic_section.get('service_board', '0/1')),
                "g_line_template": int(basic_section.get('G线路模板', basic_section.get('g_line_template', '1'))),
                "g_service_template": int(basic_section.get('G业务模板', basic_section.get('g_service_template', '1'))),
                "service_outer_vlan": int(basic_section.get('业务外层', basic_section.get('service_outer_vlan', '41'))),
                "service_inner_vlan": int(basic_section.get('业务内层', basic_section.get('service_inner_vlan', '41'))),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.olt_configurations.update_one(
                {"device_id": input.device_id},
                {"$set": config_data}
            )
        
        return {"success": True, "message": "Configuration imported successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import config: {str(e)}")

@api_router.get("/config/export/{device_id}")
async def export_config(device_id: str):
    device = await db.olt_devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    config = await db.olt_configurations.find_one({"device_id": device_id}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Generate INI format
    ini_config = configparser.ConfigParser()
    
    ini_config['OLT'] = {
        'ip_address': device['ip_address'],
        'port': str(device['port']),
        'username': device['username'],
        'password': device['password'],
        'identifier': device.get('identifier', ''),
        'enable_log': 'true' if config.get('enable_log', True) else 'false',
        'auto_reconnect': 'true' if config.get('auto_reconnect', True) else 'false',
        'auto_registration': 'true' if config.get('auto_registration', True) else 'false',
    }
    
    ini_config['Basic'] = {
        'frame': str(config.get('frame', 0)),
        'board': str(config.get('board', 1)),
        'port': str(config.get('port', 3)),
        'service_board': config.get('service_board', '0/1'),
        'g_line_template': str(config.get('g_line_template', 1)),
        'g_service_template': str(config.get('g_service_template', 1)),
        'service_outer_vlan': str(config.get('service_outer_vlan', 41)),
        'service_inner_vlan': str(config.get('service_inner_vlan', 41)),
        'vod_outer_vlan': str(config.get('vod_outer_vlan', 42)),
        'vod_inner_vlan': str(config.get('vod_inner_vlan', 42)),
        'multicast_vlan': str(config.get('multicast_vlan', 69)),
        'registration_rule': config.get('registration_rule', '0-(B)-(P)-(O)'),
        'gemport': config.get('gemport', '1,2,3'),
    }
    
    # Convert to string
    from io import StringIO
    output = StringIO()
    ini_config.write(output)
    config_content = output.getvalue()
    
    return {"config_content": config_content}

# ==================== WEBSOCKET ====================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now
            await websocket.send_text(f"Received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
