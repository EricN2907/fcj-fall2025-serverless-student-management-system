# 📁 Hướng dẫn Setup & Nạp dữ liệu (Seeding) cho DynamoDB

Thư mục này chứa các script Node.js dùng để nạp dữ liệu mẫu (Mock Data) vào AWS DynamoDB phục vụ cho việc phát triển và kiểm thử.

## 🛠️ Yêu cầu chuẩn bị (Prerequisites)

1.  **Node.js**: Đảm bảo máy đã cài Node.js (Version 16 trở lên). Kiểm tra bằng lệnh `node -v`.
2.  **AWS Access Keys**: Liên hệ Admin để lấy cặp Key (`Access Key ID` và `Secret Access Key`) của user `team-dev`.

---

## 🚀 Cách chạy Script

### Bước 1: Cài đặt thư viện

Mở terminal tại thư mục `Database` và chạy lệnh sau để tải các thư viện AWS SDK cần thiết:

npm install

### Bước 2: Cấu hình Key (QUAN TRỌNG ⚠️)

Mở file `seed.js`. Tìm đoạn cấu hình Client ở đầu file:

const client = new DynamoDBClient({ 
    region: "ap-southeast-1", // Sydney
    credentials: {
        accessKeyId: "DIEN_KEY_VAO_DAY",     
        secretAccessKey: "DIEN_SECRET_VAO_DAY"  
    }
});

👉 Hành động:
1.  Paste cặp Key bạn nhận được vào 2 dòng trên.
2.  Lưu file (Ctrl + S).

### Bước 3: Chạy nạp dữ liệu

Gõ lệnh sau vào terminal:

node seed.js

✅ Thành công: Nếu thấy thông báo "🎉 HOÀN TẤT! Đã nạp tổng cộng..." nghĩa là dữ liệu đã lên mây.
❌ Thất bại: Nếu báo lỗi ResourceNotFoundException, hãy kiểm tra lại Region hoặc Tên bảng trong file code xem có khớp với AWS không.

---

## ⛔ LƯU Ý SỐNG CÒN (MUST READ)

1.  **KHÔNG ĐƯỢC COMMIT FILE CHỨA KEY**: Sau khi chạy xong script `seed.js`, hãy **xóa ngay** 2 dòng Key vừa paste hoặc revert file về trạng thái cũ trước khi gõ lệnh `git add`.
2.  **Không sửa cấu trúc PK/SK**: Dữ liệu được thiết kế theo mô hình **Single Table Design**. Nếu tự ý đổi `PK`, `SK` hay `GSI1`, Backend sẽ không query được dữ liệu.

---

## 📂 Cấu trúc dữ liệu (Full 13 Tables Mapping)

Bảng dưới đây giải thích chi tiết **13 bảng SQL** ban đầu đã được chuyển đổi như thế nào trong DynamoDB:

| Entity (Loại Item) | Partition Key (PK) | Sort Key (SK) | GSI1PK | GSI1SK | Tương ứng bảng SQL cũ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | `USER#{id}` | `PROFILE` | `ROLE#{roleName}` | `USER#{id}` | Bảng `users` + `roles` |
| **Subject** | `SUBJECT#{code}` | `INFO` | - | - | Bảng `subjects` |
| **Class** | `CLASS#{id}` | `INFO` | `TEACHER#{id}` | `CLASS#{id}` | Bảng `classes` + `subject_assignments` |
| **Grade Config** | `CLASS#{id}` | `CONFIG#GRADES` | - | - | Bảng `grade_columns` |
| **Enrollment** | `CLASS#{id}` | `STUDENT#{id}` | `STUDENT#{id}` | `CLASS#{id}` | Bảng `enrollments` |
| **Grade** | `CLASS#{id}` | `GRADE#{studentId}` | - | - | Bảng `grades` |
| **Attendance** | `CLASS#{id}` | `ATTEND#{date}` | - | - | Bảng `attendance` |
| **Material** | `CLASS#{id}` | `MAT#{timestamp}` | - | - | Bảng `materials` |
| **Chat** | `CLASS#{id}` | `CHAT#{timestamp}` | - | - | Bảng `chat_messages` |
| **Notification** | `USER#{id}` | `NOTIF#{timestamp}`| - | - | Bảng `notifications` |
| **Log** | `USER#{id}` | `LOG#{timestamp}` | - | - | Bảng `activity_logs` |

**Giải thích:**
* **PK/SK**: Khóa chính dùng để xác định duy nhất 1 dòng.
* **GSI1**: Index phụ dùng để tìm kiếm ngược (Ví dụ: Tìm tất cả lớp mà Sinh viên đang học).