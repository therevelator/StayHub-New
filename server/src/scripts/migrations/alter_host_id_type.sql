-- Alter host_id column to VARCHAR(36) to accommodate UUIDs
ALTER TABLE properties MODIFY COLUMN host_id VARCHAR(36) NOT NULL;
