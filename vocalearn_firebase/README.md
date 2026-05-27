# VocaLearn v63 – Hướng dẫn sử dụng

## Cách chạy ứng dụng

**Không cần cài đặt gì cả!**

1. **Giải nén** file zip vào một thư mục bất kỳ
2. **Mở file `index.html`** bằng trình duyệt (double-click hoặc kéo vào Chrome/Edge/Firefox)
3. Xong! ✅

---



### 📊 Cải thiện giao diện Lịch sử ôn tập
- **7 ngày**: Giảm khoảng trống thừa phía dưới biểu đồ, card vừa khít nội dung
- **30 ngày**: Thu nhỏ ô heatmap để cân đối với card tiến độ học bên cạnh
- **Theo tháng**: Thu nhỏ ô lịch để hiển thị gọn gàng hơn



### 💬 Lưu lịch sử hội thoại AI
- Mỗi cuộc trò chuyện với AI được lưu tự động theo từng phiên
- Sidebar bên trái trang Chat hiển thị toàn bộ lịch sử, click để xem lại
- Nút **"✏️ Cuộc hội thoại mới"** để bắt đầu phiên mới
- Tiêu đề phiên được tự động sinh từ tin nhắn đầu tiên
- Xóa từng phiên bằng nút ✕ khi hover
- Lịch sử chat được tích hợp vào AutoSave và Export — không bao giờ mất khi chuyển thiết bị

---

## Tính năng AI (Tạo bộ thẻ & Trợ lý AI)

Cả hai tính năng đều dùng **Gemini API miễn phí** của Google.

- Lấy key miễn phí tại: https://aistudio.google.com/app/apikey
- Key có dạng: `AIza...`
- Nhập key **một lần** → tự động dùng cho cả hai tính năng

> ✅ Không cần Node.js, không cần localhost, không cần cài đặt gì thêm.


## Tính năng mới trong v63

### 🐛 Sửa lỗi & cải thiện
- **30 ngày**: Hiển thị số lượng từ đã ôn ngay trong mỗi ô heatmap
- **Theo tháng**: Sửa lỗi lịch tràn ra ngoài card và đè lên các thành phần khác
