from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Request, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import smtplib
import ssl
import time
import threading
import http.client
from collections import defaultdict, deque
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
# Email is best-effort: if nothing is configured, sends are skipped (logged),
# and no request ever fails because of email.
#
# Preferred transport is an HTTPS email API (Brevo) because PaaS hosts such as
# Render block/route-fail outbound SMTP ("[Errno 101] Network is unreachable").
# Falls back to SMTP if only SMTP is configured (e.g. local/other hosts).
def _clean(value):
    """Trim surrounding whitespace/newlines from env values (a common paste bug)."""
    return value.strip() if isinstance(value, str) else value


BREVO_API_KEY = _clean(os.getenv('BREVO_API_KEY')) or None
SENDER_NAME = os.getenv('SENDER_NAME', "Priiyanka's Nature Nest")

SMTP_HOST = _clean(os.getenv('SMTP_HOST'))
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = _clean(os.getenv('SMTP_USER'))
SMTP_PASSWORD = _clean(os.getenv('SMTP_PASSWORD'))
# Sender address used for both transports (must be a verified sender in Brevo):
SMTP_FROM = _clean(os.getenv('SMTP_FROM') or os.getenv('SENDER_EMAIL') or SMTP_USER)
# Where contact-form / new-booking notifications are sent (the practitioner):
ADMIN_NOTIFY_EMAIL = _clean(os.getenv('ADMIN_NOTIFY_EMAIL', 'priiyankasingh87@gmail.com'))

# Shared secret guarding the reminders cron endpoint.
CRON_SECRET = _clean(os.getenv('CRON_SECRET'))

# Public site base URL (for links in emails). Reuses the CORS frontend_url.
SITE_URL = frontend_url

# Practitioner working hours per weekday (Mon=0 .. Sun=6), in minutes from midnight.
# Matches the Contact page: Mon-Fri 13:00-18:00, Sat 10:00-13:00, Sun closed.
WORKING_HOURS = {
    0: (13 * 60, 18 * 60),
    1: (13 * 60, 18 * 60),
    2: (13 * 60, 18 * 60),
    3: (13 * 60, 18 * 60),
    4: (13 * 60, 18 * 60),
    5: (10 * 60, 13 * 60),
}


def _send_via_brevo(to_address: str, subject: str, body: str) -> None:
    # Masked diagnostic so we can confirm the loaded key without exposing it.
    logging.info(
        f"[email] Brevo send via key '{(BREVO_API_KEY or '')[:8]}...' "
        f"(len={len(BREVO_API_KEY or '')}), from={SMTP_FROM}"
    )
    payload = json.dumps({
        "sender": {"name": SENDER_NAME, "email": SMTP_FROM},
        "to": [{"email": to_address}],
        "subject": subject,
        "textContent": body,
    }).encode("utf-8")
    # Use http.client so the 'api-key' header keeps its exact lowercase case
    # (urllib capitalizes header names, which some gateways reject).
    conn = http.client.HTTPSConnection("api.brevo.com", timeout=15)
    try:
        conn.request("POST", "/v3/smtp/email", body=payload, headers={
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
            "accept": "application/json",
        })
        resp = conn.getresponse()
        data = resp.read().decode("utf-8", "ignore")
        if resp.status >= 400:
            raise RuntimeError(f"Brevo HTTP {resp.status}: {data}")
    finally:
        conn.close()


def _send_via_smtp(to_address: str, subject: str, body: str) -> None:
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


def send_email(to_address: str, subject: str, body: str) -> None:
    """Send a plain-text email. Best-effort: never raises to the caller.
    Prefers the Brevo HTTPS API (works on Render); falls back to SMTP."""
    if not (to_address and SMTP_FROM):
        logging.info(f"[email] Skipped (no sender/recipient configured): {subject}")
        return
    try:
        if BREVO_API_KEY:
            _send_via_brevo(to_address, subject, body)
        elif SMTP_HOST:
            _send_via_smtp(to_address, subject, body)
        else:
            logging.info(f"[email] Skipped (no transport configured): {subject}")
            return
        logging.info(f"[email] Sent '{subject}' to {to_address}")
    except Exception as e:
        logging.error(f"[email] Failed to send '{subject}' to {to_address}: {e}")


