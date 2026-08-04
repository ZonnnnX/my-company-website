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

## Bước 10 - REFACTOR: Tách index.html khổng lồ (232KB / 4740 dòng) thành các component
- [x] Tạo file `public/css/style.css` (trích CSS từ `<style>`) — 709 dòng
- [x] Tạo file `public/js/config.js` (Configuration + localStorage helpers) — 112 dòng
- [x] Tạo file `public/js/localStorageApi.js` (offline fallback API) — 621 dòng
- [x] Tạo file `public/js/core.js` (DOM refs, auth, admin users) — 643 dòng
- [x] Tạo file `public/js/admin.js` (admin tabs: roles, docs, invites, content, broadcast, reports) — 1110 dòng
- [x] Tạo file `public/js/chat.js` (chat, private chat, notifications, group chat, router) — 923 dòng
- [x] Tạo file `public/js/init.js` (init code) — 7 dòng
- [x] Viết lại `index.html` tham chiếu các file component (232KB → 38KB, 4740 → 618 dòng)
- [x] Verify: kiểm tra tất cả hàm được giữ nguyên, không mất mã (JS MATCH: true, CSS MATCH: true)
- [x] Cập nhật IMPLEMENTATION_TODO.md
- [x] Git add + commit + push
