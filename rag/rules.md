# 📜 Development Rules

## AI Agent Guidelines

1. **RAG First**: Before starting a new task, the AI must read `rag/0-INDEX.md` to understand the context.
2. **Maintenance**: Any changes to logic or architecture must be accompanied by updates to the corresponding files in the `rag/` directory. This is the "Single Source of Truth".

## Coding Standards

* **Style**:
    * Use **Functional Components** and **Hooks** for React.
    * Use **ES6+** syntax.
* **Naming**:
    * **PascalCase** for Components (e.g., `ShortcutCard`).
    * **camelCase** for variables and functions (e.g., `handleLogin`).
* **Backend**:
    * Use Express.js middleware pattern.
    * Separate database access logic (in `server/database.js`) from routes.
    * Use ES Modules (`import`/`export`).
