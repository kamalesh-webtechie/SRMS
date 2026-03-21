# SRMS - Advanced Student Result Management System

## Project Overview
A production-grade academic management system with role-based access control (Admin, Faculty, Student) and AI-assisted insights.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **AI Integration**: External Text API

## Project Structure
- `/client`: Frontend Application
- `/server`: Backend API

## Setup Instructions

### 1. Database Configuration
The application requires a MongoDB connection.
1. Open `server/.env`.
2. Update `MONGO_URI` with your connection string.
   - For Local: `mongodb://localhost:27017/srms_db`
   - For Atlas: `mongodb+srv://<username>:<password>@cluster...` (Replace `<password>` with real password)

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
# Seed the database with the initial Admin user
node seed.js
```
*Note: Ensure the server is connected to MongoDB before seeding.*

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

## Default Credentials
- **Admin Email**: `admin@srms.edu`
- **Password**: `adminpassword123`

## Features Implemented
- [x] Project Structure (Monorepo-style)
- [x] Backend API Setup (Express)
- [x] Database Connection (MongoDB)
- [x] Authentication System (JWT, RBAC)
- [x] Frontend Login Page (Tailwind UI)
- [x] Protected Routes