# ============ RATE LIMITING ============
# Lightweight in-memory sliding-window limiter (single Render instance, so no
# external store needed). Buckets reset on restart, which is fine for abuse control.
_rate_lock = threading.Lock()
_rate_buckets = defaultdict(deque)  # "name:ip" -> deque[timestamps]


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(request: Request, name: str, max_requests: int, window_seconds: int):
    """Raise HTTP 429 if this IP exceeded max_requests within the window."""
    key = f"{name}:{_client_ip(request)}"
    now = time.time()
    cutoff = now - window_seconds
    with _rate_lock:
        bucket = _rate_buckets[key]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= max_requests:
            retry_after = int(bucket[0] + window_seconds - now) + 1
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait a moment and try again.",
                headers={"Retry-After": str(max(retry_after, 1))},
            )
        bucket.append(now)


api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    email_verified: bool = False
    created_at: datetime

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    password: Optional[str] = None
    role: str = "user"
    email_verified: bool = False
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

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=6, max_length=200)
    name: str = Field(..., min_length=1, max_length=120)

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

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    appointment_id: str
    user_id: str
    items: List[dict]          # [{service_id, name, price, duration}]
    total_amount: float
    total_duration: int        # minutes
    booking_date: str
    booking_time: str
    notes: Optional[str] = None
    status: str
    created_at: datetime

class AppointmentCreate(BaseModel):
    items: List[dict]
    booking_date: str
    booking_time: str
    notes: Optional[str] = None

class RescheduleRequest(BaseModel):
    booking_date: str
    booking_time: str

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=6, max_length=200)

class VerifyEmailRequest(BaseModel):
    token: str

class BlockedSlot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    block_id: str
    date: str
    start_time: Optional[str] = None   # None = whole day blocked
    end_time: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

class BlockedSlotCreate(BaseModel):
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reason: Optional[str] = None

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
    rate_limit(request, "login", max_requests=10, window_seconds=300)
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

