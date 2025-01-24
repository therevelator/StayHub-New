-- Add availability_reason column to room_availability table
ALTER TABLE room_availability 
ADD COLUMN reason ENUM('available', 'booked', 'maintenance', 'blocked') NOT NULL DEFAULT 'available';

-- Update existing records where is_available is false to have 'booked' reason
UPDATE room_availability 
SET reason = 'booked' 
WHERE is_available = false;
