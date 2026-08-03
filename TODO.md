# TODO - Nâng cấp hệ thống (full plan)

## Mục tiêu
1. Fix tất cả chức năng lỗi không dùng được trên web (frontend thiếu hàm)
2. Admin sửa được mọi thứ thủ công trên web (users, roles, docs, content, team, invites, reports, broadcast)
3. Tự nối API (backend + localStorage fallback)
4. Web kín phù hợp công ty + sẵn sàng thêm tính năng mới
5. Tạo folder lưu link web + tài khoản admin
6. Push code lên git + chạy web

## Các bước thực hiện
- [ ] Bước 1: Fix Admin Content tab - thêm loadSiteContentFromAdmin, saveSiteContentFromAdmin, addContentAnnouncement, addContentService, applySiteContentToUI
- [ ] Bước 2: Thêm showToast() + SSE real-time client (EventSource /api/events)
- [ ] Bước 3: Thêm Group Chat UI (tabs Chats/Nhóm, tạo nhóm, thêm thành viên, chat)
- [ ] Bước 4: Hoàn thiện Admin Users (xóa user, reset password, edit user)
- [ ] Bước 5: Thêm Admin Broadcast thông báo đến tất cả
- [ ] Bước 6: Tự nối API tốt hơn (detectApiBase) + web kín công ty
- [ ] Bước 7: Tạo folder ADMIN-LINKS chứa link web + tài khoản admin
- [ ] Bước 8: Cập nhật README/PLAN, git commit & push
- [ ] Bước 9: Chạy web lên để admin check

