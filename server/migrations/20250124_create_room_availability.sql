-- Create room_availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS room_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    price DECIMAL(10,2),
    reason ENUM('available', 'booked', 'maintenance', 'blocked') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    UNIQUE KEY unique_room_date (room_id, date)
);
