from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Request, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import urllib.parse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']

def normalize_mongo_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    if parsed.username or parsed.password:
        username = urllib.parse.quote_plus(urllib.parse.unquote_plus(parsed.username)) if parsed.username else None
        password = urllib.parse.quote_plus(urllib.parse.unquote_plus(parsed.password)) if parsed.password else None
        netloc = ''
        if username:
            netloc += username
        if password is not None:
            netloc += f':{password}'
        if parsed.hostname:
            netloc += f'@{parsed.hostname}'
        if parsed.port:
            netloc += f':{parsed.port}'
        return urllib.parse.urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
    return url

mongo_url = normalize_mongo_url(mongo_url)
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()

UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=str(UPLOADS_DIR)), name='uploads')

# CORS middleware for production
frontend_url = os.getenv('FRONTEND_URL', 'https://priiyankasnaturenest.nl')
allowed_origins = []

cors_origins = os.getenv('CORS_ORIGINS')
if cors_origins:
    allowed_origins = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]
else:
    # Default to local dev plus production frontend hostnames
    allowed_origins = [frontend_url, 'https://priiyankasnaturenest.nl', 'https://www.priiyankasnaturenest.nl']
    allowed_origins = [origin for origin in allowed_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cookie security configuration
secure_cookie_env = os.getenv('SECURE_COOKIES')
if secure_cookie_env is not None:
    USE_SECURE_COOKIES = secure_cookie_env.lower() == 'true'
else:
    USE_SECURE_COOKIES = any(origin.startswith('https://') for origin in allowed_origins)
COOKIE_SAMESITE = 'none' if USE_SECURE_COOKIES else 'lax'

logging.info(f'Allowed CORS origins: {allowed_origins}')
logging.info(f'Using secure cookies: {USE_SECURE_COOKIES} (SameSite={COOKIE_SAMESITE})')

# ============ EMAIL CONFIG ============
# Email is best-effort: if SMTP is not configured, sends are skipped (logged),
# and no request ever fails because of email.
SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
SMTP_FROM = os.getenv('SMTP_FROM') or SMTP_USER
# Where contact-form / new-booking notifications are sent (the practitioner):
ADMIN_NOTIFY_EMAIL = os.getenv('ADMIN_NOTIFY_EMAIL', 'priiyankasingh87@gmail.com')


def send_email(to_address: str, subject: str, body: str) -> None:
    """Send a plain-text email. Best-effort: never raises to the caller."""
    if not (SMTP_HOST and SMTP_FROM and to_address):
        logging.info(f"[email] Skipped (SMTP not configured or no recipient): {subject}")
        return
    try:
        msg = EmailMessage()
        msg['From'] = SMTP_FROM
        msg['To'] = to_address
        msg['Subject'] = subject
        msg.set_content(body)

        if SMTP_PORT == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=15) as server:
                if SMTP_USER and SMTP_PASSWORD:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.starttls(context=ssl.create_default_context())
                if SMTP_USER and SMTP_PASSWORD:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        logging.info(f"[email] Sent '{subject}' to {to_address}")
    except Exception as e:
        logging.error(f"[email] Failed to send '{subject}' to {to_address}: {e}")


api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    created_at: datetime

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    password: Optional[str] = None
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

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

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

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    name: str
    email: str
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    status: str = "new"
    created_at: datetime

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: str = Field(..., min_length=3, max_length=200)
    phone: Optional[str] = Field(None, max_length=40)
    subject: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)

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

