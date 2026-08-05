# TODO - Nâng cấp hệ thống (full plan)

## Mục tiêu
1. Fix tất cả chức năng lỗi không dùng được trên web (frontend thiếu hàm)
2. Admin sửa được mọi thứ thủ công trên web (users, roles, docs, content, team, invites, reports, broadcast)
3. Tự nối API (backend + localStorage fallback)
4. Web kín phù hợp công ty + sẵn sàng thêm tính năng mới
5. Tạo folder lưu link web + tài khoản admin
6. Push code lên git + chạy web

## Các bước thực hiện
- [x] Bước 1: Fix Admin Content tab - thêm loadSiteContentFromAdmin, saveSiteContentFromAdmin, addContentAnnouncement, addContentService, applySiteContentToUI
- [x] Bước 2: Thêm showToast() + SSE real-time client (EventSource /api/events)
- [x] Bước 3: Thêm Group Chat UI (tabs Chats/Nhóm, tạo nhóm, thêm thành viên, chat)
- [x] Bước 4: Hoàn thiện Admin Users (xóa user, reset password, edit user)
- [x] Bước 5: Thêm Admin Broadcast thông báo đến tất cả
- [x] Bước 6: Tự nối API tốt hơn (detectApiBase) + web kín công ty
- [x] Bước 7: Tạo folder ADMIN-LINKS chứa link web + tài khoản admin
- [x] Bước 8: Cập nhật README/PLAN, git commit & push
- [x] Bước 9: Chạy web lên để admin check

## Refactor: Tách index.html khổng lồ thành các file JS riêng
- [x] R0: Tách inline CSS ra `public/css/style.css`
- [x] R1: Tách cấu hình + hằng số ra `public/js/config.js`
- [x] R2: Tách localStorage API fallback ra `public/js/localStorageApi.js`
- [x] R3: Tách core logic (auth, nav, loadAdminUsers) ra `public/js/core.js`
- [x] R4: Tách admin content/broadcast ra `public/js/admin.js`
- [x] R5: Tách chat/team/private chat ra `public/js/chat.js`
- [x] R6: Tách init ra `public/js/init.js`
- [x] R7: index.html dùng external script tags (giảm từ 232KB/4740 dòng xuống 37KB/618 dòng)
- [x] R8: getSiteContent/saveSiteContent chuyển sang backend-first

## Hoàn thiện localStorageApi (offline fallback)
- [x] L1: Thêm PUT /api/admin/users/:id (edit user) handler
- [x] L2: Thêm POST /api/admin/users/:id/password (reset password) handler
- [x] L3: Xác minh JS/CSS hợp lệ (node parse OK, CSS MATCH: true)
- [x] L4: Xác minh backend đã có routes tương ứng (PUT /users/:id, POST /users/:id/password)
