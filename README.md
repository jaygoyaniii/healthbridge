<p align="center">
  <h1 align="center">🏥 HealthBridge</h1>
  <p align="center"><strong>Connecting Patients with Doctors</strong></p>
  <p align="center">A full-stack, real-time Healthcare Management System built with the MERN stack, featuring role-based dashboards, appointment scheduling, secure messaging, prescription management, and comprehensive admin controls.</p>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [User Roles & Capabilities](#-user-roles--capabilities)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Authentication & Security](#-authentication--security)
- [Real-Time Features](#-real-time-features)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Demo Credentials](#-demo-credentials)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)
- [Developer](#-developer)

---

## 🔍 Overview

**HealthBridge** is an enterprise-grade Hospital Management System that digitizes the complete healthcare workflow — from patient registration and doctor discovery through appointment booking, real-time consultations, prescription writing, and administrative oversight.

### Target Users

| Role | Description |
|------|-------------|
| **Patients** | Individuals seeking medical consultations, appointment booking, and health record management |
| **Doctors** | Medical practitioners managing schedules, patients, prescriptions, and earnings |
| **Administrators** | Platform managers overseeing doctor verification, analytics, user management, and system health |

### Business Problems Solved

- **Fragmented Healthcare Access** — Unified platform for discovering, booking, and consulting doctors
- **Manual Scheduling** — Automated slot generation, conflict detection, and Redis-based slot locking
- **Communication Gaps** — Real-time encrypted messaging between all user roles with typing indicators and read receipts
- **Unmanaged Support Requests** — Dedicated Contact Inquiry Management System for tracking and resolving visitor/user support tickets
- **Paper Prescriptions** — Digital prescription creation with PDF generation via PDFKit
- **Administrative Overhead** — Centralized dashboards with real-time analytics and doctor verification workflows

---

## ✨ Key Features

### Core Platform

- 🔐 JWT dual-token authentication with automatic refresh rotation
- 👥 Role-Based Access Control (Patient / Doctor / Admin)
- 📱 Fully responsive, mobile-first UI with Tailwind CSS
- ⚡ Real-time WebSocket communication via Socket.IO
- 🔔 In-app notification system with unread badges
- 📧 Transactional email templates (Welcome, Password Reset, Appointment Confirmation, Doctor Approval)

### Contact & Communication

- 📩 Public Contact Us Form with direct backend routing
- 📋 Inquiry Status Management (New, Read, In Progress, Resolved, Closed)
- 🎛️ Admin Inquiry Dashboard with Search & Filtering workflows
- 🚀 Instant Admin Notifications for new inquiry submissions

### Patient Module

- 🔍 Advanced doctor search with specialization, city, fee, and rating filters
- 📅 Smart appointment booking with live slot availability
- 📋 Medical records vault with Cloudinary file storage and doctor sharing controls
- 💊 Prescription history viewer with PDF support
- ⭐ Post-appointment doctor reviews and ratings
- 💬 Contact Support: Submit inquiries, feedback, and support requests directly to admins

### Doctor Module

- 📊 Comprehensive dashboard with earnings, appointment stats, and patient metrics
- 🗓️ Schedule manager with weekly availability, slot duration (15/30/45/60 min), and exception dates
- 👨‍⚕️ Patient management with complete health profiles and appointment history
- 📝 Digital prescription writer linked to appointments
- 💰 Earnings tracker with period-based analytics

### Admin Module

- 📈 Platform analytics with Recharts-powered visualizations
- ✅ Doctor verification workflow (approve / reject with reason)
- 👥 User management for both doctors and patients with profile deep-links
- 🏷️ Specialization CRUD management
- 💬 Admin chat hub for communicating with any user
- 🎫 Contact Inquiry Management: View, search, update status, and resolve user inquiries
- 📊 Report generation and system-wide appointment oversight

---

## 🛠 Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, Vite 5, React Router v6, Tailwind CSS 3 |
| **State Management** | Zustand (global), React Context (auth/chat/notifications), useReducer |
| **UI Components** | Lucide React (icons), Framer Motion (animations), Headless UI, React Hot Toast, Recharts, React DatePicker |
| **Forms & Validation** | React Hook Form, Zod, @hookform/resolvers |
| **HTTP Client** | Axios (with interceptors for token refresh) |
| **Backend** | Node.js, Express.js 4 |
| **Database** | MongoDB with Mongoose 8 ODM |
| **Caching** | Redis (ioredis) — slot locking with TTL |
| **Authentication** | JWT (access + refresh tokens), bcryptjs (12-round salt) |
| **Real-Time** | Socket.IO 4 (WebSocket transport) |
| **File Storage** | Cloudinary (via multer + streamifier) |
| **Email** | Nodemailer (SMTP / Gmail) |
| **PDF Generation** | PDFKit |
| **Security** | Helmet, CORS, express-rate-limit, httpOnly cookies |
| **Validation** | express-validator, Mongoose schema validators |
| **Dev Tools** | Nodemon, PostCSS, Autoprefixer, @tailwindcss/forms |
| **Utilities** | date-fns, clsx, tailwind-merge, react-infinite-scroll-component |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────────┐  │
│  │ Context  │  │  Zustand  │  │Services│  │  Pages     │  │
│  │Auth/Chat │  │Socket/UI │  │API Layer│  │Role-based  │  │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └────────────┘  │
│       │              │            │                        │
│       └──────────────┼────────────┘                        │
│                      │ Axios + Socket.IO-Client            │
└──────────────────────┼─────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │    SERVER (Express.js)  │
          │  ┌────────┐ ┌────────┐ │
          │  │  REST   │ │Socket  │ │
          │  │  API    │ │Handler │ │
          │  └───┬────┘ └───┬────┘ │
          │      │          │      │
          │  ┌───┴──────────┴───┐  │
          │  │   Middleware      │  │
          │  │ Auth│Role│Upload  │  │
          │  └───┬──────────────┘  │
          │      │                 │
          │  ┌───┴──────────────┐  │
          │  │   Controllers    │  │
          │  └───┬──────────────┘  │
          └──────┼─────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───┴───┐  ┌────┴────┐  ┌────┴─────┐
│MongoDB│  │  Redis   │  │Cloudinary│
│ (Data)│  │ (Cache)  │  │ (Files)  │
└───────┘  └─────────┘  └──────────┘
```

---

## 👥 User Roles & Capabilities

### 🩺 Admin

| Feature | Description |
|---------|-------------|
| Dashboard | Real-time stats — total users, doctors, patients, appointments, revenue |
| Doctor Approvals | Review pending registrations, approve or reject with reason, email notifications |
| Manage Doctors | Full doctor list with search, filter by status, view profiles, message, delete |
| Manage Patients | Patient directory with search, profile access, messaging, account management |
| Appointments | System-wide appointment viewer with status filters and cancellation controls |
| Analytics | Charts and trends for appointments, registrations, revenue over time |
| Specializations | CRUD management for medical specializations |
| Contact Inquiries | Professional inquiry management dashboard to view, resolve, and monitor public user inquiries (Status: New, Read, In Progress, Resolved, Closed) |
| Reports | Downloadable system reports |
| Chat | Centralized messaging hub — communicate with any doctor or patient |
| Doctor/Patient Profiles | Deep-link profile viewer with full details from any admin module |
| Settings | Platform configuration panel |
| Notifications | Priority-based notification center |

### 👨‍⚕️ Doctor

| Feature | Description |
|---------|-------------|
| Home & Dashboard | Today's appointments, patient count, earnings summary, quick actions |
| Appointments | Full appointment list with confirm, complete, cancel, no-show, and reschedule |
| Schedule Manager | Weekly availability with configurable time slots, slot duration, exception dates |
| My Patients | Patient directory built from appointment history with complete health profiles |
| Chat | Real-time secure messaging with patients (text, images, files) |
| Prescriptions | Digital prescription writer with medicines, dosage, diagnosis, follow-up dates |
| Earnings | Revenue analytics with period filtering and appointment-based breakdowns |
| Profile | Edit professional details, qualifications, clinic info, avatar |
| Notifications | Appointment, review, and system notifications |

### 🧑‍🤝‍🧑 Patient

| Feature | Description |
|---------|-------------|
| Home & Dashboard | Upcoming appointments, health metrics, recent prescriptions, quick actions |
| Find Doctor | Search and filter doctors by specialization, city, fees, rating, consultation type |
| Book Appointment | Select doctor → choose date → pick available slot → confirm with symptoms |
| My Appointments | Track all appointments with status, details, cancel/reschedule actions |
| Chat | Secure messaging with assigned doctors |
| Medical Records | Upload lab reports, X-rays, scans with file storage and doctor sharing permissions |
| Prescriptions | View all prescriptions with medication details and PDF downloads |
| Profile | Personal info, health profile (blood group, allergies, medications, emergency contact) |
| Reviews | Rate and review doctors after completed appointments |
| Notifications | Appointment confirmations, reminders, and system alerts |

---

## 🗃 Database Schema

### Collections (11 Mongoose Models)

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│    User      │────▶│    Doctor     │────▶│ Specialization │
│ (all roles)  │     │(extends User)│     │                │
└──────┬───────┘     └──────┬───────┘     └────────────────┘
       │                    │
       │              ┌─────┴──────┐
       │              │    Slot    │
       │              │(per doctor)│
       │              └────────────┘
       │
  ┌────┴───-──┐     ┌──────────────┐    ┌──────────────────┐
  │Appointment│───▶│ Prescription │    │  MedicalRecord   │
  │           │    │              │    │                  │
  └─────┬─────┘    └──────────────┘    └──────────────────┘
        │
   ┌────┴────┐    ┌──────────────┐    ┌──────────────────┐
   │ Review  │    │ Conversation │───▶│     Message       │
   │         │    │              │    │(text/image/file)  │
   └─────────┘    └──────────────┘    └──────────────────┘
                                      ┌──────────────────┐
                                      │  Notification    │
                                      └──────────────────┘
                                      ┌──────────────────┐
                                      │  ContactInquiry  │
                                      │  (Public Forms)  │
                                      └──────────────────┘
```

### Key Relationships

| Parent | Child | Relationship |
|--------|-------|-------------|
| User | Doctor | 1:1 (userId reference) |
| Doctor | Specialization | N:1 (ObjectId ref) |
| Doctor | Slot | 1:N (per date) |
| User + Doctor | Appointment | N:M (patientId + doctorId) |
| Appointment | Prescription | 1:1 |
| Appointment | Review | 1:1 |
| User | MedicalRecord | 1:N |
| User + User | Conversation | N:M (exactly 2 participants) |
| Conversation | Message | 1:N |
| User | Notification | 1:N |

### ContactInquiry Schema (Standalone)

- **Fields:** `fullName`, `email`, `phone`, `subject`, `message`, `status`, `readAt`, `createdAt`, `updatedAt`
- **Status Types:** `New`, `Read`, `In Progress`, `Resolved`, `Closed`

---

## 📡 API Documentation

### Authentication & Public (`/api/auth`, `/api/public`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register patient or doctor |
| POST | `/auth/login` | Public | Login with email/password |
| POST | `/auth/refresh` | Public | Refresh access token via cookie |
| POST | `/auth/logout` | Public | Invalidate refresh token |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password/:token` | Public | Reset password with token |
| POST | `/public/contact` | Public | Submit contact us inquiry |
| GET | `/auth/me` | Protected | Get current user profile |
| PUT | `/auth/change-password` | Protected | Change password |
| PUT | `/auth/profile` | Protected | Update user profile |

### Doctors (`/api/doctors`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List all approved doctors |
| GET | `/search` | Public | Search doctors with filters |
| GET | `/:id` | Public | Get doctor profile by ID |
| GET | `/:id/slots` | Public | Get available slots for a date |
| GET | `/:id/reviews` | Public | Get doctor reviews |
| POST | `/:id/slots` | Doctor | Update slot schedule |
| DELETE | `/:id/slots/:date` | Doctor | Delete slots for a date |
| GET | `/:id/appointments` | Doctor | Get doctor's appointments |
| GET | `/:id/patients` | Doctor | Get doctor's patient list |
| GET | `/:id/patients/:patientId` | Doctor | Get specific patient detail |
| GET | `/:id/earnings` | Doctor | Get earnings data |

### Appointments (`/api/appointments`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Patient | Book new appointment |
| GET | `/` | Protected | Get user's appointments |
| GET | `/upcoming` | Protected | Get upcoming appointments |
| GET | `/today` | Protected | Get today's appointments |
| GET | `/:id` | Protected | Get appointment details |
| PUT | `/:id/confirm` | Doctor/Admin | Confirm appointment |
| PUT | `/:id/complete` | Doctor/Admin | Mark as completed |
| PUT | `/:id/cancel` | Protected | Cancel appointment |
| PUT | `/:id/reschedule` | Patient/Admin | Reschedule appointment |
| PUT | `/:id/no-show` | Doctor/Admin | Mark as no-show |
| GET | `/:id/receipt` | Protected | Get appointment receipt |

### Chat (`/api/chat`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/unread-count` | Protected | Get total unread messages |
| POST | `/conversations` | Protected | Create or find conversation |
| GET | `/conversations` | Protected | List all conversations |
| GET | `/conversations/:id` | Protected | Get conversation with messages |
| DELETE | `/conversations/:id/clear` | Protected | Clear conversation |
| POST | `/messages` | Protected | Send a message |
| PUT | `/messages/:id/read` | Protected | Mark message as read |
| POST | `/upload` | Protected | Upload file attachment |

### Prescriptions (`/api/prescriptions`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Doctor | Create prescription |
| GET | `/` | Protected | List prescriptions |
| GET | `/:id` | Protected | Get prescription detail |

### Medical Records (`/api/medical-records`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Protected | Upload medical record |
| GET | `/` | Protected | List records |
| DELETE | `/:id` | Protected | Delete record |
| PUT | `/:id/share` | Protected | Update sharing permissions |

### Admin (`/api/admin`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/specializations` | Public | List specializations |
| GET | `/dashboard` | Admin | Dashboard statistics |
| GET | `/analytics` | Admin | Analytics data |
| GET | `/doctors` | Admin | All doctors |
| GET | `/doctors/:id` | Admin | Doctor profile by ID |
| GET | `/patients` | Admin | All patients |
| GET | `/patients/:id` | Admin | Patient profile by ID |
| DELETE | `/patients/:id` | Admin | Delete patient |
| GET | `/appointments` | Admin | All appointments |
| GET | `/doctors/approvals` | Admin | Pending doctor approvals |
| PUT | `/doctors/:id/approve` | Admin | Approve doctor |
| PUT | `/doctors/:id/reject` | Admin | Reject doctor |
| POST | `/specializations` | Admin | Create specialization |
| PUT | `/specializations/:id` | Admin | Update specialization |
| DELETE | `/specializations/:id` | Admin | Delete specialization |
| GET | `/contact-inquiries` | Admin | List and filter contact inquiries |
| GET | `/contact-inquiries/:id` | Admin | Get specific contact inquiry |
| PATCH | `/contact-inquiries/:id` | Admin | Update contact inquiry status |
| DELETE | `/contact-inquiries/:id` | Admin | Delete contact inquiry |

### Reviews & Notifications

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/reviews` | Patient | Create review |
| PUT | `/api/reviews/:id/reply` | Doctor | Reply to review |
| PUT | `/api/reviews/:id/helpful` | Public | Mark review helpful |
| GET | `/api/notifications` | Protected | Get notifications |
| PUT | `/api/notifications/read-all` | Protected | Mark all as read |
| PUT | `/api/notifications/:id/read` | Protected | Mark one as read |
| DELETE | `/api/notifications/:id` | Protected | Delete notification |

---

## 🔒 Authentication & Security

### Dual-Token JWT Architecture

```
Registration/Login
       │
       ├──▶ Access Token (15m expiry)
       │    → Stored in localStorage
       │    → Sent via Authorization: Bearer header
       │
       └──▶ Refresh Token (7 days expiry)
            → Stored in httpOnly secure cookie
            → Stored hashed in User document
            → Automatic rotation on refresh
```

### Security Layers

| Layer | Implementation |
|-------|---------------|
| **Password Hashing** | bcryptjs with 12-round salt |
| **HTTP Headers** | Helmet.js (CSP, HSTS, X-Frame-Options) |
| **CORS** | Restricted to CLIENT_URL with credentials |
| **Rate Limiting** | General: 100 req/15min, Auth: 20 req/15min |
| **Input Validation** | Mongoose schema validators + express-validator |
| **Route Protection** | JWT verification middleware (`protect`) |
| **Protected Inquiry APIs** | Contact inquiry listing and resolution restricted strictly to `admin` |
| **RBAC** | Role guard middleware with variadic role parameters |
| **Token Refresh** | Axios interceptor with queued retry for concurrent 401s |
| **Password Reset** | Crypto-hashed token with 30-minute expiry |
| **Account Deactivation** | Middleware blocks suspended accounts at auth level |

---

## ⚡ Real-Time Features

### Socket.IO Architecture

```
Client connects with JWT auth token
       │
       ├──▶ Joins personal room: user:{userId}
       │
       ├──▶ join_conversation → Joins room + resets unread
       ├──▶ leave_conversation → Leaves room
       │
       ├──▶ send_message → Creates Message → Broadcasts to room
       │    └──▶ Increments unread for other participant
       │    └──▶ Emits conversation:update to recipient
       │
       ├──▶ typing_start / typing_end → Broadcasts indicators
       ├──▶ mark_read → Updates read receipt + resets unread
       │
       └──▶ disconnect → Updates lastSeen + broadcasts offline status
```

### Real-Time Capabilities

- **Instant Messaging** — Messages delivered via WebSocket, not polling
- **Typing Indicators** — Live "user is typing..." with 2s debounce
- **Read Receipts** — Per-message read status with timestamps
- **Online Presence** — Real-time online/offline status for all users
- **Unread Badges** — Global sidebar badge count updated via socket events
- **File Sharing** — Images and documents via Cloudinary upload + socket broadcast

---

## 📁 Project Structure

```
healthbridge/
├── client/                          # Frontend (React + Vite)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── animations/              # Framer Motion variants
│   │   ├── assets/                  # Images, icons
│   │   ├── components/
│   │   │   ├── common/              # DashboardLayout, Avatar, Loader, ProtectedRoute
│   │   │   ├── ui/                  # Button, Badge, Input, Modal
│   │   │   ├── admin/               # Admin-specific components
│   │   │   ├── doctor/              # Doctor-specific components
│   │   │   ├── patient/             # Patient-specific components
│   │   │   └── chat/                # Chat-specific components
│   │   ├── context/                 # AuthContext, ChatContext, NotificationContext
│   │   ├── hooks/                   # useAuth
│   │   ├── pages/
│   │   │   ├── public/              # Home, Login, Register, ForgotPassword, DoctorProfile
│   │   │   ├── patient/             # PatientDashboard, FindDoctor, BookAppointment, etc.
│   │   │   ├── doctor/              # DoctorDashboard, ScheduleManager, WritePrescription, etc.
│   │   │   ├── admin/               # AdminDashboard, ManageDoctors, ContactInquiries, etc.
│   │   │   └── shared/              # Chat, Notifications, PrescriptionDetail
│   │   ├── services/                # API service modules (axios wrappers)
│   │   ├── store/                   # Zustand stores (useSocketStore, useUIStore)
│   │   ├── utils/                   # cn, format, profileUtils
│   │   ├── App.jsx                  # Route definitions
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles + Tailwind
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Backend (Express.js)
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   ├── redis.js                 # Redis connection with fallback
│   │   └── cloudinary.js            # Cloudinary upload/delete helpers
│   ├── controllers/                 # Route handlers (9 controllers)
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── roleGuard.js             # RBAC enforcement
│   │   ├── uploadMiddleware.js      # Multer file handling
│   │   └── errorHandler.js          # Global error handler
│   ├── models/                      # Mongoose schemas (12 models including ContactInquiry)
│   ├── routes/                      # Express routers (10 route files including publicRoutes)
│   ├── socket/
│   │   └── socketHandler.js         # Socket.IO event handlers
│   ├── utils/
│   │   ├── generateToken.js         # JWT access/refresh token helpers
│   │   ├── sendEmail.js             # Nodemailer templates
│   │   ├── notifyAdmins.js          # Admin notification broadcaster
│   │   └── slotHelper.js            # Slot generation + Redis locking
│   ├── server.js                    # App entry point
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v18+ (v22 recommended)
- **MongoDB** v6+ (local or Atlas)
- **Redis** v7+ (optional — falls back to in-memory)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/your-username/healthbridge.git
cd healthbridge
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

```bash
# Server — copy and edit
cp server/.env.example server/.env

# Client — copy and edit
cp client/.env.example client/.env
```

See [Environment Variables](#-environment-variables) section below.

### 5. Start MongoDB & Redis

```bash
# MongoDB
sudo systemctl start mongod

# Redis (optional)
sudo systemctl start redis
```

### 6. Create Admin Account

```bash
cd server
node createAdmin.js
```

### 7. Start Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

### 8. Access Application

| Service | URL |
|---------|-----|
| Frontend | <http://localhost:5173> |
| Backend API | <http://localhost:5000/api> |
| Health Check | <http://localhost:5000/api/health> |

### 9. Build for Production

```bash
cd client
npm run build    # Outputs to client/dist/
```

---

## 🔧 Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/healthbridge` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Access token signing secret | `your_access_secret` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | `your_refresh_secret` |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `your@gmail.com` |
| `EMAIL_PASS` | SMTP password/app password | `your_app_password` |
| `EMAIL_FROM` | Sender display name | `HealthBridge <noreply@healthbridge.com>` |

### Client (`client/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | <admin@healthbridge.com> | Admin@123 |
| **Doctor** | <sneha.kapoor@example.com> | Doctor@123 |
| **Patient** | <jaygoyani939@gmail.com> | Jay@123 |

> ⚠️ Doctor accounts require admin approval before accessing the dashboard.

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| Landing Page | Public homepage with doctor search and specialization browsing |
| Login / Register | Role-based registration with multi-step doctor onboarding |
| Patient Dashboard | Health metrics, upcoming appointments, recent prescriptions |
| Find & Book Doctor | Search, filter, view profiles, select slots, and book |
| Doctor Dashboard | Today's schedule, patient count, earnings overview |
| Schedule Manager | Weekly availability editor with slot duration configuration |
| Write Prescription | Medicine builder with diagnosis, advice, and follow-up |
| Admin Dashboard | Platform KPIs, registration trends, revenue charts |
| Doctor Approvals | Review applications with documents and approve/reject |
| Chat System | Real-time messaging with typing indicators, files, and read receipts |
| Notifications | Priority-based notification center with action links |

> 📌 *Add screenshots to a `/docs/screenshots/` directory and reference them here.*

---

## 🔮 Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Video Consultations** | WebRTC integration for real-time video appointments |
| **Payment Gateway** | Stripe/Razorpay integration for online consultation payments |
| **Email Verification** | OTP-based email verification flow (endpoint exists as placeholder) |
| **Push Notifications** | Browser push notifications via Service Workers |
| **Audit Logging** | HIPAA-compliant access logging for all profile views |
| **Two-Factor Auth** | TOTP-based 2FA for enhanced account security |
| **Multi-language** | i18n support for Hindi, Gujarati, and regional languages |
| **Mobile App** | React Native companion app using the existing API |
| **AI Symptom Checker** | LLM-powered pre-consultation symptom assessment |
| **Appointment Reminders** | Automated SMS/email reminders via cron jobs |
| **Export Reports** | CSV/PDF export for admin analytics and doctor earnings |

---

## 💻 System Requirements

### Hardware (Minimum)

- **RAM:** 4 GB
- **Storage:** 2 GB free disk space
- **CPU:** Dual-core processor

### Software

- Node.js v18+
- MongoDB v6+
- Redis v7+ (optional)
- npm v9+ or yarn v1.22+

### Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

---

## 👨‍💻 Developer

### Developed By

**Jay Goyani**

| Contact | Details |
|---------|---------|
| 📞 Phone | +91 82389 38615 |
| 📧 Email | <jaygoyani939@gmail.com> |
| 🐙 GitHub | [github.com/jay-goyani](https://github.com/jaygoyaniii) |
| 💼 LinkedIn | [linkedin.com/in/jay-goyani](https://www.linkedin.com/in/jay-goyani-10166a251/) |

---

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">
  <strong>HealthBridge</strong> — Connecting Patients with Doctors
  <br />
  Built with ❤️ using the MERN Stack
</p>
