# Priiyanka's Nature Nest - Ayurvedic Wellness Platform

A full-stack Ayurvedic wellness and booking platform built with React, FastAPI, and MongoDB. Features bilingual support (Dutch/English), cart system, appointment booking, and admin panel.

## 🌿 Features

### Public Features
- **Bilingual Support**: Dutch (default) and English language switching
- **Service Catalog**: 16 Ayurvedic services with detailed descriptions
- **Shopping Cart**: Add services to cart for checkout
- **Service Information**: Detailed descriptions, pricing in Euros, duration
- **LVNT Compliance**: Fully compliant with Dutch healthcare regulations
- **Responsive Design**: Beautiful natural/organic theme with earth tones

### User Features (Authenticated)
- **Google OAuth Login**: Secure authentication via Emergent Auth
- **User Dashboard**: View bookings and orders
- **Booking Management**: Track appointment status
- **Order History**: Review past purchases

### Admin Features
- **Service Management**: Full CRUD operations for services
- **Booking Management**: View and update booking status
- **User Management**: Manage users and assign admin roles
- **Order Management**: View all orders and their status
- **Analytics Dashboard**: Quick stats overview

## 🚀 Quick Start

### 1. Services are Already Running
Both frontend and backend are running via supervisor:
- Frontend: https://priiyanka-nature.preview.emergentagent.com
- Backend API: https://priiyanka-nature.preview.emergentagent.com/api

### 2. Create Admin User

**IMPORTANT**: You must first login to the website using Google OAuth before being made an admin.

#### Step 1: Login via Google OAuth
1. Go to https://priiyanka-nature.preview.emergentagent.com
2. Click "Inloggen" (Login) in the top right
3. Complete Google OAuth login
4. You'll be redirected to your dashboard

#### Step 2: Make User Admin
After logging in, run this command:

```bash
cd /app/backend
python create_admin.py your-email@gmail.com
```

Example:
```bash
python create_admin.py priiyankasingh87@gmail.com
```

#### Step 3: Access Admin Panel
1. Refresh the page
2. Click on "Admin" in the navigation bar
3. You now have full admin access!

### Other Admin Commands

List all users:
```bash
cd /app/backend
python create_admin.py list
```

## 📊 Database Seeding

All 16 services are already seeded! To reseed:

```bash
cd /app/backend
python seed_data.py
```

Services include:
- Consultations (Short & Long)
- Abhyanga Massage (30 & 60 min)
- Panchakarma therapies
- Therapeutic treatments (Kati Basti, Janu Basti, etc.)
- Beauty care (Hair, Skin treatments)
- Combination packages

## 🛠️ Tech Stack

### Frontend
- **React 19** with React Router
- **Tailwind CSS** with custom design system
- **Shadcn/UI** components
- **Lucide React** icons
- **Sonner** for toast notifications
- **Axios** for API calls

### Backend
- **FastAPI** with async/await
- **Motor** (async MongoDB driver)
- **Pydantic** for data validation
- **httpx** for OAuth integration
- **Python 3.11**

### Database
- **MongoDB** for data storage

### Authentication
- **Emergent Google OAuth** integration
- Session-based auth with httpOnly cookies
- 7-day session expiry

## 🎨 Design System

### Colors
- **Primary**: Forest Green (#0A4F2A)
- **Secondary**: Light Green (#3A8B3A)
- **Accent**: Gold/Brown (#926F3F)
- **Background**: Cream (#F5EBDD)
- **Foreground**: Dark Green (#2C3E2D)

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Manrope (sans-serif)
- **Accent**: Dancing Script (cursive)

## 🔐 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://priiyanka-nature.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

**⚠️ NEVER modify these URLs or add hardcoded values!**

## 📝 Compliance & Legal

### LVNT Compliance
- Therapist credentials displayed
- LVNT membership shown
- Privacy policy, terms & conditions, complaint procedure
- KVK registration: 98872109
- VAT number: NL005359083B24

### Business Details
- **Therapist**: VD. Priyanka Singh (B.A.M.S)
- **Experience**: 13+ years clinical experience
- **Location**: Frans Mortelmansstraat 68, Voorburg, Netherlands
- **Phone**: +31 623955935
- **Email**: priiyankasingh87@gmail.com

### Certifications
- B.A.M.S (Bachelor of Ayurvedic Medicine and Surgery)
- MBK (Medische Basiskennis) - De Stichting Hoger Onderwijs, NL
- GCLP (Good Clinical Laboratory Practice) - Whitehall Training
- GDP (Good Distribution Practice) - Whitehall Training
- CSR - Cerba Healthcare Institute
- LVNT Registered
- RBCZ Registered

## 🆘 Troubleshooting

### Services not showing?
```bash
cd /app/backend
python seed_data.py
```

### Admin panel not accessible?
1. Ensure you've logged in first via Google OAuth
2. Run: `python create_admin.py your-email@gmail.com`
3. Refresh the page

### Auth not working?
- Check that you're not hardcoding URLs
- Verify cookies are enabled in browser
- See `/app/auth_testing.md` for detailed testing guide

## 📞 Support

For issues or questions:
- Email: priiyankasingh87@gmail.com
- Phone: +31 623955935

---

**Built with ❤️ using Emergent AI**
