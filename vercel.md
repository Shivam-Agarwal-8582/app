# Deploying SplitWise on Vercel & Cloud (Full-Stack & Mobile Guide)

> **Overview**:  
> This guide walks you through deploying the complete SplitWise platform:  
> - **Frontend (React 18 + Vite)** $\rightarrow$ Deployed on **Vercel** with global CDN and HTTPS.  
> - **Backend (Spring Boot 3.3 + Java 21)** $\rightarrow$ Deployed on **Railway** (or Render) with persistent MySQL and STOMP WebSockets.  
> - **Mobile Access** $\rightarrow$ Open on any smartphone browser or install as a PWA / native Android APK.

---

## 🏗️ Architecture Overview

```mermaid
flowchart LR
    Mobile["📱 Mobile Phone (Safari / Chrome / Android APK)"]
    Vercel["⚡ Vercel (React Frontend CDN)
    https://splitwise.vercel.app"]
    Railway["🚂 Railway (Spring Boot 3.3 + MySQL 8)
    https://splitwise-api.up.railway.app"]

    Mobile -->|Loads UI & Assets (HTTPS)| Vercel
    Mobile -->|REST API & STOMP WebSockets| Railway
```

### Why this architecture?
- **Vercel** is optimized for high-speed static frontend hosting, edge routing, and global CDN delivery. It does not run continuous Java JVM processes or persistent WebSocket TCP servers.
- **Railway** or **Render** provides full Docker container support for Java 21, managed MySQL databases, and long-lived WebSocket connections without timeout cutoffs.

---

## 🚀 Step 1: Deploy the Spring Boot Backend (on Railway)

[Railway.app](https://railway.app) provides an easy, zero-devops platform to run Spring Boot and MySQL together.

### 1. Create a MySQL Database on Railway
1. Log in to [railway.app](https://railway.app) using your GitHub account.
2. Click **New Project** $\rightarrow$ Select **Provision MySQL**.
3. Railway will provision a dedicated MySQL 8 instance with a single click.

### 2. Deploy the Backend Service
1. In the same Railway project, click **+ New** $\rightarrow$ **GitHub Repo**.
2. Select your `splitwise-clone` repository.
3. Once added, click on the service card $\rightarrow$ Go to the **Settings** tab:
   - **Root Directory**: `backend`
   - **Builder**: Select **Dockerfile** *(it will automatically use [backend/Dockerfile](backend/Dockerfile))*.
4. Go to the **Variables** tab and click **Raw Editor** or add these environment variables:
   ```env
   SPRING_PROFILES_ACTIVE=prod
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   ```
   *(Railway automatically injects the MySQL credentials via the `${{MySQL.*}}` references)*.
5. Go to the **Networking** section $\rightarrow$ Click **Generate Domain**.
   Railway will provide a public HTTPS URL, for example:
   ```
   https://splitwise-backend-production.up.railway.app
   ```

---

## ⚡ Step 2: Deploy the React Frontend to Vercel

The required routing configurations have already been prepared in [vercel.json](vercel.json) and [frontend/vercel.json](frontend/vercel.json) to ensure React Router never produces 404 errors.

### 1. Import Project into Vercel
1. Log in to [vercel.com](https://vercel.com) with GitHub.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your `splitwise-clone` repository.

### 2. Configure Vercel Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: Click *Edit* and select **`frontend`** *(Important!)*
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Add Environment Variables
Expand the **Environment Variables** section and add the Railway backend URLs from Step 1:

| Key | Example Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://splitwise-backend-production.up.railway.app/api/v1` | Public REST API Base URL |
| `VITE_WS_URL` | `wss://splitwise-backend-production.up.railway.app/ws` | Secure WebSocket STOMP URL |

*(Note: Use `wss://` instead of `ws://` because Vercel runs on HTTPS).*

### 4. Deploy!
Click **Deploy**. Within 45 seconds, Vercel will complete the build and assign your production domain:
```
https://splitwise-frontend.vercel.app
```

---

## 📱 How to Use on Your Mobile Phone

### Method A: Open as a Progressive Web App (PWA) on Mobile Browser
You can immediately use the full application on any smartphone:
1. Open your Vercel URL (`https://splitwise-frontend.vercel.app`) in **Safari** (iPhone) or **Chrome** (Android).
2. Install to home screen:
   - **On Android (Chrome)**: Tap `⋮` (menu) $\rightarrow$ **"Add to Home screen"** or **"Install app"**.
   - **On iPhone (Safari)**: Tap the **Share** button $\rightarrow$ **"Add to Home Screen"**.
3. The app will launch with the SplitWise logo in full-screen standalone mode with the mobile bottom navigation bar!

---

### Method B: Build & Install the Native Android APK
If you want to generate a native Android `.apk` connected to your deployed backend:
1. Update `frontend/.env.development` with your deployed Railway URLs:
   ```env
   VITE_API_BASE_URL=https://splitwise-backend-production.up.railway.app/api/v1
   VITE_WS_URL=wss://splitwise-backend-production.up.railway.app/ws
   ```
2. Build and sync Capacitor:
   ```bash
   cd frontend
   npm run cap:build
   ```
3. Generate the debug APK:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
4. Transfer `frontend/android/app/build/outputs/apk/debug/app-debug.apk` to your phone via USB or Google Drive and install it.

---

## 🔍 Troubleshooting & Common Fixes

| Issue | Cause | Fix |
|---|---|---|
| **404 on page refresh on Vercel** | SPA routing not redirected to `/index.html` | Ensure [frontend/vercel.json](frontend/vercel.json) is present with rewrite rule `{ "source": "/(.*)", "destination": "/index.html" }`. |
| **CORS error in browser console** | Backend rejecting Vercel origin | Backend `SecurityConfig.java` has `configuration.setAllowedOriginPatterns(List.of("*"))`, allowing requests from any Vercel domain. |
| **WebSocket fails to connect (`wss://`)** | Mixed content security block | When frontend is on HTTPS (`https://`), WebSocket must use secure protocol (`wss://`). |
| **Database connection refused** | MySQL environment variables missing | Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` are populated in Railway dashboard. |
