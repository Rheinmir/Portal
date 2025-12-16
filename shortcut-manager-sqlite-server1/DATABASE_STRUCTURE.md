# Cấu trúc Database (SQLite)
Hệ thống sử dụng **Better-SQLite3** với một file CSDL duy nhất (`data/shortcuts.db`).

## 1. Bảng `shortcuts`
Lưu trữ thông tin các ứng dụng (shortcut) được hiển thị trên Dashboard.

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `id` | INTEGER | Primary Key, Auto Increment |
| `tenant` | TEXT | Phân vùng dữ liệu (Default: 'default') |
| `name` | TEXT | Tên hiển thị của Shortcut |
| `url` | TEXT | Đường dẫn URL đích |
| `icon_url` | TEXT | URL icon (hoặc base64) |
| `icon_64`, `128`, `256` | TEXT | Icon đã resize (Future use) |
| `parent_label` | TEXT | Nhóm cha (VD: Work, Tools) |
| `child_label` | TEXT | Nhóm con/Tag (VD: Dev, Doc) |
| `favorite` | INTEGER | Đánh dấu yêu thích (0/1) |
| `clicks` | INTEGER | Số lượt click |
| `created_at` | DATETIME | Thời gian tạo |
| `sort_index` | INTEGER | Thứ tự sắp xếp tùy chỉnh |

## 2. Bảng `label_colors`
Lưu trữ màu sắc cho các nhóm (Parent Labels).

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `name` | TEXT | Tên nhóm (Parent Label) |
| `tenant` | TEXT | Phân vùng dữ liệu |
| `color_class` | TEXT | Mã màu HEX (VD: #009FB8) |
| **PK** | | (name, tenant) |

## 3. Bảng `app_config`
Lưu trữ cấu hình toàn cục của hệ thống.

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `key` | TEXT | Tên cấu hình (PK) |
| `value` | TEXT | Giá trị cấu hình |

**Các cấu hình quan trọng:**
- `utc_offset`: Múi giờ server (VD: 7)
- `default_background`: URL ảnh nền mặc định
- `config_version`: Phiên bản cấu hình (dùng để sync client)

## 4. Bảng `admins`
Lưu trữ tài khoản quản trị.

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `username` | TEXT | Tên đăng nhập (PK) |
| `password_hash` | TEXT | Mật khẩu (SHA-256) |
| `role` | TEXT | Vai trò (mặc định 'admin') |

## 5. Bảng `click_logs`
Lưu lịch sử click chi tiết để vẽ biểu đồ thống kê.

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `id` | INTEGER | PK |
| `shortcut_id` | INTEGER | ID của shortcut được click |
| `clicked_at` | DATETIME | Thời điểm click |

---

# Quy trình Xử lý Optimistic UI (Favorite)

Để đảm bảo trải nghiệm người dùng mượt mà ("ấn phát lên luôn"), hệ thống áp dụng kỹ thuật **Optimistic UI Updates**.

**Luồng xử lý:**

1.  **User Action**: Người dùng ấn vào ngôi sao (Favorite).
2.  **Immediate Update (Client)**: 
    - React ngay lập tức cập nhật state local (`shortcuts`) trong bộ nhớ.
    - Ngôi sao đổi màu **ngay lập tức** (0 độ trễ).
3.  **Background Sync**:
    - Gọi API `/api/favorite/:id` ngầm bên dưới.
4.  **Error Handling (Rollback)**:
    - Nếu API trả về lỗi (mất mạng, server error), React sẽ **revert** (quay lui) state về trạng thái cũ và hiện thông báo lỗi nhẹ nhàng.

**Code minh họa (React):**

```javascript
const handleToggleFavorite = async (id, e) => {
    e.stopPropagation();
    
    // 1. Snapshot trạng thái cũ (để revert nếu lỗi)
    const oldShortcuts = [...shortcuts];
    
    // 2. Optimistic Update (Cập nhật ngay lập tức)
    setShortcuts(prev => prev.map(s => 
        s.id === id ? { ...s, favorite: s.favorite ? 0 : 1 } : s
    ));

    try {
        // 3. Gọi API ngầm
        const res = await fetch(`/api/favorite/${id}`, { method: 'POST' });
        if (!res.ok) throw new Error("Sync failed");
        
        // (Optional) Silent fetch lại data thật để đảm bảo nhất quán
        // fetchData(); 
    } catch (err) {
        // 4. Rollback nếu lỗi
        setShortcuts(oldShortcuts);
        console.error("Favorite sync failed:", err);
        // Có thể show toast error nhỏ ở góc
    }
};
```
