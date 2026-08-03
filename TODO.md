# TODO - Nâng cấp hệ thống (Admin tạo user + Group Chat + URL công khai)

## Mục tiêu
1. Admin tạo tài khoản mới + set role/group trực tiếp trên web
2. Hoàn thiện Group Chat (giống Messenger: tabs Chats/Nhóm, tạo nhóm, chat nhóm)
3. Tạo URL công khai để mọi người truy cập (Cloudflare Tunnel)
4. Cập nhật nội dung web cho phù hợp loại hình trade quỹ
5. Lưu code + git push lên GitHub

## Các bước thực hiện
- [x] Bước 0: Phân tích codebase (backend index.js, frontend index.html, Prisma schema)
- [ ] Bước 1: Frontend - Thêm nút "+ Tạo tài khoản" + form modal trong tab Users của Admin Panel
- [ ] Bước 2: Frontend - Thêm hàm createUserAccount() gọi POST /api/admin/users (đã có backend)
- [ ] Bước 3: Frontend - Hoàn thiện Group Chat UI (tabs Chats/Nhóm, tạo nhóm, chọn thành viên, chat nhóm)
- [ ] Bước 4: Frontend - Cải thiện Document Repository cho nhóm/quỹ/VPS
- [ ] Bước 5: Cập nhật nội dung web (hero, about, services) cho trade quỹ
- [ ] Bước 6: Cài đặt cloudflared + cập nhật cloudflared-tunnel.bat
- [ ] Bước 7: Kiểm tra tổng thể (server chạy, admin tạo user, group chat, URL)
- [ ] Bước 8: Git commit + push lên GitHub
