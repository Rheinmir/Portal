# Business Logic

## Domain Rules
- **Shortcuts**: The core entity. Shortcuts likely have a title, URL, icon, and category.
- **Localization**: The application supports multiple languages (VN, KZ, etc.) via JSON resource files.
- **Persistence**: Data is persisted in a local SQLite file, making it portable and simple.

## Algorithms
- **Search/Filtering**: Likely performed on the frontend or backend via SQL `LIKE` queries.
- **Image Processing**: `sharp` suggests image resizing or optimization for shortcut icons.
- **Scheduling**: `node-cron` implies background tasks, possibly for backups, cleanup, or periodic checks.

## Constraints
- **Database**: SQLite is file-based, so it's not suitable for high-concurrency write-heavy loads across multiple server instances without careful management (though `better-sqlite3` is fast).
- **Environment**: ESM modules are used throughout.
