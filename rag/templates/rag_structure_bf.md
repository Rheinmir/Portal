# Generic RAG Context Structure Template

This guide describes how to create a standardized `rag` context for ANY project. This ensures that AI agents can quickly understand the project state, architecture, and rules without needing re-training.

## 📂 Folder Structure
Create a directory named `rag` at the root of your project. Inside, create the following markdown files:

```text
project_root/
└── rag/
    ├── architecture.md
    ├── workflows.md
    ├── rules.md
    ├── tech_stack.md
    ├── DATABASE_STRUCTURE.md
    ├── COMPONENT_ARCHITECTURE.md
    ├── business_logic.md
    └── templates/
        ├── README_template.md   
        ├── DATABASE_STRUCTURE_template.md
        ├── COMPONENT_ARCHITECTURE_template.md
        └── random_component1_UI_UX_template.md
└── README.md    
```
🏛️ 1. ARCHITECTURE (rag/architecture.md)
Purpose: Explain "How it works" and "How it's organized".

## System Context
[Description of the system's boundaries and its interactions with external systems/users]

## High-Level Diagram
```mermaid
graph TD
    [Client] --> [Server]
    [Server] --> [Database]
```

## Directory Structure
- **`src/`**: [Description]
- **`server/`**: [Description]
- **`rag/`**: RAG context and documentation.

## Key Data Flows
1. [Flow name]: [Step 1] -> [Step 2]

⚙️ 2. WORKFLOWS (rag/workflows.md)
Purpose: Explain "How to run/build/deploy it".

## Development
- **Start Command**:
    ```bash
    [command]
    ```
    [Description]

## Building
- **Build Command**:
    ```bash
    [command]
    ```

## Deployment
- **Method**: [Docker/Vercel/etc.]
- **Steps**:
    1. [Step 1]

## Testing
- **Test Command**:
    ```bash
    [command]
    ```

📜 3. RULES (rag/rules.md)
Purpose: Explain "How to write code here".

## Coding Standards
- **Style**: [e.g., Use ES6+]
- **Naming**: [e.g., PascalCase for components]

## Architecture Rules
- [Rule 1, e.g., "Business logic must be in /services"]

## Git Flow
- **Branches**: `main` (prod), `dev` (staging)
- **Commits**: Conventional Commits (e.g., `feat: ...`, `fix: ...`)

## AI Agent Guidelines
1. **RAG Maintenance**: ANY modification to the codebase (logic, architecture, workflows) MUST be accompanied by an update to the corresponding file in the `rag/` directory. This ensures the context remains the single source of truth.
2. **Session Start**: At the beginning of every new chat or session, the AI MUST read `rag/rules.md` first to align with project standards.

🛠️ 4. TECH STACK (rag/tech_stack.md)
Purpose: Explain "What is it built with".

## Core Engine
- [Language]: [Version]
- [Framework]: [Key Framework]

## Libraries
- [Lib 1]: [Purpose]
- [Lib 2]: [Purpose]

## Infrastructure
- [Database]: [Type]
- [Hosting]: [Platform]

🧠 5. BUSINESS LOGIC (rag/business_logic.md)
Purpose: Explain "What are the rules/formulas/algorithms".

## Domain Rules
- [Rule 1]: [Description]

## State Machine
- [State A] -> [Event] -> [State B]

## Algorithms
- [Name]: [Description]

🚀 Usage Guide
Initialize: Create the rag/ folder and files immediately.

Populate: Use an AI Agent to scan the codebase and fill in the placeholders above.

Maintain: Add a rule in rules.md to update these files whenever code changes.

## random_component1_UI_UX_template.md
# Component Name UI/UX Specification
Base on what prompt describe name of the component, make a general template of UI/UX of this component, which can be used as a reference for the future using(using new created template, AI model can make the same UI/UX in other projects mapping field/values of the new needs).
## Overview
Brief description of the component's purpose. 

## Visual Design
- **Layout**:
- **Colors**:
- **Typography**:

## Interactions
- **States**: (Default, Hover, Active, Disabled, Loading)
- **Animations**:
- **Events**:

## Accessibility
- **ARIA Roles**:
- **Keyboard Navigation**:

## Usage Example
```tsx
<Component />
```

## README_template.md
## README.md (read project then put this file on root folder, value base on what project using, this is the true README.md)
# [Project Name]
[Brief description of what the project does]
Based on [[Core Technology/Framework]]([URL]) and [[Secondary Technology]]([URL]).

Environment used:
 - [Tool/Language]: [Version] (e.g., Node.js v20, or "Browser-based" for static)
 - [Framework/Library]: [Version] (e.g., Next.js v14, Tailwind v3)
 - [Key Dependency]: [Version]
 (List only keys relevant to the project's runtime. If a tool like 'npm' is not applicable, omitting it is preferred over listing 'N/A'.)

## Getting Started 

### Create a `.env.local` file
```dotenv
 [VARIABLE_NAME]=[value]
```

### Install dependencies
```bash
npm install
# or
yarn
# or
pnpm install
```

### Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


Open [http://localhost:3000] (3000 or what project run on) with your browser to see the result.

## DATABASE_STRUCTURE.md (read project then put this file in rag folder, value base on what project using)

This template defines the standard documentation format for database architecture in any project. This structure ensures clarity on data storage, initialization, and schema design.

## 1. Database Overview (Mandatory)
Start by specifying the database technology and general architecture.

**Example:**
> The system uses **PostgreSQL** hosted on AWS RDS. It follows a single-tenant architecture with separate schemas for different environments.

## 2. Initialization & Setup (Mandatory)
Describe how to initialize the database, apply migrations, or set up the initial connection.

**Content to include:**
- Connection strings/Env variables (without secrets).
- Commands to run migrations/seeds.
- Location of database files (if SQLite) or Docker setup.

## 3. Table Structure (Mandatory)
List all key tables with their columns, data types, and primary/foreign keys.

### [Table Name]
Description of what this table stores.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER | Primary Key, Auto Increment |
| `column_name` | TEXT | Description of the field |
| `foreign_id` | INTEGER | FK -> OtherTable.id |
| `created_at` | DATETIME | Creation timestamp |

### [Another Table Name]
...

## 4. Relationships (Optional)
Describe key relationships (One-to-Many, Many-to-Many) or provide an ER Diagram.

## 5. Performance & Indexing (Optional)
List important indexes or performance considerations.

## 6. Backup & Security (Optional)
Describe backup strategies and security policies (e.g., encryption at rest).

## COMPONENT_ARCHITECTURE.md (read project then put this file in rag folder, value base on what project using)
# Component Architecture & Usage Guide

This document defines the architecture of the frontend components, explaining the responsibility of each component and its integration into the main application.

## 1. [Component Name] (`src/components/[Component].jsx`)

**Functionality**:
- Describe the primary purpose of this component.
- List key features (e.g., specific interactions, visual elements, logic handling).
- Mention any libraries or hooks it relies on heavily.

**Usage in `[ParentComponent].jsx`**:
Describe where and how this component is rendered.
```jsx
<Component 
  prop1={value1}         // Description of prop1
  prop2={value2}         // Description of prop2
  onAction={handleAction} // Handler description
/>
```

---

## 2. [Another Component] (`src/components/[Another].jsx`)

**Functionality**:
- ...
- ...

**Usage in `[ParentComponent].jsx`**:
```jsx
<Another 
  data={data}
  isVisible={true}
/>
```

---

## 3. [Group of Components] (e.g., Modals)

### [SubComponent A]
**Functionality**: ...
**Usage**:
```jsx
<SubComponentA ... />
```

### [SubComponent B]
**Functionality**: ...
**Usage**:
```jsx
<SubComponentB ... />
```

---

## Guidelines
- **Granularity**: Document every reusable component.
- **Context**: Explain *why* a component exists, not just *what* it is.
- **Props**: Document the most important props and their expected types/values in the usage example.