async def _create_and_send_verification(user_id: str, email: str, name: str, background_tasks: BackgroundTasks):
    token = uuid.uuid4().hex + uuid.uuid4().hex
    await db.email_verifications.insert_one({
        "token": token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    link = f"{SITE_URL}/verify-email?token={token}"
    background_tasks.add_task(
        send_email,
        email,
        "Verify your email - Priiyanka's Nature Nest",
        f"Dear {name},\n\nPlease confirm your email address by opening this link:\n{link}\n\n"
        f"This link expires in 48 hours. If you didn't create an account, you can ignore this email."
    )


@api_router.post("/auth/register")
async def register(request: Request, response: Response, register_data: RegisterRequest, background_tasks: BackgroundTasks):
    """Register new user with email and password"""
    rate_limit(request, "register", max_requests=5, window_seconds=900)
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

    await _create_and_send_verification(user_id, register_data.email, register_data.name, background_tasks)

    result = UserOut(**user_data.model_dump()).model_dump()
    result["session_token"] = session_token
    return result

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, request: Request, background_tasks: BackgroundTasks):
    """Start a password reset. Always returns success (no account enumeration)."""
    rate_limit(request, "forgot", max_requests=5, window_seconds=900)
    user = await db.users.find_one({"email": data.email.strip()})
    if user:
        token = uuid.uuid4().hex + uuid.uuid4().hex
        await db.password_resets.insert_one({
            "token": token,
            "user_id": user["user_id"],
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        link = f"{SITE_URL}/reset-password?token={token}"
        background_tasks.add_task(
            send_email,
            user["email"],
            "Reset your password - Priiyanka's Nature Nest",
            f"Dear {user.get('name', '')},\n\nWe received a request to reset your password. "
            f"Open this link to set a new one (valid for 1 hour):\n{link}\n\n"
            f"If you didn't request this, you can ignore this email."
        )
    return {"message": "If that email is registered, a reset link has been sent."}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """Complete a password reset using the emailed token."""
    doc = await db.password_resets.find_one({"token": data.token})
    if not doc or doc.get("used"):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used.")
    expires_at = doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    hashed = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    await db.users.update_one({"user_id": doc["user_id"]}, {"$set": {"password": hashed}})
    await db.password_resets.update_one({"token": data.token}, {"$set": {"used": True}})
    # Invalidate existing sessions so old ones can't be used after a reset.
    await db.user_sessions.delete_many({"user_id": doc["user_id"]})
    return {"message": "Your password has been updated. You can now log in."}

@api_router.post("/auth/verify-email")
async def verify_email(data: VerifyEmailRequest):
    """Confirm an email address using the emailed verification token."""
    doc = await db.email_verifications.find_one({"token": data.token})
    if not doc or doc.get("used"):
        raise HTTPException(status_code=400, detail="This verification link is invalid or has already been used.")
    expires_at = doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This verification link has expired. Please request a new one.")

    await db.users.update_one({"user_id": doc["user_id"]}, {"$set": {"email_verified": True}})
    await db.email_verifications.update_one({"token": data.token}, {"$set": {"used": True}})
    return {"message": "Your email has been verified. Thank you!"}

@api_router.post("/auth/resend-verification")
async def resend_verification(request: Request, background_tasks: BackgroundTasks, session_token: Optional[str] = Cookie(None)):
    """Resend the verification email to the logged-in user."""
    rate_limit(request, "resend-verify", max_requests=3, window_seconds=900)
    user = await get_current_user(request, session_token)
    if user.email_verified:
        return {"message": "Your email is already verified."}
    await _create_and_send_verification(user.user_id, user.email, user.name, background_tasks)
    return {"message": "Verification email sent."}

CONTENT_TYPE_BY_EXT = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

@api_router.post("/upload")
async def upload_image(request: Request, file: UploadFile = File(...), session_token: Optional[str] = Cookie(None)):
    """Upload a service image. Stored in MongoDB (persistent) rather than the
    local disk, which is ephemeral on Render and wipes files on restart."""
    await require_admin(request, session_token)

    upload_filename = Path(file.filename).name
    extension = Path(upload_filename).suffix.lower()
    if extension not in CONTENT_TYPE_BY_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

    file_id = uuid.uuid4().hex
    # Trust our own extension->type map, NOT the client-supplied file.content_type
    # (which could be text/html and lead to stored XSS when served back).
    content_type = CONTENT_TYPE_BY_EXT[extension]
    await db.uploads.insert_one({
        "file_id": file_id,
        "filename": upload_filename,
        "content_type": content_type,
        "data": contents,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Build an absolute https URL (honor the proxy's forwarded scheme so we
    # never hand back an http URL that would be blocked as mixed content).
    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme
    host_header = request.headers.get("host") or "localhost:8000"
    image_url = f"{scheme}://{host_header}/api/uploads/{file_id}"
    return {"url": image_url}

@api_router.get("/uploads/{file_id}")
async def get_uploaded_image(file_id: str):
    """Serve an uploaded image from MongoDB (public)."""
    doc = await db.uploads.find_one({"file_id": file_id})
    if not doc or "data" not in doc:
        raise HTTPException(status_code=404, detail="Image not found")

    # Never serve an arbitrary/tampered content type: clamp to the image allowlist.
    media_type = doc.get("content_type")
    if media_type not in CONTENT_TYPE_BY_EXT.values():
        media_type = "application/octet-stream"

    return Response(
        content=bytes(doc["data"]),
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Disposition": "inline",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
        },
    )

@api_router.delete("/upload/{file_id}")
async def delete_uploaded_image(file_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete an uploaded image (admin only)."""
    await require_admin(request, session_token)

    result = await db.uploads.delete_one({"file_id": file_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    return {"deleted": True, "file_id": file_id}

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

# ============ APPOINTMENTS ENDPOINTS ============
# An appointment is a single visit that may include one or more treatments,
# booked for one date/time. This replaces the separate "orders" + "bookings"
# concepts for a service business.

def _time_to_minutes(value: str):
    """Parse 'HH:MM' into minutes since midnight, or None if unparseable."""
    try:
        parts = value.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return None


def _hours_problem(date_str: str, time_str: str, duration: int):
    """Pure check against working hours. Returns an error message or None.
    Kept dependency-free (no DB) so it can be unit-tested."""
    start = _time_to_minutes(time_str)
    if start is None:
        return "Please provide a valid time."
    try:
        weekday = datetime.strptime(date_str, "%Y-%m-%d").weekday()
    except Exception:
        return "Please provide a valid date."
    hours = WORKING_HOURS.get(weekday)
    if not hours:
        return "We are closed on the selected day. Please choose another date."
    open_m, close_m = hours
    if start < open_m or (start + duration) > close_m:
        oh = f"{open_m // 60:02d}:{open_m % 60:02d}-{close_m // 60:02d}:{close_m % 60:02d}"
        return f"Please choose a time within our opening hours ({oh})."
    return None


async def _slot_conflict(date_str: str, time_str: str, duration: int, exclude_id: str = None):
    """Return an error message if the requested visit is outside working hours,
    inside a blocked slot, or overlaps another appointment; else None."""
    problem = _hours_problem(date_str, time_str, duration)
    if problem:
        return problem

    start = _time_to_minutes(time_str)
    end = start + duration

    # Admin-blocked slots (whole-day, or a time range).
    for s in await db.blocked_slots.find({"date": date_str}, {"_id": 0}).to_list(1000):
        st = _time_to_minutes(s.get("start_time")) if s.get("start_time") else None
        et = _time_to_minutes(s.get("end_time")) if s.get("end_time") else None
        if st is None or et is None or (start < et and st < end):
            return "That time is unavailable. Please choose another."

    # Overlap with existing (non-cancelled) appointments.
    for a in await db.appointments.find({"booking_date": date_str, "status": {"$ne": "cancelled"}}, {"_id": 0}).to_list(1000):
        if exclude_id and a.get("appointment_id") == exclude_id:
            continue
        s2 = _time_to_minutes(a.get("booking_time", ""))
        if s2 is None:
            continue
        e2 = s2 + int(a.get("total_duration", 0) or 0)
        if start < e2 and s2 < end:
            return "That time overlaps an existing appointment. Please choose another time."

    return None

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(request: Request, session_token: Optional[str] = Cookie(None)):
    """List appointments (own for users, all for admins)."""
    user = await get_current_user(request, session_token)

    query = {} if user.role == "admin" else {"user_id": user.user_id}
    appointments = await db.appointments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for appt in appointments:
        if isinstance(appt['created_at'], str):
            appt['created_at'] = datetime.fromisoformat(appt['created_at'])
    return appointments

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(data: AppointmentCreate, request: Request, background_tasks: BackgroundTasks, session_token: Optional[str] = Cookie(None)):
    """Create a single appointment (visit) covering one or more treatments."""
    user = await get_current_user(request, session_token)

    if not data.items:
        raise HTTPException(status_code=400, detail="No treatments selected")
    if not data.booking_date or not data.booking_time:
        raise HTTPException(status_code=400, detail="Please select a date and time")

    total_amount = round(sum(float(i.get("price", 0)) for i in data.items), 2)
    total_duration = sum(int(i.get("duration", 0) or 0) for i in data.items)

    # Enforce working hours, admin blocks, and no overlap.
    conflict = await _slot_conflict(data.booking_date, data.booking_time, total_duration)
    if conflict:
        raise HTTPException(status_code=409, detail=conflict)

    appointment_id = f"appt_{uuid.uuid4().hex[:12]}"
    appointment_doc = {
        "appointment_id": appointment_id,
        "user_id": user.user_id,
        "items": data.items,
        "total_amount": total_amount,
        "total_duration": total_duration,
        "booking_date": data.booking_date,
        "booking_time": data.booking_time,
        "notes": data.notes,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.appointments.insert_one(appointment_doc)

    result = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    result['created_at'] = datetime.fromisoformat(result['created_at'])

    # Best-effort notifications.
    treatments = ", ".join(i.get("name", "?") for i in data.items)
    when = f"{data.booking_date} at {data.booking_time}"
    background_tasks.add_task(
        send_email,
        ADMIN_NOTIFY_EMAIL,
        "New appointment request",
        f"New appointment from {user.name} ({user.email}).\n"
        f"When: {when}\nTreatments: {treatments}\n"
        f"Duration: {total_duration} min\nTotal: €{total_amount:.2f}\n"
        f"Notes: {data.notes or '-'}"
    )
    background_tasks.add_task(
        send_email,
        user.email,
        "Your appointment request - Priiyanka's Nature Nest",
        f"Dear {user.name},\n\nWe have received your appointment request for {when}.\n"
        f"Treatments: {treatments}\nEstimated total: €{total_amount:.2f} (payable at the clinic).\n\n"
        f"We will confirm your appointment shortly.\n\nWarm regards,\nPriiyanka's Nature Nest"
    )

    return Appointment(**result)

@api_router.put("/appointments/{appointment_id}")
async def update_appointment_status(appointment_id: str, status: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update appointment status (admin only)."""
    await require_admin(request, session_token)

    if status not in ["pending", "confirmed", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"message": "Appointment status updated"}

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete an appointment (admin only)."""
    await require_admin(request, session_token)

    result = await db.appointments.delete_one({"appointment_id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"deleted": True, "appointment_id": appointment_id}

@api_router.post("/appointments/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str, request: Request, background_tasks: BackgroundTasks, session_token: Optional[str] = Cookie(None)):
    """Cancel an appointment (owner or admin)."""
    user = await get_current_user(request, session_token)
    appt = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt["user_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    if appt["status"] in ("cancelled", "completed"):
        raise HTTPException(status_code=400, detail="This appointment can no longer be cancelled.")

    await db.appointments.update_one({"appointment_id": appointment_id}, {"$set": {"status": "cancelled"}})
    background_tasks.add_task(
        send_email,
        ADMIN_NOTIFY_EMAIL,
        "Appointment cancelled",
        f"{user.name} ({user.email}) cancelled the appointment on {appt['booking_date']} at {appt['booking_time']}."
    )
    return {"message": "Appointment cancelled"}

@api_router.put("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(appointment_id: str, data: RescheduleRequest, request: Request, background_tasks: BackgroundTasks, session_token: Optional[str] = Cookie(None)):
    """Move an appointment to a new date/time (owner or admin), re-checking availability."""
    user = await get_current_user(request, session_token)
    appt = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt["user_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    if appt["status"] in ("cancelled", "completed"):
        raise HTTPException(status_code=400, detail="This appointment can no longer be rescheduled.")

    conflict = await _slot_conflict(
        data.booking_date, data.booking_time,
        int(appt.get("total_duration", 0) or 0),
        exclude_id=appointment_id
    )
    if conflict:
        raise HTTPException(status_code=409, detail=conflict)

    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"booking_date": data.booking_date, "booking_time": data.booking_time, "status": "pending"}}
    )
    background_tasks.add_task(
        send_email,
        ADMIN_NOTIFY_EMAIL,
        "Appointment rescheduled",
        f"{user.name} ({user.email}) moved their appointment to {data.booking_date} at {data.booking_time}."
    )
    return {"message": "Appointment rescheduled"}

# ============ AVAILABILITY (BLOCKED SLOTS) ENDPOINTS ============

@api_router.get("/admin/blocked-slots", response_model=List[BlockedSlot])
async def get_blocked_slots(request: Request, session_token: Optional[str] = Cookie(None)):
    """List blocked slots, upcoming first (admin only)."""
    await require_admin(request, session_token)
    slots = await db.blocked_slots.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    for s in slots:
        if isinstance(s['created_at'], str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return slots

@api_router.post("/admin/blocked-slots", response_model=BlockedSlot)
async def create_blocked_slot(data: BlockedSlotCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Block a date (whole day) or a time range within a date (admin only)."""
    await require_admin(request, session_token)
    if not data.date:
        raise HTTPException(status_code=400, detail="A date is required")

    block_id = f"block_{uuid.uuid4().hex[:12]}"
    doc = {
        "block_id": block_id,
        "date": data.date,
        "start_time": data.start_time or None,
        "end_time": data.end_time or None,
        "reason": data.reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.blocked_slots.insert_one(doc)
    result = await db.blocked_slots.find_one({"block_id": block_id}, {"_id": 0})
    result['created_at'] = datetime.fromisoformat(result['created_at'])
    return BlockedSlot(**result)

@api_router.delete("/admin/blocked-slots/{block_id}")
async def delete_blocked_slot(block_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Remove a blocked slot (admin only)."""
    await require_admin(request, session_token)
    result = await db.blocked_slots.delete_one({"block_id": block_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blocked slot not found")
    return {"deleted": True, "block_id": block_id}

# ============ REMINDERS (CRON) ENDPOINT ============

@api_router.post("/internal/send-reminders")
async def send_reminders(request: Request):
    """Email reminders for tomorrow's appointments. Protected by a shared secret
    (X-Cron-Secret header), intended to be hit by a scheduled job once a day."""
    if not CRON_SECRET or request.headers.get("x-cron-secret") != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    appts = await db.appointments.find(
        {"booking_date": tomorrow, "status": {"$in": ["pending", "confirmed"]}},
        {"_id": 0}
    ).to_list(1000)

    sent = 0
    for a in appts:
        u = await db.users.find_one({"user_id": a["user_id"]}, {"_id": 0})
        if u and u.get("email"):
            treatments = ", ".join(i.get("name", "?") for i in a.get("items", []))
            send_email(
                u["email"],
                "Appointment reminder - Priiyanka's Nature Nest",
                f"Dear {u.get('name', '')},\n\nThis is a reminder of your appointment tomorrow, "
                f"{a['booking_date']} at {a['booking_time']}.\nTreatments: {treatments}\n\n"
                f"See you soon,\nPriiyanka's Nature Nest"
            )
            sent += 1
    return {"reminders_sent": sent, "date": tomorrow}

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

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete a user and their sessions (admin only). Cannot delete yourself."""
    admin = await require_admin(request, session_token)
    if admin.user_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    await db.user_sessions.delete_many({"user_id": user_id})
    return {"deleted": True, "user_id": user_id}

# ============ CONTACT ENDPOINTS ============

@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(contact_data: ContactCreate, request: Request, background_tasks: BackgroundTasks):
    """Submit a contact / inquiry message (public)."""
    rate_limit(request, "contact", max_requests=5, window_seconds=900)
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

@api_router.delete("/admin/contact/{message_id}")
async def delete_contact_message(message_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete a contact message (admin only)."""
    await require_admin(request, session_token)

    result = await db.contact_messages.delete_one({"message_id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")

    return {"deleted": True, "message_id": message_id}

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