@api_router.get("/auth/me", response_model=UserOut)
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get current user info"""
    user = await get_current_user(request, session_token)
    return UserOut(**user.model_dump())

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/login")
async def login(request: Request, response: Response, login_data: LoginRequest):
    """Login with email and password. Returns the user plus a session token
    (also set as an httpOnly cookie) so the client can use either cookie- or
    header-based auth."""
    user = await db.users.find_one({"email": login_data.email})
    if not user or not bcrypt.checkpw(login_data.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    session_data = UserSession(
        user_id=user['user_id'],
        session_token=session_token,
        expires_at=expires_at,
        created_at=datetime.now(timezone.utc)
    )

    await db.user_sessions.insert_one(session_data.dict())

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=USE_SECURE_COOKIES,
        samesite=COOKIE_SAMESITE,
        max_age=60*60*24*7  # 7 days
    )

    result = UserOut(**user).model_dump()
    result["session_token"] = session_token
    return result

@api_router.post("/auth/register")
async def register(request: Request, response: Response, register_data: RegisterRequest):
    """Register new user with email and password"""
    existing_user = await db.users.find_one({"email": register_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password
    hashed_password = bcrypt.hashpw(register_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user_id = str(uuid.uuid4())
    user_data = User(
        user_id=user_id,
        email=register_data.email,
        name=register_data.name,
        role="user",
        created_at=datetime.now(timezone.utc)
    )
    
    # Add password to user data
    user_dict = user_data.model_dump()
    user_dict['password'] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_data = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at,
        created_at=datetime.now(timezone.utc)
    )
    
    await db.user_sessions.insert_one(session_data.dict())
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=USE_SECURE_COOKIES,
        samesite=COOKIE_SAMESITE,
        max_age=60*60*24*7  # 7 days
    )

    result = UserOut(**user_data.model_dump()).model_dump()
    result["session_token"] = session_token
    return result

@api_router.post("/upload")
async def upload_image(request: Request, file: UploadFile = File(...), session_token: Optional[str] = Cookie(None)):
    """Upload a service image file and return its public URL."""
    await require_admin(request, session_token)

    allowed_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    upload_filename = Path(file.filename).name
    extension = Path(upload_filename).suffix.lower()
    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    dest_filename = f"{uuid.uuid4().hex}{extension}"
    dest_path = UPLOADS_DIR / dest_filename

    contents = await file.read()
    with open(dest_path, "wb") as buffer:
        buffer.write(contents)

    host_header = request.headers.get("host") or "localhost:8000"
    scheme = request.url.scheme
    image_url = f"{scheme}://{host_header}/uploads/{dest_filename}"
    return {"url": image_url}

@api_router.delete("/upload/{filename}")
async def delete_uploaded_image(filename: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete an uploaded service image file."""
    await require_admin(request, session_token)

    safe_filename = Path(filename).name
    file_path = UPLOADS_DIR / safe_filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    file_path.unlink()
    return {"deleted": True, "filename": safe_filename}

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
async def create_booking(booking_data: BookingCreate, request: Request, background_tasks: BackgroundTasks, session_token: Optional[str] = Cookie(None)):
    """Create booking (rejects a slot that is already taken)."""
    user = await get_current_user(request, session_token)

    # Prevent double-booking: same date + time not already reserved (unless cancelled).
    existing = await db.bookings.find_one({
        "booking_date": booking_data.booking_date,
        "booking_time": booking_data.booking_time,
        "status": {"$ne": "cancelled"}
    })
    if existing:
        raise HTTPException(
            status_code=409,
            detail="That time slot is already booked. Please choose another time."
        )

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

    # Notify practitioner + confirm to client (best-effort, off the request path).
    when = f"{booking_data.booking_date} at {booking_data.booking_time}"
    background_tasks.add_task(
        send_email,
        ADMIN_NOTIFY_EMAIL,
        "New booking request",
        f"New booking from {user.name} ({user.email}).\n"
        f"Service ID: {booking_data.service_id}\nWhen: {when}\n"
        f"Notes: {booking_data.notes or '-'}"
    )
    background_tasks.add_task(
        send_email,
        user.email,
        "Your appointment request - Priiyanka's Nature Nest",
        f"Dear {user.name},\n\nWe have received your appointment request for {when}.\n"
        f"We will confirm it shortly.\n\nWarm regards,\nPriiyanka's Nature Nest"
    )

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

@api_router.get("/admin/users", response_model=List[UserOut])
async def get_all_users(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all users (admin only). Uses UserOut so password hashes are never returned."""
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

# ============ CONTACT ENDPOINTS ============

@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(contact_data: ContactCreate, background_tasks: BackgroundTasks):
    """Submit a contact / inquiry message (public)."""
    email = contact_data.email.strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email address")

    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message_doc = {
        "message_id": message_id,
        **contact_data.model_dump(),
        "email": email,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contact_messages.insert_one(message_doc)

    result = await db.contact_messages.find_one({"message_id": message_id}, {"_id": 0})
    result['created_at'] = datetime.fromisoformat(result['created_at'])

    # Notify the practitioner of the new inquiry (best-effort).
    background_tasks.add_task(
        send_email,
        ADMIN_NOTIFY_EMAIL,
        f"New contact message: {contact_data.subject or '(no subject)'}",
        f"From: {contact_data.name} <{email}>\n"
        f"Phone: {contact_data.phone or '-'}\n\n{contact_data.message}"
    )

    return ContactMessage(**result)

@api_router.get("/admin/contact", response_model=List[ContactMessage])
async def get_contact_messages(request: Request, session_token: Optional[str] = Cookie(None)):
    """List contact messages, newest first (admin only)."""
    await require_admin(request, session_token)

    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for message in messages:
        if isinstance(message['created_at'], str):
            message['created_at'] = datetime.fromisoformat(message['created_at'])
    return messages

@api_router.put("/admin/contact/{message_id}")
async def update_contact_status(message_id: str, status: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update a contact message status (admin only)."""
    await require_admin(request, session_token)

    if status not in ["new", "read", "handled"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.contact_messages.update_one(
        {"message_id": message_id},
        {"$set": {"status": status}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")

    return {"message": "Message status updated"}

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "Priiyanka's Nature Nest API"}

@api_router.get("/db-status")
async def db_status():
    """Check MongoDB Atlas connectivity."""
    try:
        result = await db.command("ping")
        return {
            "status": "ok",
            "message": "MongoDB Atlas connected successfully",
            "ping": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB ping failed: {e}")

app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)