# TODO - Nâng cấp hệ thống (real-time, group chat, admin CRUD, toast)

## Mục tiêu
1. Admin sửa tất cả mục thủ công trên web (users, roles, docs, content, team, invites, reports)
2. Thông báo hiện rõ như Facebook (toast popup + SSE real-time)
3. Admin tự tạo tài khoản, set role, phân quyền truy cập
4. Các role nhắn tin với nhau real-time (chat riêng 1-1)
5. Admin + Giám đốc/IT/Kế toán/Leader tạo nhóm chat riêng

## Các bước thực hiện
- [ ] Bước 1: Thêm model mới vào schema.prisma (CustomRole, Invitation, GroupChat, GroupChatMessage, SiteContent) + push DB
- [ ] Bước 2: Backend - thêm SSE endpoint real-time (EventSource) + broadcast + sseEmit ở các endpoint chat/notification
- [ ] Bước 3: Backend - thêm API: custom-roles, invites, site-content, group-chats CRUD, admin tạo user, user delete, permissions, broadcast
- [ ] Bước 4: Frontend - sửa hàm api() thử backend trước, fallback localStorage
- [ ] Bước 5: Frontend - thêm SSE client + showToast() kiểu Facebook
- [ ] Bước 6: Frontend - Group Chat UI (tabs Chats/Nhóm, tạo nhóm, thêm thành viên, chat)
- [ ] Bước 7: Frontend - Admin Users tab: tạo user thủ công, xóa user, sửa nhóm inline, phân quyền (permissions)
- [ ] Bước 8: Frontend - Admin Broadcast thông báo đến tất cả
- [ ] Bước 9: Frontend - hoàn thiện loadSiteContentFromAdmin/saveSiteContentFromAdmin
- [ ] Bước 10: Kiểm tra tổng thể (login, real-time giữa 2 trình duyệt, group chat, toast)

