# Migration Safety Rules

## GOLDEN RULES — NO EXCEPTIONS

1. **NEVER** use `DROP TABLE`, `DROP COLUMN`, `DROP INDEX`, `DROP DATABASE`
2. **NEVER** use `DELETE FROM` or `TRUNCATE TABLE` in migrations
3. **NEVER** modify existing column types without explicit manual approval
4. **NEVER** rename tables or columns (create new + copy if needed)

## Allowed Operations

```sql
-- Creating tables
CREATE TABLE IF NOT EXISTS table_name (...);

-- Adding columns
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE DEFAULT value;

-- Adding indexes
CREATE INDEX IF NOT EXISTS idx_name ON table_name (column);

-- Inserting seed data (idempotent)
INSERT INTO table_name (...) VALUES (...) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Updating existing data (safe)
UPDATE table_name SET column = value WHERE condition;
```

## File Naming

```
migrations/NNN_description.sql
```

Example: `migrations/013_add_notifications_read_at.sql`

## Manual-Only Operations

These require direct DB access (`ssh sushinari "mysql -u swiftapp_user -p swiftapp"`):

- Dropping columns or tables
- Changing column types
- Deleting data
- Any destructive schema change
