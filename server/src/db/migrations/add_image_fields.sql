-- Add new columns to property_images table
ALTER TABLE property_images
ADD COLUMN thumbnail_url VARCHAR(255) AFTER url,
ADD COLUMN delete_url VARCHAR(255) AFTER thumbnail_url;

-- Add new columns to room_images table
ALTER TABLE room_images
ADD COLUMN thumbnail_url VARCHAR(255) AFTER url,
ADD COLUMN delete_url VARCHAR(255) AFTER thumbnail_url;
