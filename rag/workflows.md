# ⚙️ Workflows

## Development

* **Start Backend**: `node server/index.js` (or `npm run start`).
* **Start Frontend**: `npm run dev` (Vite Server).
* **Install Dependencies**: `npm install`.

## Deployment

* **Method**: Docker & Docker Compose.
* **Steps**:
    1. Build & Run: `docker-compose up -d --build`.
    2. The `app` container runs both frontend (client) and backend (server).
    3. Data is persisted at the `./data` volume.
* **CI/CD**: Jenkins (already has `Jenkinsfile`).

## Testing
* Currently no automated test scripts (`npm test` is not specifically configured).
