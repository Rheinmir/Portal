# Shortcut Manager (SQLite Server)

A self-hosted, personal dashboard for managing web shortcuts. Features a modern React UI, dark mode, and detailed usage insights.

## Features
- **Dashboard**: Grid view of shortcuts with customizable icons and colors.
- **Admin Mode**: Manage shortcuts, bulk import/export, and customize text/background.
- **Insights**: Track click history, top apps, and usage trends.
- **Theming**: Dark mode support, custom background images/videos.
- **SQLite Database**: Single-file database for easy backup and migration.

## Installation

### 1. Prerequisites
- Node.js (v18 or later)
- NPM or Yarn

### 2. Setup
```bash
# Install dependencies
npm install

# Start development server (Frontend + Backend)
# Note: You may need to run backend and frontend separately if not configured concurrently.
npm run dev   # For frontend
npm start     # For backend
```

### 3. Docker Support
The project includes a `Dockerfile` and `docker-compose.yml` for containerized deployment.
```bash
docker-compose up -d --build
```

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

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Recharts, Lucide React.
- **Backend**: Node.js, Express.
- **Database**: Better-SQLite3.
