# Shortcut Manager (SQLite Server)
A self-hosted, personal dashboard for managing web shortcuts. Features a modern React UI, dark mode, and detailed usage insights.

**Features:**
- **Dashboard**: Grid view of shortcuts with customizable icons and colors.
- **Launchpad Mode**: macOS-style grid layout with large icons and simplified interface for focused access.
- **Admin Mode**: Manage shortcuts, bulk import/export, and customize text/background.
- **Insights**: Track click history, top apps, and usage trends.
- **Theming**: Dark mode support, custom background images/videos.
- **SQLite Database**: Single-file database for easy backup and migration.
- **Performance Optimized**: Code splitting, lazy loading, and search debouncing for a snappy experience on any device.

Based on [React](https://react.dev/) and [Express](https://expressjs.com/).

Environment used:
 - Node.js: v18 or later
 - Vite: v5
 - TailwindCSS: v3
 - Better-SQLite3: v9

## Getting Started

### Create a `.env` file (Optional)
```dotenv
PORT=5464
```

### Install dependencies
```bash
npm install
```

### Run the development server:
```bash
# Terminal 1: Start Backend
npm start

# Terminal 2: Start Frontend
npm run dev
```

Open [http://localhost:5173] with your browser to see the result.

## Usage

### Admin Access
- **Default Username**: `admin`
- **Default Password**: `miniappadmin`
*(Note: Please change these or secure your instance if exposed to the public internet)*

### Insight Features
Click the chart icon in the bottom-right menu (Admin only) to view:
- Top 10 most used apps.
- Activity timeline (last 7 days).
- Hourly usage distribution.

### Docker Support
The project includes a `Dockerfile` and `docker-compose.yml` for containerized deployment.
```bash
docker-compose up -d --build
```
