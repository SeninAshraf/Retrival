# ShiftSync | Personnel & Work Log Retrieval Portal 

ShiftSync is a premium, high-fidelity web dashboard designed to retrieve and display work logs of personnel working across multiple rotational shifts. Originally a static HTML/JS website, it has been fully migrated to a **MERN Stack** (MongoDB, Express, React, Node.js) application. 

It features instant name-based search, quick-search shortcut tags, operational metrics, and featured profile detail panels, all wrapped in a modern glassmorphic dark theme.

---

## Technical Stack

- **Frontend**: React (bootstrapped with Vite) + Vanilla CSS (custom glassmorphic keyframes and tokens)
- **Backend**: Node.js + Express.js API
- **Database**: MongoDB (Mongoose Schema & ODM)
- **Authentication**: Stateless JSON Web Tokens (JWT)
- **Tooling**: Concurrently script runner for parallel development servers

---

## Project Structure

```
.
├── client/                  # React + Vite Frontend
│   ├── index.html           # Font styles and React injection point
│   ├── vite.config.js       # Vite proxy setup for local API requests (Port 3000)
│   └── src/
│       ├── main.jsx         # React application entry
│       ├── App.jsx          # Session wrapper & global state
│       ├── index.css        # Glassmorphic design styles & animations
│       └── components/      # Portal components (Login, Admin, Employee)
├── server/                  # Node.js + Express Backend
│   ├── server.js            # Express application entry (Port 5000)
│   ├── .env                 # Environment variables config
│   ├── config/              # Mongoose DB connection configuration
│   ├── middleware/          # JWT authorization middlewares
│   ├── models/              # MongoDB collections schemas
│   ├── routes/              # Express endpoint routers
│   └── scripts/             # Seeding utility scripts
└── package.json             # Root package runner with postinstall scripts
```

---

## Setup & Execution Guide

### Prerequisites
Make sure you have the following installed on your machine:
1. **Node.js** (v18 or higher recommended) and **npm**
2. **MongoDB** (Local instance running at `mongodb://localhost:27017` or a MongoDB Atlas connection string)

### Installation
Run the following command at the root of the project to install all dependencies for both frontend and backend automatically:
```bash
npm install
```
*(This triggers a `postinstall` hook that runs `npm install` inside both the `client/` and `server/` subfolders)*

### Environment Variables
Configure the database URI and JWT secret in the server. A template file has been created at [server/.env](file:///Users/seninashraf/Documents/retrival/server/.env):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/shiftsync
JWT_SECRET=shiftsync_jwt_secret_token_key_2026_xyz
```

### Seeding Initial Data
Initialize the database with the pre-configured personnel logs:
```bash
npm run seed
```
This populates the collection with standard records for *Shanmugam*, *Desai*, *Arun*, *Rajesh*, and *Praveen*.

### Running the Application
Start both the React development server and the Node.js Express server concurrently:
```bash
npm run dev
```
- The React App will run at: **`http://localhost:3000`**
- The API Server will run at: **`http://localhost:5000`**
*(Vite proxies all calls from port 3000 starting with `/api` to the backend server)*

---

## Portals & Credentials

The portal retains the dual-access role design:
- **Administrator Portal** (Password: `123`): Log new shift entries, search all logs, view operational metrics, and review full profile details.
- **Employee Personal Portal** (Password: `321`): Safely lookup active duty logs matching your name or prefix.
