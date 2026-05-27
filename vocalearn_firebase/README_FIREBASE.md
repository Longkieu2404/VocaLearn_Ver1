# 🔥 Hướng dẫn tích hợp Firebase cho VocaLearn

## Các thay đổi so với bản gốc

| File | Thay đổi |
|------|----------|
| `js/firebase.js` | **Mới** – Module Firebase Auth + Firestore sync |
| `js/app.js` | Thay `setupAutoSaveUI()` → `setupFirebaseUI()` |
| `index.html` | Thêm `<script type="module" src="js/firebase.js">`, đổi panel Autosave thành Firebase Login |
| `firestore.rules` | **Mới** – Security rules cho Firestore |

---

## Bước 1 – Tạo Firebase Project

1. Vào [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Nhấn **"Add project"** → Đặt tên → Tạo project
3. Trong project, vào **Project Settings** (⚙️) → tab **General**
4. Cuộn xuống **"Your apps"** → nhấn icon `</>` (Web)
5. Đặt nickname → nhấn **"Register app"**
6. **Copy toàn bộ `firebaseConfig`** hiển thị

---

## Bước 2 – Điền config vào `js/firebase.js`

Mở file `js/firebase.js`, tìm đoạn:

```js
const FIREBASE_CONFIG = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  ...
};
```

Thay bằng config vừa copy từ Firebase Console.

---

## Bước 3 – Bật Google Authentication

1. Firebase Console → **Authentication** → **Sign-in method**
2. Nhấn **Google** → Enable → Save
3. (Tuỳ chọn) Thêm email của bạn vào Authorized domains nếu deploy lên domain riêng

---

## Bước 4 – Tạo Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Chọn **"Start in production mode"** → chọn region gần nhất (ví dụ `asia-southeast1`)
3. Sau khi tạo xong, vào tab **Rules**
4. Xoá nội dung cũ, dán nội dung từ file `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Nhấn **Publish**

---

## Bước 5 – Thêm Authorized Domain (khi deploy)

Nếu chạy trên domain riêng (không phải localhost):

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Nhấn **Add domain** → nhập domain của bạn

> Localhost đã được thêm sẵn, không cần làm gì khi chạy local.

---

## Cách hoạt động

```
Người dùng thay đổi dữ liệu
        ↓
Storage.saveSets() / saveProgress() / ...
        ↓
FirebaseSync.triggerSave()  ← debounce 2 giây
        ↓
Firestore: /users/{uid}  ← ghi toàn bộ snapshot
```

- **Mở app lần đầu sau đăng nhập** → tải dữ liệu từ Firestore về
- **Mọi thay đổi sau đó** → tự động push lên Firestore sau 2 giây
- **Chưa đăng nhập** → vẫn hoạt động bình thường với localStorage

---

## Cấu trúc dữ liệu Firestore

```
/users/{userId}
  ├── sets: [...] 
  ├── progress: {...}
  ├── stats: { daily: {...}, dailyCards: {...} }
  ├── streak: { count: N, lastDate: "YYYY-MM-DD" }
  ├── trash: [...]
  ├── username: "..."
  ├── chatSessions: [...]
  ├── updatedAt: Timestamp
  └── version: 2
```

---

## Lưu ý quan trọng

- **Dữ liệu local không bị xoá** – localStorage vẫn được dùng như bình thường, Firebase chỉ là lớp đồng bộ thêm vào.
- **Merge strategy**: lần đăng nhập đầu tiên sẽ đẩy toàn bộ dữ liệu local lên cloud. Các lần sau sẽ tải từ cloud về (cloud là nguồn sự thật).
- **Free tier Firestore** đủ dùng cho cá nhân (50K reads/ngày, 20K writes/ngày).
