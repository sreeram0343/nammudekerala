# 🏛️ Nammude Kerala — Civic Social Platform

Nammude Kerala is a production-grade, Reddit-style civic discussion and issue-reporting platform exclusively built for Kerala. It empowers citizens to report local problems (like roads, waste, flooding, water, and corruption), tag their official assembly constituency using `@AssemblyName`, vote on key issues, and get official verified responses and updates directly from their local MLAs.

---

## 🚀 Key Architecture Highlights

The application is built on a **fully production-ready, Free-Tier deployable architecture** leveraging modern scalable cloud services. It is designed to be highly reliable, secure, and fully developer-friendly:

1. **Frontend Hosting (Vercel)**: Next.js app optimized with light/dark modes, smooth animations, dynamic Leaflet maps, and proper SEO OpenGraph tags.
2. **Backend API Hosting (Render)**: Modular FastAPI server with robust JWT authentication, Bcrypt password hashing, request logging, and custom sliding-window Token Bucket rate limiting.
3. **Database Layer (Neon PostgreSQL / SQLite Dual-Engine)**: Connects to Neon PostgreSQL in production, but features a dynamic dual-adapter that automatically falls back to SQLite (`kerala_civic.db`) for instant local offline testing.
4. **Media Storage (Cloudinary / Local Fallback)**: Automatically uploads issue reports, citizen profile images, and MLA banners to Cloudinary in production, with a clean local file write fallback to `backend/uploads/` when credentials are omitted.
5. **Real-time Engine (WebSockets)**: Features a connection manager that broadcasts real-time feed updates, upvote milestone achievements, citizen notifications, and official MLA responses instantly.

---

## 📂 Project Directory Structure

```text
nammude-kerala/
│
├── frontend/             # Next.js Frontend Application
│   ├── src/
│   │   ├── app/          # Next.js App Router (Page views & layouts)
│   │   ├── components/   # Modular UI elements (MapHotspots, AssemblySidebar, etc.)
│   │   ├── lib/          # Configuration clients (e.g. Leaflet center coordinates)
│   │   ├── hooks/        # Custom React hooks (e.g. useWebSocket)
│   │   ├── services/     # Centralized API service layer (authService, postService, etc.)
│   │   ├── context/      # Authentication context & session persistence
│   │   └── styles/       # Central stylesheet directory (globals.css)
│   └── public/           # Static icons and assets
│
├── backend/              # FastAPI Backend API Server
│   ├── routes/           # API Route entrypoints (auth_routes, post_routes, etc.)
│   ├── controllers/      # Request handlers & core business transactions
│   ├── middleware/       # Token Bucket rate limiter, request loggers, secure CORS
│   ├── services/         # Third-party adapters (Cloudinary, WebSocket broadcasts)
│   ├── database/         # Session management and engine adapters
│   ├── models/           # SQLAlchemy Database Models (Users, Assemblies, Posts, etc.)
│   ├── schemas/          # Pydantic validation schemas
│   ├── utils/            # Bcrypt hashing and JWT token operations
│   ├── uploads/          # Local fallback uploads storage folder
│   ├── main.py           # FastAPI server entrypoint
│   └── seed.py           # Official 140 Kerala assembly constituencies seeder
│
├── render.yaml           # Render Blueprint Infrastructure-as-code configuration
├── .env.example          # Environment variables template
└── README.md             # Developer handbook and deployment guides
```

---

## 🛠️ Local Development Quickstart

You can start the entire codebase locally with **zero external dependencies** (no Neon or Cloudinary account registrations required):

### 1. Backend Setup
1. Open a terminal and navigate to `/backend`.
2. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize and seed the 140 official assembly constituencies in the local SQLite database:
   ```bash
   python -m backend.seed
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   *The API will run at `http://localhost:8000`, with interactive docs at `/docs` and WebSocket endpoints at `/ws`.*

### 2. Frontend Setup
1. Navigate to `/frontend`.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Next.js local dev server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:3000` to interact with Nammude Kerala.*

---

## ☁️ Production Cloud Deployment Guide

Follow these steps to deploy the architecture to production on entirely free tiers:

### 1. Database Setup: Neon PostgreSQL (Free Tier)
1. Register for a free account at [Neon.tech](https://neon.tech/).
2. Create a new project and select **PostgreSQL**.
3. Copy the connection string under the Dashboard (labeled `DATABASE_URL`). It will look like:
   `postgresql://username:password@ep-some-host.neon.tech/neondb?sslmode=require`

### 2. Media Hosting Setup: Cloudinary (Free Tier)
1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the Cloudinary Console Dashboard.

### 3. Backend Deployment: Render (Free Tier)
1. Register for an account at [Render](https://render.com/).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository containing the project.
4. Render will read `render.yaml` automatically. Configure the environment variables in the setup screen:
   * `DATABASE_URL`: *Paste your Neon PostgreSQL URL.*
   * `CLOUDINARY_CLOUD_NAME`: *Paste your Cloudinary Cloud Name.*
   * `CLOUDINARY_API_KEY`: *Paste your Cloudinary API Key.*
   * `CLOUDINARY_API_SECRET`: *Paste your Cloudinary API Secret.*
   * `CLIENT_URL`: `https://nammude-kerala.vercel.app` *(Or your Vercel URL once created)*
5. Click **Approve** to deploy your backend. Copy your Render API domain (e.g. `https://your-api.onrender.com`).

### 4. Frontend Deployment: Vercel (Free Tier)
1. Sign up or log into [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project** and select your GitHub repository.
3. In the project settings:
   * **Framework Preset**: Next.js
   * **Root Directory**: `frontend`
4. Expand **Environment Variables** and add:
   * `NEXT_PUBLIC_API_URL`: *Your backend Render domain (e.g., `https://your-api.onrender.com`)*
5. Click **Deploy**. Vercel will build and launch your production frontend!

---

## 🔒 Security Best Practices Implemented

* **Secure JWT Tokens**: User sessions are fully secured via JWT. Frontend does not expose secrets and stores tokens securely.
* **Bcrypt Password Hashing**: Passwords are securely hashed with salts before storing in the database.
* **Token Bucket Rate Limiting**: Centralized sliding-window rate limiter blocks DDoS and brute-force attempts at the gateway.
* **SQL Injection & XSS Protection**: SQLAlchemy ORM parametrized queries fully prevent SQL injections, while standard input validation safeguards inputs against XSS scripts.
