# Domain Setup - Implementation Steps

## Mục tiêu: Mọi người có thể truy cập web mà không cần admin chạy code thủ công

## Step 1: Fix API_BASE in frontend ✅
- [ ] Sửa `index.html`: `API_BASE` dùng `window.location.origin` thay vì hardcode localhost

## Step 2: Fix backend to bind 0.0.0.0 ✅
- [ ] Sửa `backend/index.js`: Bind vào `0.0.0.0` để truy cập từ mạng LAN
- [ ] Thêm log hiển thị địa chỉ IP local

## Step 3: Tạo startup scripts ✅
- [ ] Tạo `start.bat` (Windows) - double-click to run
- [ ] Tạo `start.sh` (Mac/Linux)
- [ ] Tạo `setup.bat` - Cài đặt dependencies + seed + start

## Step 4: Cấu hình PM2 (auto-restart nếu crash) ✅
- [ ] Tạo `ecosystem.config.js`

## Step 5: Kiểm tra và xác nhận ✅
- [ ] Kiểm tra backend chạy được chỉ với double-click
- [ ] Kiểm tra frontend tự động kết nối đúng domain

