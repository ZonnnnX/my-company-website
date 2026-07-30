# KẾ HOẠCH NÂNG CẤP WEBSITE

## Tổng quan
Dựa trên yêu cầu của bạn, tôi sẽ thực hiện 3 việc chính:

---

## 1. Admin có thể quản lý Team (Thành viên) và các mục khác qua UI

### Vấn đề hiện tại:
- Danh sách thành viên trong Team được **hardcode** trong file `index.html`
- Muốn thay đổi phải sửa code thủ công

### Giải pháp:
- **Thêm model `TeamMember`** vào database (Prisma schema)
- **Tạo API endpoints** (CRUD) cho team members
- **Thêm giao diện Admin** để quản lý thành viên (thêm/sửa/xóa)
- **Load danh sách từ API** thay vì hardcode

### Các file cần sửa:
- `backend/prisma/schema.prisma` - Thêm model TeamMember
- `backend/index.js` - Thêm API routes cho TeamMember
- `index.html` - Thay hardcode bằng API call + Admin UI quản lý

---

## 2. Box Chat như Messenger

### Vấn đề hiện tại:
- Chat đã có backend API nhưng frontend gọi sai đường dẫn
- Chưa có giao diện chat hoàn chỉnh

### Giải pháp:
- Sửa các API path trong frontend cho đúng với backend
- Thêm real-time polling (tự động cập nhật tin nhắn mới)
- Cải thiện giao diện chat giống Messenger

---

## 3. Web luôn chạy không cần admin chạy code thủ công

### Vấn đề hiện tại:
- Mỗi lần muốn web chạy phải mở cmd và gõ `node backend/index.js`
- Khi tắt cmd thì web cũng tắt

### Giải pháp:
- **Sử dụng PM2** để chạy web như service tự động
- **Tạo script `install-service.bat`** cải tiến để cài đặt PM2 startup
- **Hướng dẫn chỉ chạy 1 file duy nhất** để web luôn online

### File cần tạo/sửa:
- `ecosystem.config.js` - Đã có, cần cập nhật
- `install-service.bat` - Cải tiến
- `start.bat` - Cải tiến

---

## Luồng hoạt động sau khi hoàn thành:
1. **Admin chạy `setup.bat` 1 lần duy nhất** -> Cài đặt PM2 + Prisma + Seed
2. **Từ đó web luôn chạy** - Kể cả khi restart máy tính
3. **Admin login** -> Vào Admin Panel -> Quản lý Team Members, Users, v.v.
4. **Mọi người dùng** -> Chat với nhau như Messenger
