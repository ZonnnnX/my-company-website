# Implementation TODO - Full Site Upgrade (A-F plan)

## Steps
- [ ] A0: Read current index.html admin/chat sections to confirm exact strings
- [ ] A1: Admin Users - add Edit/Reset Pwd/Delete buttons in loadAdminUsers()
- [ ] A2: Add Edit User modal HTML + JS (openEditUserModal, saveUserEdit)
- [ ] A3: Add Reset Password modal HTML + JS (openResetPasswordModal, resetUserPassword)
- [ ] A4: Add Delete User JS (deleteUser)
- [ ] B1: Add Broadcast tab button + content div
- [ ] B2: Add renderBroadcastRoleOptions + sendBroadcast JS
- [ ] C1: Add Group Chat tabs (Chats/Nhóm) to private-chat box
- [ ] C2: Add group chat list/create/open/add-member/message JS
- [ ] D1: Add SSE real-time client (connectSSE) + event handlers
- [ ] E1: Extend localStorageApi fallback (edit user, reset pwd, broadcast, group members)
- [x] F1: Update TODO.md to mark completed steps
- [x] G1: Verify - open index.html / run backend

## REFACTOR - Split index.html (232KB → 38KB)
- [x] R1: Extract CSS to `public/css/style.css`
- [x] R2: Extract JS to `public/js/` (config, localStorageApi, core, admin, chat, init)
- [x] R3: Rewrite `index.html` with `<link>`/`<script>` references
- [x] R4: Verify JS/CSS content preserved (MATCH: true)
