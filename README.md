# Public Cybercrime Reporting & Tracking Dashboard

A full-stack MERN application for reporting and tracking cybercrimes.

## Features

- **Public Reporting**: Submit cybercrime reports with evidence (file upload).
- **Real-time Tracking**: Track case status using a unique Tracking ID.
- **Admin Dashboard**: Manage cases, update statuses, and view statistics.
- **Authentication**: Secure JWT-based login for Reporters and Admins.
- **Responsive Design**: Works on mobile and desktop.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running locally

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/cybersafe_db
   JWT_SECRET=your_secret_key_here_change_in_production
   ```
   **Important**: Replace `your_secret_key_here_change_in_production` with a strong, random secret key.
4. Seed the Admin user:
   ```bash
   npm run seed
   ```
   *(Default Admin: email=`admin@cybersafe.com`, password=`admin123`)*
5. Start the server:
   ```bash
   npm start
   ```
   Server runs on `http://localhost:5000`.

### 2. Frontend Setup
1. Open the root folder.
2. Open `index.html` in your browser (or use Live Server).

## API Documentation

### Auth
- `POST /api/reporters/register` - Register new user
- `POST /api/reporters/login` - Login user
- `POST /api/admin/login` - Login admin

### Reports
- `POST /api/reports/submit-authenticated` - Submit report (Auth required)
- `GET /api/reports/my-reports` - Get user's reports (Auth required)
- `GET /api/reports/track/:trackingId` - Track a case (Public)
- `GET /api/reports/stats` - Get public stats

### Admin
- `GET /api/reports` - Get all reports
- `PUT /api/reports/:id` - Update report status

## Environment Variables
Create a `.env` file in `backend/` with:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cybersafe_db
JWT_SECRET=your_secret_key
```
