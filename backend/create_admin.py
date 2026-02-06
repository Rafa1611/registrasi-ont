#!/usr/bin/env python3
"""
Script to create initial admin user
Run this script once to create the first admin account
"""
import asyncio
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import bcrypt
from datetime import datetime, timezone
import uuid

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin_user():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if admin user already exists
    existing_admin = await db.users.find_one({"username": "admin"})
    if existing_admin:
        print("❌ Admin user already exists!")
        print(f"   Username: {existing_admin['username']}")
        print(f"   Full Name: {existing_admin['full_name']}")
        return
    
    # Create admin user
    admin_password = "admin123"  # Change this in production!
    password_hash = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "password_hash": password_hash,
        "full_name": "Administrator",
        "role": "admin",
        "permissions": {
            "devices": True,
            "configuration": True,
            "ont_management_view": True,
            "ont_management_register": True,
            "ont_management_edit": True,
            "ont_management_delete": True,
            "terminal": True,
            "user_management": True
        },
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "system"
    }
    
    await db.users.insert_one(admin_user)
    
    print("✅ Admin user created successfully!")
    print(f"   Username: admin")
    print(f"   Password: {admin_password}")
    print(f"   ⚠️  IMPORTANT: Change this password after first login!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())
