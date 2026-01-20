# 🧠 Business Logic

## Domain Rules

* **Shortcuts**: The main entity of the system.
    * Attributes: `name`, `url`, `icon` (URL/Upload), `parent/child labels`.
    * **Favicon Fetching**: The system can automatically fetch icons from URLs or allow users to upload their own.
* **Localization**: Supports multiple languages (VN, KZ, EN...) through JSON resource files (`src/locales`).
* **Persistence**: Data is stored locally in a SQLite file (`data/shortcuts.db`), ensuring portability and simplicity.
* **Click Tracking**: The system counts shortcut clicks (`clicks`) and saves logs (`click_logs`). Logs are automatically cleaned up after 30 days.

## Algorithms & Logic

* **Search/Filtering**: Search shortcuts by name or tag (frontend/backend).
* **Image Processing**: Uses `sharp` to resize/optimize icons.
* **Scheduling**: `node-cron` runs background tasks (e.g., log cleanup).
