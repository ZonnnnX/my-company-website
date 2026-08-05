# Private Company Website

A lightweight private corporate website with authentication, role-based access control, admin panel, team chat, private messaging, document repository, and reports.

## How to run

### Option 1 — Backend server (recommended, full features)
```bash
cd backend
npm install
npm run start        # or: node index.js
```
Then open `http://localhost:5000`.

The backend serves static files from the project root (including `index.html` and the `public/` folder) via `express.static`.

### Option 2 — Directly open the HTML file
Just open `index.html` in a browser. The app works in offline mode using a `localStorage` fallback backend.

## Project structure (modular)
The frontend is split into modular components to keep `index.html` small and maintainable:

```
index.html                  # HTML body markup + references to components
public/
  css/style.css             # All styles
  js/config.js              # Configuration, roles, localStorage helpers
  js/localStorageApi.js     # Offline fallback API (localStorage)
  js/core.js                # DOM refs, auth, admin user management
  js/admin.js               # Admin tabs: roles, docs, invites, content, broadcast, reports
  js/chat.js                # Team chat, private chat, notifications, group chat
  js/init.js                # Init code
backend/
  index.js                  # Express backend (Prisma + SQLite)
```

## Features
- **Authentication**: register/login with admin approval workflow
- **Role-based access**: ADMIN, DIRECTOR, LEADER, IT, ACCOUNTING, IMPLEMENTATION, EMPLOYEE + custom roles
- **Admin panel**: manage users, roles, documents, invites, site content, broadcasts
- **Chat**: team chat + private messaging (Messenger-style) + group chats
- **Document repository**: role-based visibility per document category
- **Reports**: account DIE reporting
- **Offline mode**: works with `localStorage` fallback when backend is unreachable

## Admin account (seeded automatically)
The default admin account is created on first run:
- Email: `Thangtan480@gmail.com`
- Password: `Sliverseven0`

> ⚠️ Change this password after first login.

## Admin user management
In **Admin Panel → Người dùng (Users)**, admins can:
- **Create** accounts manually
- **Edit** user details (name/email/role/group)
- **Reset password** for any user
- **Delete** users (also removes their chat messages and group memberships)
- **Approve/Reject** pending accounts and change roles

These operations use the backend API when available and fall back to `localStorage` in offline mode.

## Refactoring (HTML Language Server fix)
The previously monolithic `index.html` (232 KB / 4,740 lines) was split into modular components to prevent the HTML Language Server "Invalid string length" crash:

```
index.html                  # 37 KB / 618 lines — HTML body + component references
public/css/style.css        # All styles
public/js/config.js         # Configuration, roles, localStorage helpers & defaults
public/js/localStorageApi.js# Offline fallback API (localStorage), incl. edit/reset/delete user
public/js/core.js           # DOM refs, auth, admin user management
public/js/admin.js          # Admin tabs: roles, docs, invites, content, broadcast, reports
public/js/chat.js           # Team chat, private chat, notifications, group chat
public/js/init.js           # Init code
backend/index.js            # Express backend (Prisma + SQLite)
```

All JS files are loaded via external `<script>` tags in `index.html`, keeping each file small and independently editable in the editor without triggering the Language Server crash.

## Customize content
Edit site content through the **Admin Panel → Nội dung (Content)** tab, or edit the default values in `public/js/config.js` / `public/js/admin.js`.

