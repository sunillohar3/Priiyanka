from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    created_at: datetime

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: str
    name_en: str
    name_nl: str
    description_en: str
    description_nl: str
    price: float
    duration: int
    category: str
    image_url: Optional[str] = None
    created_at: datetime

class ServiceCreate(BaseModel):
    name_en: str
    name_nl: str
    description_en: str
    description_nl: str
    price: float
    duration: int
    category: str
    image_url: Optional[str] = None

class ServiceUpdate(BaseModel):
    name_en: Optional[str] = None
    name_nl: Optional[str] = None
    description_en: Optional[str] = None
    description_nl: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str
    user_id: str
    service_id: str
    booking_date: str
    booking_time: str
    status: str
    notes: Optional[str] = None
    created_at: datetime

class BookingCreate(BaseModel):
    service_id: str
    booking_date: str
    booking_time: str
    notes: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    user_id: str
    items: List[dict]
    total_amount: float
    status: str
    created_at: datetime

class OrderCreate(BaseModel):
    items: List[dict]
    total_amount: float

# ============ AUTH HELPER ============

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    """Get current user from session_token cookie or Authorization header"""
    token = session_token
    
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

async def require_admin(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    """Require admin role"""
    user = await get_current_user(request, session_token)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for user data and create session"""
    data = await request.json()
    session_id = data.get('session_id')
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient() as client:
        response_data = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if response_data.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        user_data = response_data.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": user_data['email']}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user['user_id']
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data['name'],
                "picture": user_data['picture']
            }}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": user_data['email'],
            "name": user_data['name'],
            "picture": user_data['picture'],
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = user_data['session_token']
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_result = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if isinstance(user_result['created_at'], str):
        user_result['created_at'] = datetime.fromisoformat(user_result['created_at'])
    
    return User(**user_result)

@api_router.get("/auth/me", response_model=User)
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get current user info"""
    return await get_current_user(request, session_token)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ SERVICES ENDPOINTS ============

@api_router.get("/services", response_model=List[Service])
async def get_services():
    """Get all services (public)"""
    services = await db.services.find({}, {"_id": 0}).to_list(1000)
    for service in services:
        if isinstance(service['created_at'], str):
            service['created_at'] = datetime.fromisoformat(service['created_at'])
    return services

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    """Get single service (public)"""
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if isinstance(service['created_at'], str):
        service['created_at'] = datetime.fromisoformat(service['created_at'])
    return Service(**service)

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create service (admin only)"""
    await require_admin(request, session_token)
    
    service_id = f"service_{uuid.uuid4().hex[:12]}"
    service_doc = {
        "service_id": service_id,
        **service_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.services.insert_one(service_doc)
    
    result = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    result['created_at'] = datetime.fromisoformat(result['created_at'])
    return Service(**result)

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update service (admin only)"""
    await require_admin(request, session_token)
    
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.services.update_one(
        {"service_id": service_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if isinstance(service['created_at'], str):
        service['created_at'] = datetime.fromisoformat(service['created_at'])
    return Service(**service)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete service (admin only)"""
    await require_admin(request, session_token)
    
    result = await db.services.delete_one({"service_id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted successfully"}

# ============ BOOKINGS ENDPOINTS ============

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get user bookings"""
    user = await get_current_user(request, session_token)
    
    if user.role == "admin":
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    else:
        bookings = await db.bookings.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    
    for booking in bookings:
        if isinstance(booking['created_at'], str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    return bookings

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create booking"""
    user = await get_current_user(request, session_token)
    
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking_doc = {
        "booking_id": booking_id,
        "user_id": user.user_id,
        **booking_data.model_dump(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)
    
    result = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    result['created_at'] = datetime.fromisoformat(result['created_at'])
    return Booking(**result)

@api_router.put("/bookings/{booking_id}")
async def update_booking_status(booking_id: str, status: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update booking status (admin only)"""
    await require_admin(request, session_token)
    
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking status updated"}

# ============ ORDERS ENDPOINTS ============

@api_router.get("/orders", response_model=List[Order])
async def get_orders(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get user orders"""
    user = await get_current_user(request, session_token)
    
    if user.role == "admin":
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    else:
        orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create order"""
    user = await get_current_user(request, session_token)
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    order_doc = {
        "order_id": order_id,
        "user_id": user.user_id,
        **order_data.model_dump(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    result = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    result['created_at'] = datetime.fromisoformat(result['created_at'])
    return Order(**result)

# ============ ADMIN - USERS ENDPOINT ============

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all users (admin only)"""
    await require_admin(request, session_token)
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update user role (admin only)"""
    await require_admin(request, session_token)
    
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated"}

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "Priiyanka's Nature Nest API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()