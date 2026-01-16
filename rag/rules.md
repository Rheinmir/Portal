# Rules

## Coding Standards
- **Language**: JavaScript (ES6+), JSX for React components.
- **Frontend**:
    - Functional Components with Hooks.
    - Tailwind CSS for styling.
    - Context API for global state (e.g., Language).
- **Backend**:
    - Express.js middleware pattern.
    - `better-sqlite3` for synchronous, efficient database ops.
    - ES Modules (`"type": "module"` in package.json).

## Architecture Rules
- Keep frontend and backend logic separate.
- Use `src/locales` for all text content to support i18n.
- Database access should be encapsulated in `server/database.js` or similar modules, not scattered in routes.

## AI Agent Guidelines
1.  **RAG Maintenance**: ANY modification to the codebase (logic, architecture, workflows) MUST be accompanied by an update to the corresponding file in the `rag/` directory. This ensures the context remains the single source of truth.
2.  **Session Start**: At the beginning of every new chat or session, the AI MUST read `rag/rules.md` first to align with project standards.
