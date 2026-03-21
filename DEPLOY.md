# Deployment Guide for Gradex

This guide outlines how to deploy the **Gradex Student Result Management System** (MERN Stack) to production.

## 1. Prerequisites

- **GitHub Account**: To host your code repositories.
- **MongoDB Atlas Account**: For the cloud database.
- **Render / Railway / Heroku Account**: For hosting the Backend (Node.js/Express).
- **Vercel / Netlify Account**: For hosting the Frontend (React).

---

## 2. Database Setup (MongoDB Atlas)

1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a new **Cluster** (The free "Shared" tier is sufficient).
3.  Create a **Database User** (Security -> Database Access):
    -   Username: `gradex-admin`
    -   Password: (Create a strong secure password)
4.  Allow Network Access (Security -> Network Access):
    -   Add IP Address: `0.0.0.0/0` (Allows access from anywhere, required for cloud hosting).
5.  Get Connection String:
    -   Click "Connect" -> "Drivers".
    -   Copy the connection string (it looks like `mongodb+srv://gradex-admin:<password>@cluster0.exmpl.mongodb.net/?retryWrites=true&w=majority`).

---

## 3. Backend Deployment (e.g., on Render.com)

1.  Push your code to **GitHub**.
2.  Log in to [Render](https://render.com/).
3.  Click "New +" -> **"Web Service"**.
4.  Connect your GitHub repository.
5.  **Settings**:
    -   **Root Directory**: `server` (Important! Your backend is in the server folder).
    -   **Build Command**: `npm install`
    -   **Start Command**: `node index.js`
6.  **Environment Variables**:
    Add the key-value pairs from your local `.env` file:
    -   `PORT`: `10000` (Render creates this automatically usually, but good to set).
    -   `MONGO_URI`: (Paste your MongoDB Atlas connection string here).
    -   `JWT_SECRET`: (Generate a strong random string).
    -   `NODE_ENV`: `production`
7.  Click **"Create Web Service"**.
8.  Once deployed, copy the **Service URL** (e.g., `https://gradex-api.onrender.com`). You will need this for the frontend.

---

## 4. Frontend Deployment (e.g., on Vercel)

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Framework Preset**: Vite.
5.  **Root Directory**: Edit this to select `client`.
6.  **Environment Variables**:
    -   **Important**: Updates to the code might be needed if your API base URL is hardcoded.
    -   **Update Code First**:
        -   Go to `client/src/services/api.js`.
        -   Ensure `baseURL` uses an environment variable, e.g., `import.meta.env.VITE_API_URL` or fallback to localhost.
    -   Add Variable in Vercel:
        -   `VITE_API_URL`: (Paste your Backend Service URL from Step 3, e.g., `https://gradex-api.onrender.com/api`).
7.  Click **"Deploy"**.

---

## 5. Verification

1.  Open your Vercel URL (e.g., `https://gradex.vercel.app`).
2.  **Login**: Use the Admin credentials seeded in your database (`admin@srms.edu`).
3.  **Test**: Verified that your "Gradex" branding and Logic work in production.

## 6. Important Checks (Pre-Deployment)

-   **API URL**: Ensure `client/src/services/api.js` points to the production backend URL, not `localhost:5000`.
-   **Secrets**: Never commit your `.env` files to GitHub.
-   **Seed Data**: You may need to run the seed script locally pointing to the remote DB *once* to populate the initial Admin account.
    -   Update local `.env` `MONGO_URI` to the Atlas URI temporarily.
    -   Run `node seed.js`.
