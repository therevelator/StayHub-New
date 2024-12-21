-- Drop the bed_type column and add back the beds JSON column
ALTER TABLE rooms
    DROP COLUMN bed_type,
    ADD COLUMN beds JSON;
