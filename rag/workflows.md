# Workflows

## Development
- **Start Development Server**:
    ```bash
    npm run dev
    ```
    Starts the Vite development server for the frontend.
- **Start Backend Server**:
    ```bash
    npm run start
    # or
    node server/index.js
    ```
    Starts the Express server.

## Building
- **Build Frontend**:
    ```bash
    npm run build
    ```
    Compiles the React application into static assets in the `dist/` directory using Vite.

## Deployment
- **Docker**:
    - Build and Run:
        ```bash
        npm run docker:build
        # or
        docker-compose up -d --build
        ```
    - The `Dockerfile` and `docker-compose.yml` define the containerized environment.
- **CI/CD**:
    - A `Jenkinsfile` exists, indicating a Jenkins-based CI/CD pipeline.

## Testing
- Currently, no specific test scripts (`test`) are defined in `package.json`. Testing is likely manual or part of the `docker:build` verification process.
