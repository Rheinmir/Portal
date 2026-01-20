# Database Structure Template

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
