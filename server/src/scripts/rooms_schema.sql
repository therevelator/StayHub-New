-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    room_type ENUM('Single Room', 'Double Room', 'Twin Room', 'Suite', 'Studio', 'Apartment', 'Villa') NOT NULL,
    bed_type ENUM('Single Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Twin Beds', 'Sofa Bed') NOT NULL,
    max_occupancy INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster lookups
CREATE INDEX idx_rooms_property_id ON rooms(property_id);

-- Add sample data
INSERT INTO rooms (property_id, name, room_type, bed_type, max_occupancy, base_price, description)
VALUES 
    (1, 'Deluxe Ocean View', 'Double Room', 'King Bed', 2, 150.00, 'Spacious room with ocean view'),
    (1, 'Family Suite', 'Suite', 'Queen Bed', 4, 250.00, 'Perfect for families'),
    (2, 'Cozy Studio', 'Studio', 'Double Bed', 2, 100.00, 'Compact and comfortable');
