# Veterans Benefits & Resettlement Portal

An enterprise-grade, centralized full-stack digital platform dedicated to serving military veterans, ex-servicemen, and their families with transparent welfare schemes, defense pension guidance, online application submissions, live claim tracking, career opportunities, employer hiring workflows, real-time notifications, interactive facility mapping, and resettlement programs.

---

## 📌 Project Overview

* **Phase Status:** Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6 & Phase 7 Complete
* **Architecture:** Decoupled RESTful Node.js/Express Backend + React (Vite) Single Page Application (SPA) with Socket.IO Real-Time Engine
* **Access Control:** Multi-tier Role-Based Access Control (RBAC) with JWT authentication and JWT-verified WebSocket connections
* **Profile & Document Vault:** Full military service record management, dynamic readiness scoring, and secure multi-format document storage
* **Welfare & Pension Module:** Searchable government welfare catalog, 16+ verified programs, and rule-based Smart Eligibility Matching
* **Scheme Application & Tracking System:** End-to-end multi-step application workflow, pre-submission server eligibility verification, document vault integration, sequential Application ID generation (`APP-YYYY-XXXXXX`), and status tracking timeline
* **Job & Resettlement Module:** Dedicated corporate employer accounts, employer profiles, defense job postings (`JOB-YYYY-XXXXXX`), public search/filtering, rule-based job recommendations, 1-click veteran applications (`JOBAPP-YYYY-XXXXXX`), applicant management board, and hiring pipeline status transitions
* **Real-Time Updates & Notifications (Phase 7):** Live bi-directional updates via authenticated Socket.IO rooms, notification bell with unread badge counter, Notification Center (`/veteran/notifications`, `/employer/notifications`), real-time toast alerts, interactive deployment maps, and resilient transactional email integration

---

## 🛠️ Technology Stack

### Frontend
* **Core:** React.js (v18)
* **Build Tool:** Vite
* **Routing:** React Router v7 (`react-router-dom`)
* **Real-Time Client:** `socket.io-client` (v4.8.1)
* **API Client:** Axios (with Bearer interceptors)
* **Icons:** Lucide React
* **Styling:** Custom Vanilla CSS Design System with CSS Custom Properties / Tokens

### Backend
* **Runtime:** Node.js (v22)
* **Framework:** Express.js (ES Modules)
* **Real-Time Server:** `socket.io` (v4.8.1) with JWT handshake authentication
* **Database:** MongoDB with Mongoose ODM
* **File Uploads & Storage:** `multer`, `cloudinary` (with local disk fallback)
* **Email Service:** Resend REST API integration with mock development console fallback
* **Security:** `bcryptjs` (salt rounds 10), `jsonwebtoken` (JWT), `helmet`, `express-rate-limit`, `cors`
* **Logging & Config:** `morgan`, `dotenv`

---

## ⚡ Real-Time Architecture & Socket.IO Rooms (Phase 7)

```text
┌─────────────────┐       WebSocket Handshake (JWT Auth)      ┌──────────────────┐
│  React Client   │ ◄───────────────────────────────────────► │ Socket.IO Server │
└─────────────────┘                                           └──────────────────┘
         │                                                              │
         │  Private Room: `user:<userId>`                               │
         ├──────────────────────────────────────────────────────────────┤  (Targeted notifications & status updates)
         │  Role Room: `role:<VETERAN|EMPLOYER|ADMIN>`                  │
         ├──────────────────────────────────────────────────────────────┤  (Broadcasts & new openings)
         │  Job Room: `job:<jobId>`                                     │
         └──────────────────────────────────────────────────────────────┘  (Recruiter live candidate board sync)
```

### Real-Time Event Matrix

| Event Name | Source / Trigger | Target Rooms | Payload / Effect |
| :--- | :--- | :--- | :--- |
| `application:submitted` | Veteran submits scheme application | `user:<vetId>`, `role:ADMIN` | Updates application list & unread count live |
| `application:statusChanged` | Admin/Recruiter updates status | `user:<vetId>`, `role:ADMIN` | Live timeline & status update without refresh |
| `job:created` | Employer posts new job | `role:VETERAN` | Live notification of newly available defense job |
| `job:applicationCreated` | Veteran applies for job | `user:<recruiterId>`, `job:<jobId>` | Increments applicant counter & adds candidate row |
| `job:applicationStatusChanged` | Employer shortlists/selects candidate | `user:<vetId>` | Real-time milestone progression & toast alert |
| `notification:new` | Any system notification generated | `user:<userId>` | Dispatches floating toast & increments badge |
| `notification:countUpdated`| Read status toggle / bulk read | `user:<userId>` | Synchronizes navbar unread counter |
| `dashboard:updated` | Major status/application changes | `user:<userId>` | Automatically refreshes dashboard metrics |

---

## 🔑 Demo Accounts

| Role | Email | Password | Default Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `AdminPassword123!` | `/admin/dashboard` |
| **Veteran** | `veteran@example.com` | `VeteranPassword123!` | `/veteran/dashboard` |
| **Employer** | `employer@example.com` | `EmployerPassword123!` | `/employer/dashboard` |

---

## 🚀 Getting Started

### 1. Installation
```bash
npm run install:all
```

### 2. Database Seeding (Users + 16 Schemes + 5 Employers + 12 Defense Jobs)
```bash
npm run seed
```

### 3. Run Development Servers
```bash
npm run dev
```

* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:5000`
* API Health Check: `http://localhost:5000/api/health`
* Veteran Notification Center: `http://localhost:5173/veteran/notifications`
* Employer Notification Center: `http://localhost:5173/employer/notifications`
* Defense Job Catalog: `http://localhost:5173/jobs`

---

## 📡 API Reference (Notifications & Real-Time)

### Notification Endpoints
* `GET /api/notifications` — Retrieve paginated notifications for current user (`?page=1&limit=15&unread=true`).
* `GET /api/notifications/unread-count` — Retrieve unread notifications counter for badge.
* `PUT /api/notifications/:id/read` — Mark single notification as read.
* `PUT /api/notifications/read-all` — Mark all notifications as read.
* `DELETE /api/notifications/:id` — Delete a notification record.

---

## 🧪 Testing & Verification

Run the comprehensive end-to-end automated verification suite covering Phases 1 through 7:

```bash
node backend/src/utils/testApi.js
```
