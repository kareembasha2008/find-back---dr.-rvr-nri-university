# 🎓 FIND BACK — Dr. RVR NRI University

> **A Next-Generation Campus Lost & Found Platform with 3D Visualizations, Gemini AI Assistant, and Smart Matching.**

---

## 🌟 Overview

**FIND BACK** is a smart campus web platform designed for **Dr. RVR NRI University (Agiripalli Campus)**. It bridges the gap between students who lose personal items and finders who turn them in, ensuring verified ownership, safe handovers, and complete privacy.

---

## ✨ Key Features

- **⚡ Instant Student Access**: Direct login without verification roadblocks, with support for official student IDs and email credentials.
- **🗺️ Interactive 3D Campus Experience**: Real-time Three.js 3D wave background, 3D radar scanner, and Agiripalli campus checkpoint locator.
- **🤖 Campus Gemini AI Assistant**: Multi-turn intelligent chatbot grounded in campus waypoints (Library Helpdesk, Main Gate Security, C Block Admin, Canteen Desk).
- **🎯 5-Checkpoint Smart Matching**: Intelligent scoring engine evaluating Category (20%), Item Title (25%), Campus Location (25%), Discovery Window (15%), and Description (15%).
- **🔐 Privacy-Preserving Ownership Verification**: Claimants verify belongings through secret private clues without exposing personal phone numbers or roll numbers publicly.
- **⚡ Real-Time Notifications & Custody Tracking**: Live Supabase subscriptions for instant match alerts and verified handovers.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Three.js
- **Backend**: Node.js, Express, tsx
- **Database & Auth**: Supabase (PostgreSQL, Realtime, Row Level Security)
- **AI & Grounding**: Google Gemini (`@google/genai` models) & Google Maps Grounding

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/find-back---dr.-rvr-nri-university.git

# Navigate into project directory
cd find-back---dr.-rvr-nri-university

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
# Public Supabase credentials
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Google Gemini API Key
GEMINI_API_KEY=<your-gemini-api-key>

# Optional: Google Maps Platform API Key
VITE_GOOGLE_MAPS_API_KEY=
```

### 4. Running the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🏛️ Campus Custody Desks
1. **Central Library Helpdesk** — Ground Floor (09:00 AM – 05:00 PM)
2. **Main Gate Security Post** — Agiripalli Campus Entrance (24/7 Custody)
3. **C Block Admin Office** — Room 104 (09:30 AM – 04:30 PM)
4. **Student Canteen Counter** — Near North Cash Desk (10:00 AM – 04:00 PM)

---

## 📄 License
Dr. RVR NRI University, Agiripalli &copy; 2026. All rights reserved.
