import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_admin_user(email: str):
    """Make a user admin by their email address"""
    try:
        user = await db.users.find_one({"email": email})
        
        if not user:
            print(f"Error: No user found with email {email}")
            print("\nThe user must first login via Google OAuth before being made admin.")
            return False
        
        if user.get('role') == 'admin':
            print(f"User {email} is already an admin!")
            return True
        
        result = await db.users.update_one(
            {"email": email},
            {"$set": {"role": "admin"}}
        )
        
        if result.modified_count > 0:
            print(f"\n✅ Successfully made {email} an admin!")
            print(f"   User ID: {user['user_id']}")
            print(f"   Name: {user['name']}")
            return True
        else:
            print(f"Error: Failed to update user {email}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        client.close()

async def list_users():
    """List all users in the database"""
    try:
        users = await db.users.find({}, {"_id": 0}).to_list(1000)
        
        if not users:
            print("No users found in database.")
            print("\nUsers must first login via Google OAuth to be registered.")
            return
        
        print("\n=== All Users ===")
        for user in users:
            role_badge = "[ADMIN]" if user.get('role') == 'admin' else "[USER]"
            print(f"\n{role_badge} {user['name']}")
            print(f"  Email: {user['email']}")
            print(f"  User ID: {user['user_id']}")
            print(f"  Role: {user.get('role', 'user')}")
        print(f"\nTotal users: {len(users)}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\n=== Admin User Manager ===")
        print("\nUsage:")
        print("  python create_admin.py <email>           - Make user an admin")
        print("  python create_admin.py list              - List all users")
        print("\nExample:")
        print("  python create_admin.py priiyankasingh87@gmail.com")
        print("\nNote: User must login via Google OAuth first before being made admin.\n")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command.lower() == "list":
        asyncio.run(list_users())
    else:
        email = command
        asyncio.run(create_admin_user(email))