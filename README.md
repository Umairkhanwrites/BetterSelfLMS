# BetterSelf LMS — Monorepo (MVP V1.0)
Self-Paced Wellness & Psychoeducation Portal • Coursera/Skillshare Parity • Local Pakistan Payment Flow

Built strictly according to the **BetterSelf LMS — Master Build Blueprint**.

---

## 🏗️ Architecture & Topology

- **`backend/`**: Node.js + Express REST API
  - Authentication Token Guard & Custom Role-based Access Control
  - Cloud Firestore / Firebase Admin SDK integration (with zero-dependency fallback)
  - SEC-04: 24-Hour Pending Module-1 Trial access controller
  - Quiz Grader with per-question clinical explanations & instant retry
  - `pdf-lib` + `qrcode` dynamic certificate generator
- **`frontend/`**: Next.js 14 (App Router) + Tailwind CSS + Lucide Icons
  - SEC-07 Wireframe 1: Public Catalog (`/`) & Student Active Learning Strip
  - SEC-07 Wireframe 2: Course Landing & Free Preview Modal + Slide-Over Checkout Drawer (`/course/:id`)
  - SEC-07 Wireframe 3: 70/30 Split Classroom with Top Click-Shield YouTube Player & 4-Tab Bar (`/learn/:id`)
  - SEC-07 Wireframe 4: Admin Command Center with 1-click Approval Queue & CMS (`/admin`)
  - Public QR Credential Verification route (`/verify/:id`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ or v20+ (LTS)
- npm v10+

### 2. Install Dependencies
Dependencies are installed in their respective subdirectories:
```bash
# In backend/
cd backend
npm install

# In frontend/
cd ../frontend
npm install
```

### 3. Environment Configuration
Templates are provided in both subprojects:
- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env.local`

*(Pre-configured with defaults for local development & mock testing).*

### 4. Run Automated Milestone Verifications
```bash
# Run all milestones (M1 through M4) end-to-end
npm run test:all

# Or run individual milestone acceptance suites
npm run test:m1    # M1: Core Authentication & Course Discovery
npm run test:m2    # M2: Checkout Flow, 24h Module 1 Trial & Admin CMS
npm run test:m3    # M3: Split Classroom, Video Auto-Complete & Quiz Engine
npm run test:m4    # M4: Payment Approval Queue & QR-Verified PDF Certificates
```

### 5. Start Development Servers
From the root repository:
```bash
# Start Backend on http://localhost:5000
npm run dev:backend

# In another terminal, start Frontend on http://localhost:3000
npm run dev:frontend
```

---

## 🗄️ Database Schemas (Cloud Firestore - SEC-03)

- **`courses/{courseId}`**: Course metadata, instructor credentials, live Meet schedule, total items.
- **`courses/{courseId}/modules/{moduleId}`**: Sub-collection holding structured modules and lessons.
- **`quizzes/{quizId}`**: Assessments with passing score (70%) and clinical answer rationale.
- **`enrollments/{enrollmentId}`**: Student purchase status (`active`, `pending`, `rejected`), TID, and progress.
- **`notes/{noteId}`**: Timestamped private clinical notes.
- **`certificates/{certificateId}`**: Registered verifiable credentials.

---

## 🔐 Dedicated Test Credentials & Account Roles

The platform enforces real credential authentication. Once logged in, a user is locked into that account until they explicitly sign out.

| Account Type | Email | Password | Role & Permissions | Initial Pre-Seeded State |
| :--- | :--- | :--- | :--- | :--- |
| **Lead Clinical Admin** | `admin@betterself.pk` | `Admin@12345` | `admin` | Full platform access, live KPI analytics, Course & Module CMS studio, payment review queue |
| **Active Enrolled Student** | `active.student@betterself.pk` | `Student@12345` | `student` | Verified student with completed lessons (67%), private notes, and unlocked classroom |
| **Pending Review Student** | `pending.student@betterself.pk` | `Pending@12345` | `student` | Submitted JazzCash TID (`EP-99120485`) + receipt; classroom locked awaiting admin approval |
| **New Learner (Register)** | *Self-registered* | *User password* | `student` | Can only watch the single Free Intro/Trial video on course landing; classroom locked until enrolled |

---

## 🛠️ Admin Command Center Features (`/admin`)

- **Tab 1: Overview & Executive Analytics**: Live KPI cards for Total Revenue (PKR), Registered Students count, Pending Approvals, Active Students, Courses count, and Certificates issued.
- **Tab 2: Payment Verification & Receipt Center**: Filterable queue of incoming payments with attached high-resolution screenshot lightbox and 1-click `[Approve]` / `[Reject]` actions.
- **Tab 3: Student Directory**: Searchable list of all registered student accounts with their enrolled courses and completion percentages.
- **Tab 4: Course & Curriculum Builder CMS**: Live form to author new courses, embed unlisted YouTube lecture IDs, set pricing in PKR, configure weekly Google Meet schedules, and build clinical quizzes.
