# HealthSync AI+ — Smart Healthcare Management Ecosystem

HealthSync AI+ is a cutting-edge, cross-platform healthcare management ecosystem designed to bridge the gap between patients, doctors, and administrative staff using AI-driven insights, real-time tracking, and a premium, responsive User Experience. 

Built as a Progressive Web App (PWA), HealthSync AI+ provides a native-like experience on iOS and Android, focusing on reducing patient no-shows, improving medication adherence, and streamlining hospital operations.

---

## 🚀 Vision & Key Objectives
*   **Adherence Improvement:** AI-driven tracking to ensure patients stay on their prescribed clinical paths.
*   **Queue Optimization:** Real-time OPD and Emergency queue management to minimize wait times.
*   **Unified Communication:** Seamless automated notifications via Email, SMS, and WhatsApp.
*   **Emergency Prioritization:** Intelligent triage and tracking for critical care scenarios.

---

## 🛠️ Technology Stack

### Frontend (Client)
*   **Framework:** Next.js 16.2.2 (App Router)
*   **State Management:** React 19 Hooks (UseState, UseEffect, UseContext)
*   **Styling:** Tailwind CSS 4.0 + Custom Design System
*   **Icons:** Lucide React
*   **PWA:** Service Workers, Manifest.json (Installable HD Icons)
*   **Charts/Analytics:** Recharts

### Backend (Server)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB Atlas (Mongoose ODM)
*   **Authentication:** JSON Web Token (JWT) + Custom RBAC Middleware
*   **Mailing:** NodeMailer Integration
*   **File Handling:** Multer (Medical Record Uploads)

---

## 🏗️ Deep Technical Architecture

### Frontend Layer (Client-Side)
The frontend is built with **Next.js 16.2.2**, leveraging the latest **App Router** for optimized server-side rendering and client-side navigation. We use **React 19** with specialized hooks for real-time state synchronization.
*   **Design Language:** A custom "Glassmorphism" aesthetic built on **Tailwind CSS 4.0**, featuring high-contrast typography and fluid layout transitions.
*   **State Containers:** Local state management for UI-heavy components like Dashboards, ensuring high responsiveness under load.
*   **Performance Optimization:** Automatic code-splitting and image optimization ensure sub-second page loads on mobile networks.
*   **Asset Management:** SVGs for resolution-independent icons and HD PNGs for PWA branding.

### Backend Layer (Server-Side)
The server architecture follows a strict **Controller-Route-Model** pattern, ensuring high maintainability and testability.
*   **Middleware Pipeline:** Custom **JWT-based Authentication** with real-time status validation against the MongoDB database.
*   **Data Validation:** Mongoose schemas with strict enums for User Roles (Admin, Doctor, Patient, Caregiver) and Status (Active, Suspended).
*   **API Design:** RESTful principles with structured JSON responses for cross-origin compatibility.
*   **Utility Services:** Integrated **NodeMailer** service for automated clinical alerts and **Multer** for encrypted clinical document handling.

---

## 📋 Comprehensive Feature Log

### 1. 🛡️ Admin Tower (Centralized Oversight)
The master dashboard for hospital administrators to manage the platform's infrastructure.
*   **User Lifecycle Management:** View, Edit, and Suspend user accounts across all roles.
*   **Doctor Directory:** Manage medical departments, specialties, and experience levels.
*   **Deep System Audit:** Human-readable logs tracking every system interaction (Appointments, Security, Meds).
*   **Role-Based Access Control:** Secure portal ensuring only authorized personnel access sensitive hospital data.

### 2. 👨‍⚕️ Doctor Dashboard (AI-Augmented Practice)
A high-performance workspace for clinicians to manage their daily patient flow.
*   **Live OPD Queue:** See real-time patient queue with AI-calculated risk levels.
*   **AI Risk Assessment:** Automatic categorization of patients (High/Medium/Low) based on history.
*   **Smart Action Center:** One-click "Urgent" or "Follow-up" notifications via multi-channel links.
*   **Prescription Refill Hub:** Approve or Reject medication refill requests with custom notes.
*   **Patient Analytics:** Track adherence rates and visit history for every patient in the database.

### 3. 🏥 Emergency & Triage Dashboard
A critical module for high-pressure hospital environments.
*   **Priority Queueing:** Real-time triage list for emergency room patients.
*   **Critical Case Detection:** Highlighted status for patients requiring immediate life-saving attention.
*   **Emergency Stats:** persisted data for Last 24 Hours, Average Response Time, and Peak Load hours.
*   **Patient Record Access:** Instant "View Details" modal for emergency personnel to see history.

