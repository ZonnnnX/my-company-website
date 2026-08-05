# Implementation TODO - Full Site Upgrade (A-F plan)

## Steps
- [x] A0: Read current index.html admin/chat sections to confirm exact strings
- [x] A1: Admin Users - add Edit/Reset Pwd/Delete buttons in loadAdminUsers()
- [x] A2: Add Edit User modal HTML + JS (openEditUserModal, saveUserEdit)
- [x] A3: Add Reset Password modal HTML + JS (openResetPasswordModal, resetUserPassword)
- [x] A4: Add Delete User JS (deleteUser)
- [x] B1: Add Broadcast tab button + content div
- [x] B2: Add renderBroadcastRoleOptions + sendBroadcast JS
- [x] C1: Add Group Chat tabs (Chats/Nhóm) to private-chat box
- [x] C2: Add group chat list/create/open/add-member/message JS
- [x] D1: Add SSE real-time client (connectSSE) + event handlers
- [x] E1: Extend localStorageApi fallback (edit user, reset pwd, broadcast, group members)
- [x] F1: Update TODO.md to mark completed steps
- [x] G1: Verify - open index.html / run backend

## REFACTOR - Split index.html (232KB → 38KB)
- [x] R1: Extract CSS to `public/css/style.css`
- [x] R2: Extract JS to `public/js/` (config, localStorageApi, core, admin, chat, init)
- [x] R3: Rewrite `index.html` with `<link>`/`<script>` references
- [x] R4: Verify JS/CSS content preserved (MATCH: true)
