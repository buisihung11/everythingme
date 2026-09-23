# Hearth · System Design Village

Ứng dụng học System Design bằng làng 3D, viết bằng TypeScript, Three.js và Vite. Asset hình khối và linh thú được tạo bằng code, không sử dụng asset của Harvest Moon/Pokémon.

## Chạy độc lập

```sh
cd apps/architecture-village
npm install --workspaces=false
npm run dev
```

Mở http://localhost:4310. `npm run build` kiểm tra TypeScript và tạo `dist/`. `npm test` được giữ như bước tương thích CI và không chạy automated tests cho app này. Cũng có thể chạy `pnpm nx dev architecture-village` từ workspace sau khi cài dependencies.

## Chức năng

- 10 công trình 3D, xoay/zoom, raycast chọn công trình và nút nhãn truy cập bằng bàn phím.
- 10 phòng thí nghiệm tương tác: rate limit, round robin, capacity, TTL, transaction, backlog, multipart, CDN, hash ring và replica lag.
- 10 bài học tiếng Việt, 20 câu quiz riêng có giải thích, điểm tốt nhất và huy hiệu lưu localStorage.
- Linh thú đi theo kịch bản đọc bảng tin hoặc upload ảnh; ngày/đêm, tạm dừng.
- Điều chỉnh tải, số app replica, cache, lỗi một app replica. Chỉ số served/error/rate limit, DB reads, latency và backlog.
- Responsive; khi WebGL không khả dụng vẫn sử dụng bài học và quiz qua danh sách.

## Phạm vi mô phỏng

Đây là mô hình giảng dạy định lượng giản lược, không phải benchmark hay backend phân tán thật. Gateway nhận tối đa 180 req/s; mỗi app replica xử lý 60 req/s; DB 70 req/s; worker 25 jobs/s. Khi bật cache ở kịch bản đọc, CDN hit 25%, cache app hit 75% lượng request vào app. Latency hiển thị là trung bình có trọng số của lượt phục vụ thành công, không gồm lượt bị từ chối hay queue wait. Hoạt ảnh linh thú minh họa các đường đi tiêu biểu, không biểu diễn từng request hoặc chính xác số lỗi. Upload trực tiếp đến object storage được minh họa bằng hoạt ảnh, còn bảng chỉ số giản lược mỗi upload thành một đơn vị xử lý/metadata và một job. Sharding, replication, CAP và realtime có bài học và quiz; không giả lập consensus hoặc network partition. Sự cố trong bảng điều khiển chỉ giảm một app replica.

## Nguồn học

Chủ đề tham khảo từ [Hello Interview](https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction), Core Concepts, Key Technologies và Common Patterns. Mỗi bài có đường dẫn đọc sâu. Phần giải thích tiếng Việt và quiz được viết riêng; không sao chép giáo trình trả phí. Dự án độc lập, không được Hello Interview bảo trợ.

Font Google Fonts là tùy chọn; có sans-serif fallback. Tiến độ chỉ lưu trên thiết bị, không có đăng nhập hoặc đồng bộ cloud.
