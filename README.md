# BIBPIX — Running Event Photo Gallery

Website gallery ảnh giải chạy bằng **Next.js + Tailwind CSS + MongoDB + Google Drive API**.

Phase này **không có** tìm BIB, nhận diện khuôn mặt, tìm theo ảnh, upload ảnh qua website, payment hay user account. Ảnh được upload trực tiếp vào từng folder Google Drive; website chỉ index metadata vào MongoDB.

## Kiến trúc

- **Google Drive**: lưu file ảnh gốc.
- **MongoDB**: lưu event metadata + photo index (`driveFileId`, tên file, kích thước, thứ tự...). Không lưu binary ảnh.
- **Next.js**: public website, admin, API, auth, Google Drive proxy.
- **Gallery**: phân trang cố định **60 ảnh/trang**, URL trực tiếp dạng `/events/slug?page=7`. Có ô “Đi đến trang” để nhảy thẳng đến page bất kỳ.
- **Sync Drive**: chạy tuần tự từng batch 500 file để tránh một request quá dài trên Vercel serverless. Không dùng `concurrently`.

## Tính năng đã có

### Public
- Homepage có hero event mới nhất.
- Featured events.
- Danh sách event có phân trang.
- Event gallery có page index, previous/next, jump-to-page.
- Responsive 2/3/5/6 cột tùy màn hình.
- Lightbox ảnh lớn, ESC, phím trái/phải.
- Ảnh được stream qua server; Google credentials không lộ ra browser.

### Admin
- `/admin/login`.
- Tạo / sửa / xoá event.
- Paste Google Drive folder URL hoặc folder ID.
- Sync Google Drive vào MongoDB.
- Sync incremental bằng upsert theo `driveFileId`, không xoá hết rồi insert lại.
- Ảnh đã bị xoá khỏi Drive sẽ được xoá khỏi photo index khi sync hoàn tất.
- Chọn thumbnail từ ảnh của event, có phân trang thumbnail.
- Draft / Published.
- Featured + sort order.
- Nếu thumbnail đã bị xoá khỏi Drive thì sync sẽ clear thumbnail đó.

## 1. Yêu cầu môi trường

- Node.js 20+ (khuyên dùng Node 20 hoặc 22).
- MongoDB Atlas hoặc MongoDB local.
- Google Cloud project có bật Google Drive API.
- Google Service Account.

## 2. Cài đặt

```bash
npm install
cp .env.example .env.local
```

Điền `.env.local`:

```env
MONGGO_URI=mongodb+srv://...

GOOGLE_PROJECT_ID=...
GOOGLE_CLIENT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-local-password
SESSION_SECRET=at-least-32-random-characters

NEXT_PUBLIC_SITE_NAME=BIBPIX
```

App ưu tiên biến `MONGGO_URI` đúng theo tên bạn yêu cầu. `MONGO_URI` cũng được support làm fallback.

## 3. Google Drive setup

1. Vào Google Cloud Console.
2. Tạo/select project.
3. Enable **Google Drive API**.
4. Tạo **Service Account**.
5. Tạo JSON key cho service account.
6. Copy `project_id`, `client_email`, `private_key` sang `.env.local`.
7. Với mỗi folder event trên Google Drive, bấm **Share** và thêm email trong `GOOGLE_CLIENT_EMAIL` với quyền **Viewer**.

Folder có thể chứa rất nhiều ảnh. App list toàn bộ file theo từng batch 500 item và chỉ index những file có MIME type bắt đầu bằng `image/`.

## 4. Admin password production

Local có thể dùng `ADMIN_PASSWORD`. Khi deploy production nên dùng hash:

```bash
npm run hash-password -- "your-strong-password"
```

Copy output vào:

```env
ADMIN_PASSWORD_HASH=$2a$12$...
```

Sau đó bỏ `ADMIN_PASSWORD` khỏi production env.

Tạo `SESSION_SECRET`:

```bash
openssl rand -base64 48
```

## 5. Chạy local

```bash
npm run dev
```

Mở:

- Public: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

Không có script `concurrently` và không cần chạy backend riêng.

## 6. Workflow tạo giải chạy

1. Upload toàn bộ ảnh vào một folder Google Drive.
2. Share folder cho Service Account.
3. Vào `/admin/events/new`.
4. Nhập tên, ngày, location, description.
5. Paste Google Drive folder URL.
6. Bấm **Tạo event & sync Drive**.
7. Browser sẽ gọi sync tuần tự từng batch; progress hiển thị số ảnh đã xử lý.
8. Sau khi sync xong, app chuyển sang edit page.
9. Chọn một ảnh làm thumbnail.
10. Chuyển status sang `Published` và lưu.

Nếu sau đó photographer upload thêm ảnh: vào edit event → **Sync Google Drive**.

## 7. Gallery page index

Mỗi page có 60 ảnh:

```text
/events/world-entrepreneur-tournament-2026
/events/world-entrepreneur-tournament-2026?page=2
/events/world-entrepreneur-tournament-2026?page=37
```

Có page numbers, prev/next và input “Đi đến trang”, nên không cần scroll/load qua các page trước.

## 8. MongoDB collections

### events

Các field chính:

```text
name
slug
description
eventDate
location
driveFolderId
thumbnailFileId
photoCount
featured
sortOrder
status
lastSyncedAt
syncRunId
syncProcessed
syncStatus
```

### photos

```text
eventId
driveFileId
fileName
mimeType
size
width
height
driveCreatedTime
driveModifiedTime
position
syncRunId
```

Indexes quan trọng:

- unique `(eventId, driveFileId)`
- `(eventId, position, _id)`
- `(eventId, syncRunId)`

`position` giữ thứ tự file theo Drive `name_natural`, giúp pagination ổn định.

## 9. Deploy Vercel

1. Push source lên Git provider hoặc import project vào Vercel.
2. Set toàn bộ env variables ở Vercel Project Settings.
   Với `GOOGLE_PRIVATE_KEY`, dán riêng giá trị `private_key` trong JSON của service account, gồm cả `BEGIN/END PRIVATE KEY`, không dán cả JSON hoặc dấu ngoặc kép bên ngoài. Chọn môi trường **Production** và redeploy sau khi sửa env.
3. MongoDB Atlas phải cho phép kết nối từ Vercel (thường dùng Network Access phù hợp cho serverless).
4. Deploy bằng build mặc định:

```bash
npm run build
```

Không cần process thứ hai, PM2 hay `concurrently`.

### Lưu ý Vercel và ảnh

Public gallery dùng `next/image` với nguồn nội bộ `/api/images/:driveFileId`. Route này xác nhận file thuộc event, sau đó server đọc file bằng Google Drive credentials. Response có cache headers.

Với traffic rất lớn, bước scale tiếp theo hợp lý là chuyển thumbnail/original sang object storage/CDN chuyên dụng. Phase hiện tại vẫn giữ đúng requirement: Google Drive là image storage.

## 10. BIB phase sau

Schema hiện tại tách `photos` riêng để sau này có thể thêm collection kiểu:

```text
bib_detections
- eventId
- photoId
- bibNumber
- confidence
- boundingBox
```

Phase hiện tại chưa implement bất kỳ BIB/OCR/AI nào.
