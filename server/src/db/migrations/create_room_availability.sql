CREATE TABLE IF NOT EXISTS room_availability (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('available', 'occupied', 'maintenance', 'blocked') DEFAULT 'available',
  price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_date (room_id, date)
);
