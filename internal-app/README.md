# Internal Application

A complete internal web application built with **Node.js**, **Express.js**, **PostgreSQL (Sequelize ORM)**, and **EJS/Tailwind CSS**.

## Features

- **User Registration & Approval Workflow**
  - Users register with username, email, and password.
  - Account status automatically set to **"Pending"** (Chờ duyệt).
  - Pending/rejected users **cannot login** — they see an appropriate notification.

- **Admin Dashboard & Approval System**
  - Admin can view a list of all pending user accounts.
  - Admin can **Approve** or **Reject** accounts.
  - Upon approval, admin can assign a specific role: **Staff** or **Manager**.

- **Role-Based Access Control (RBAC)**
  - Routes are protected — only authenticated users with "Approved" status and correct role can access.
  - After login, users are redirected to their role-based dashboard:
    - **Admin** → Admin Dashboard (`/admin/dashboard`)
    - **Manager** → Manager Dashboard (`/dashboard/manager`)
    - **Staff** → Staff Dashboard (`/dashboard/staff`)

- **Security**
  - Passwords hashed with **bcrypt**.
  - JWT-based authentication stored in HTTP-only cookies.
  - Middleware-level authorization checks.
  - Sequelize ORM with parameterized queries (SQL injection protection).

## Directory Structure

```
internal-app/
├── backend/
│   ├── config/
│   │   └── db.js              # PostgreSQL/Sequelize connection configuration
│   ├── controllers/
│   │   ├── authController.js   # Registration, login, logout logic
│   │   └── adminController.js  # User management, approval logic
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication + status checking
│   │   └── rbac.js             # Role-based access control
│   ├── models/
│   │   └── User.js             # Sequelize User model (PostgreSQL)
│   ├── routes/
│   │   ├── auth.js             # Auth API routes
│   │   └── admin.js            # Admin API routes
│   ├── views/
│   │   ├── auth/
│   │   │   ├── login.ejs       # Login page
│   │   │   └── register.ejs    # Registration page
│   │   ├── admin/
│   │   │   └── dashboard.ejs   # Admin dashboard (user management)
│   │   └── dashboard/
│   │       ├── staff.ejs       # Staff dashboard
│   │       └── manager.ejs     # Manager dashboard
│   ├── .env                    # Environment variables (template)
│   ├── seed.js                 # Admin account seed script
│   ├── server.js               # Application entry point
│   └── package.json            # Dependencies
└── README.md                   # This file
```

## Prerequisites

- **Node.js** v16 or higher
- **PostgreSQL** — You need a running PostgreSQL instance:
  - **Option 1**: Local PostgreSQL installation (default: `localhost:5432`)
  - **Option 2**: Remote/Cloud PostgreSQL server

## Setup Instructions

### 1. Navigate to the backend directory

```bash
cd internal-app/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Make sure PostgreSQL is running, then create the database:

```bash
# Connect to PostgreSQL and create the database
psql -U postgres -c "CREATE DATABASE internal_app;"
```

Or using a GUI tool like pgAdmin.

### 4. Configure environment variables

Edit `.env` file in the `backend/` directory:

```env
# Server port
PORT=3000

# PostgreSQL connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=internal_app
DB_USER=postgres
DB_PASSWORD=postgres

# JWT secret (generate a strong random string)
JWT_SECRET=your-strong-random-secret-here

# Admin seed credentials
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=Admin123!
```

### 5. Seed the database (creates Admin account + creates tables)

```bash
npm run seed
```

Expected output:
```
🔄 Connecting to PostgreSQL...
✅ PostgreSQL connected: localhost:5432/internal_app
✅ Database tables synced.

🎉 Admin account created successfully!
   Username: admin
   Email:    admin@company.com
   Password: Admin123!
   Role:     Admin
   Status:   Approved

📊 Database Summary:
   Total users:  1
   Pending:      0
   Approved:     1
   Rejected:     0
   Admins:       1
```

### 6. Start the server

**Development mode** (with auto-restart on file changes):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

### 7. Open the application

```
http://localhost:3000
```

## Usage Guide

### 1. Register a new user

1. Go to [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
2. Fill in: Username, Email, Password
3. Click **"Create Account"**
4. You'll see a success message. Your account status is **Pending**.

### 2. Try to login with pending account

1. Go to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Enter the email and password you registered with
3. You'll see an error: *"Tài khoản của bạn đang chờ duyệt (Pending)"*

### 3. Login as Admin and approve the user

1. Go to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Login with Admin credentials:
   - Email: `admin@company.com`
   - Password: `Admin123!`
3. You'll be redirected to the **Admin Dashboard**
4. You'll see the pending user in the table
5. Click **"Approve"** to approve, or **"Reject"** to reject
6. Use the **role dropdown** to assign a role (Staff or Manager) when approving
7. The user's status updates in real-time

### 4. Login as approved user

1. Logout from admin
2. Go to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
3. Login with the approved user's credentials
4. You'll be redirected to the appropriate dashboard based on your role:
   - **Staff** → `/dashboard/staff`
   - **Manager** → `/dashboard/manager`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login and get JWT | Public |
| GET | `/api/auth/me` | Get current user details | JWT |
| POST | `/api/auth/logout` | Logout and clear cookie | JWT |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/pending-users` | List pending users | Admin |
| GET | `/api/admin/users` | List all users (optional filters) | Admin |
| PATCH | `/api/admin/users/:id/approve` | Approve user (optional role) | Admin |
| PATCH | `/api/admin/users/:id/reject` | Reject user | Admin |
| PATCH | `/api/admin/users/:id/role` | Update user role | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## Role Definitions

| Role | Access Level | Dashboard |
|------|-------------|-----------|
| **Admin** | Full system access, user management, approval | `/admin/dashboard` |
| **Manager** | Management-level operational access | `/dashboard/manager` |
| **Staff** | Basic operational access | `/dashboard/staff` |

## Security Notes

- **Change the default admin password** immediately after first login.
- **Use a strong JWT_SECRET** — generate one with `openssl rand -hex 64`.
- **Use HTTPS** in production — never send cookies over unencrypted connections.
- The `.env` file is **not committed** to version control.
- Sequelize uses parameterized queries, protecting against SQL injection.

## Troubleshooting

### PostgreSQL connection error

```
PostgreSQL connection error: connect ECONNREFUSED ::1:5432
```

**Solution**: Make sure PostgreSQL is running.

#### Windows:
```bash
# Check if PostgreSQL service is running
net start | findstr postgres

# Start PostgreSQL service
net start postgresql-x64-16
# (Version number may vary)
```

#### macOS (Homebrew):
```bash
brew services start postgresql@16
```

#### Linux:
```bash
sudo systemctl start postgresql
```

### Database "internal_app" does not exist

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE internal_app;"
```

### Port already in use

```
Error: listen EADDRINUSE :::3000
```

**Solution**: Change the port in `.env` or kill the process using port 3000.

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

## License

Internal use only.