### 4. 🛌 Patient Portal (Care in Your Pocket)
A personal health companion for patients to manage their recovery.
*   **Medication Tracker:** Schedule, Log daily adherence, and track streaks.
*   **Digital Prescriptions:** View and download active prescriptions.
*   **One-Tap Refills:** Request medication refills directly from the assigned doctor.
*   **Medical Record Vault:** Secure upload/download of PDF, JPG, and PNG records linked to the cloud.
*   **PWA Installation:** Install as a home-screen app with a custom premium HealthSync brand icon.

### 5. 🤝 Caregiver Connect
Specialized portal for family members or professional caregivers.
*   **Patient Linking:** Securely link to a patient account via unique identifier.
*   **Sync Notifications:** Receive alerts when patients miss medication doses.
*   **Remote Management:** Assist in scheduling and record-keeping from a secondary device.

---

## 🔄 User Role Workflows

### 💻 The Administrative Path
1.  **Auth & Identity:** Secure login with role-enforced redirection.
2.  **User Governance:** Search and filter hospital staff or patients to update metadata or toggle access permissions.
3.  **Infrastructure Monitoring:** Review granular system logs to detect anomalies or audit staff actions.

### 🏥 The Clinical Path (Doctors)
1.  **Queue Activation:** View the live OPD queue, automatically sorted by appointment time and risk severity.
2.  **AI Analysis:** Utilize the built-in risk engine to identify high-risk chronic patients before they enter the room.
3.  **Smart Notifications:** Dispatch one-click clinical reminders to patient devices.
4.  **Prescription Closure:** Review patient-submitted refill requests, compare against history, and issue digital approvals.

---

## 📡 API Reference Overview (Standard Endpoints)

### Auth & User Management
*   `POST /api/auth/register` — User onboarding.
*   `POST /api/auth/login` — Secure session initiation.
*   `PATCH /api/admin/users/:id` — Update user permissions (Admin only).
*   `GET /api/admin/logs` — Comprehensive system audit trail.

### Clinical & Appointments
*   `GET /api/appointments/queue/live` — Fetch the current OPD queue.
*   `PATCH /api/appointments/:id/status` — Update visit progress (Doctor only).
*   `GET /api/doctor/patients` — List all unique patients under a doctor’s care.

### Medication & Refills
*   `GET /api/medications` — Patient-specific med list.
*   `POST /api/medications` — Add a new prescription log.
*   `POST /api/refills` — Submit a refill request to a doctor.
*   `PATCH /api/refills/:id` — Approve/Reject request (Doctor only).

---

## 📦 Installation & Local Setup

### Prerequisites
*   Node.js (v24+ recommended)
*   MongoDB Atlas Account (or local MongoDB instance)
*   Git

### 1. Clone the Repository
```bash
git clone https://github.com/kashyapdhamecha2207/HealthSyncAi-GU-.git
cd HealthSyncAi-GU-
```

### 2. Backend Config
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```
Create a `.env` file in the `/server` root:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```
Start the server:
```bash
npm run dev
```

### 3. Frontend Config
Navigate to the client directory and install dependencies:
```bash
cd ../client
npm install
```
Start the Next.js development server:
```bash
npm run dev
```

---

## 🔒 Security Implementation
HealthSync AI+ implements a multi-layered security protocol:
*   **DB-Synched Auth:** Authentication middleware performs live database lookups to ensure account status (e.g., 'suspended') takes effect instantly.
*   **Encrypted Storage:** All user passwords are salted and hashed using Bcrypt before storage.
*   **CORS Protection:** Restricted API access to authorized origins only.
*   **Environment Isolation:** Sensitive API keys/DB strings are restricted to server-side logic only.

---

## 🎨 UI/UX Design Philosophy
*   **Accessibility First:** WCAG-compliant color contrasts and font sizes.
*   **Glassmorphism:** Elegant use of backdrop-blur and translucent cards for a premium feel.
*   **Micro-Animations:** Framer-motion used for subtle hover states and modal transitions.
*   **Responsive Engine:** Fluid layouts that scale from 4K desktop monitors down to mobile screens.

---

## 📱 PWA & Mobile Experience
The platform is fully optimized for mobile deployment:
*   **Manifest Config:** Custom 192x and 512x branding logos.
*   **Theme Integration:** System-level theme colors synced for a native look.
*   **Apple Support:** Dedicated `apple-touch-icon` for iOS Safari users.

---

## 🤝 Contribution & Collaboration
We welcome contributions to the HealthSync AI+ project!
1.  **Fork** the repository.
2.  Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

---

## 👨‍💻 Developed By
*   **Kashyap Dhamecha** — Lead Architect & Backend Engineering
*   **Development Team** — GU Health-Tech Hackathon Division

Built with the ultimate goal of **Transforming the Digital Healthcare Landscape**.

---
*Created on: April 4, 2026*
*Current Version: 2.1.0-beta*
*Lines of documentation: 230+*
