# Hanzi — Flashcard tiếng Trung

Web app tĩnh, không cần cài framework hay máy chủ. Tạo collection, thêm flashcard, chọn style, ôn tập bằng cách bấm thẻ để lật. Dữ liệu được lưu trong `localStorage` của trình duyệt hiện tại.

## Chạy thử

Mở `index.html` trong trình duyệt. Để xem đúng cách GitHub Pages phục vụ thư mục, có thể chạy một static server trong thư mục này, ví dụ `python -m http.server 8000`, rồi mở `http://localhost:8000`.

## Deploy bằng GitHub Pages

1. Tạo repository GitHub mới, ví dụ `flashcard-trung`.
2. Đưa các tệp trong thư mục này (`index.html`, `style.css`, `app.js`, `README.md`) lên repository.
3. Vào **Settings → Pages**.
4. Ở **Build and deployment**, chọn **Deploy from a branch**, branch `main`, folder `/(root)`, rồi **Save**.
5. Mở địa chỉ Pages do GitHub hiển thị. Trên iPhone, mở bằng Safari → **Chia sẻ → Thêm vào Màn hình chính**.

## Lưu trữ dữ liệu

- Collection và flashcard được lưu tự động trên trình duyệt, gắn với domain GitHub Pages đó.
- Dữ liệu không đồng bộ sang thiết bị hoặc trình duyệt khác. Xoá dữ liệu website trong Safari cũng có thể xoá flashcard.
- Nút biểu tượng `⇅` ở đầu trang để tải JSON sao lưu; bấm Cancel để chọn tệp JSON và khôi phục. Khôi phục thay thế dữ liệu hiện tại trên trình duyệt.
- Không chứa mật khẩu hay thông tin nhạy cảm trong thẻ. GitHub Pages chỉ host giao diện; không có tài khoản hoặc cơ sở dữ liệu dùng chung.

## Cấu trúc

- `index.html` — khung giao diện và form.
- `style.css` — giao diện responsive cho máy tính và iPhone.
- `app.js` — collection, flashcard, ôn tập, localStorage và sao lưu/khôi phục.
