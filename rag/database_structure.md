# 🗄️ Database Structure

## 1. Overview

Database Management System: **SQLite** (using `better-sqlite3` library).
Data is stored at `data/shortcuts.db`.

## 2. Tables/Schemas

### `shortcuts`
Stores shortcut information.

| Column | Type | Description |
| --- | --- | --- |
| `id` | INTEGER | Primary Key, Auto Increment |
| `name` | TEXT | Display name of the shortcut (NOT NULL) |
| `url` | TEXT | URL path (NOT NULL) |
| `icon_url` | TEXT | URL or Base64 of the icon |
| `parent_label` | TEXT | Parent label (group) |
| `child_label` | TEXT | Child labels (tags, comma-separated) |
| `favorite` | INTEGER | 1 = Favorite, 0 = Not favorite |
| `clicks` | INTEGER | Click count |
| `created_at` | DATETIME | Creation timestamp (Default: Current Timestamp) |
| `tenant` | TEXT | Tenant ID (Default: 'default') |

### `label_colors`
Stores colors for labels (Parent/Child labels).

| Column | Type | Description |
| --- | --- | --- |
| `name` | TEXT | Label name (Primary Key part) |
| `tenant` | TEXT | Tenant ID (Primary Key part, Default: 'default') |
| `color_class` | TEXT | Hex color code or Class |

### `admins`
Stores administrator information.

| Column | Type | Description |
| --- | --- | --- |
| `username` | TEXT | Primary Key (Default: 'admin') |
| `password_hash` | TEXT | SHA256 password hash |
| `role` | TEXT | Role (Default: 'admin') |

### `app_config`
Stores application configuration in Key-Value format.

| Column | Type | Description |
| --- | --- | --- |
| `key` | TEXT | Configuration name (Primary Key) |
| `value` | TEXT | Configuration value |

### `click_logs`
Stores click history (cleaned up after 30 days).

| Column | Type | Description |
| --- | --- | --- |
| `id` | INTEGER | Primary Key |
| `shortcut_id` | INTEGER | Shortcut ID |
| `clicked_at` | DATETIME | Click timestamp |
