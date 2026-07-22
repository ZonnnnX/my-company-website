# Auth System Implementation Plan

## [x] 1. Backend: Add JWT auth + registration + login + admin routes (backend/index.js)
- [x] JWT secret from env
- [x] Auth middleware (verify token)
- [x] Admin middleware (check role)
- [x] POST /api/auth/register — create user (PENDING, EMPLOYEE), hash password
- [x] POST /api/auth/login — verify credentials, return JWT
- [x] GET /api/auth/me — get current user from token
- [x] GET /api/admin/users — list all users (admin only)
- [x] PATCH /api/admin/users/:id/status — approve/reject (admin only)

## [x] 2. Frontend: Replace access code gate with auth UI (index.html)
- [x] Login tab (email + password)
- [x] Register tab (name + email + password)
- [x] Pending approval screen (shown after register if status=PENDING)
- [x] Admin panel (shown if role=ADMIN) — table of users with approve/reject buttons
- [x] Regular approved users see main content

## [x] 3. Database: Migration from PostgreSQL to SQLite
- [x] Changed datasource provider to sqlite
- [x] Converted enums to String fields (SQLite compatible)
- [x] Created .env with DATABASE_URL
- [x] Seeded admin user (admin@company.com / admin123)
- [x] Seeded access codes (1234, ADMIN2024, EMPLOYEE)

## [x] 4. Fixed Issues
- [x] Removed @prisma/adapter-pg dependency (was for Neon serverless, not needed)
- [x] Fixed broken HTML structure (missing closing divs)
- [x] Fixed corrupted JavaScript (truncated functions, duplicate code, embedded garbage text)
- [x] Added missing checkAuthState(), handleCheckStatus(), handleAdminAction() functions
- [x] Added admin approve/reject buttons in user table
- [x] Fixed event listeners and initialization

