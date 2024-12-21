-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'USD',
    notifications JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Security table
CREATE TABLE IF NOT EXISTS user_security (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  property_type ENUM('hotel', 'apartment', 'villa', 'resort', 'guesthouse', 'hostel') NOT NULL,
  star_rating DECIMAL(2,1),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  base_price DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2),
  service_fee DECIMAL(10, 2),
  tax_rate DECIMAL(5, 2),
  guest_rating DECIMAL(3, 2),
  total_reviews INT DEFAULT 0,
  check_in_time TIME NOT NULL DEFAULT '15:00:00',
  check_out_time TIME NOT NULL DEFAULT '11:00:00',
  min_stay INT DEFAULT 1,
  max_stay INT DEFAULT 30,
  cancellation_policy ENUM('flexible', 'moderate', 'strict') NOT NULL,
  security_deposit DECIMAL(10, 2),
  host_id VARCHAR(36),
  languages_spoken JSON,
  sustainability_rating INT CHECK (sustainability_rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Property Amenities table
CREATE TABLE IF NOT EXISTS property_amenities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  category ENUM('general', 'room', 'bathroom', 'kitchen', 'outdoor', 'entertainment', 'family', 'safety', 'accessibility') NOT NULL,
  amenity VARCHAR(100) NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Room Types table
CREATE TABLE IF NOT EXISTS room_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  room_size INT NOT NULL, -- in square meters
  max_occupancy INT NOT NULL,
  bed_configuration JSON NOT NULL, -- e.g., {"king": 1, "single": 2}
  base_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  amenities JSON NOT NULL,
  room_view VARCHAR(100),
  is_accessible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property Images table
CREATE TABLE IF NOT EXISTS property_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  room_type_id INT,
  url VARCHAR(512) NOT NULL,
  caption VARCHAR(255),
  category ENUM('exterior', 'interior', 'room', 'bathroom', 'view', 'amenity', 'dining') NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

-- Property Rules table
CREATE TABLE IF NOT EXISTS property_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  category ENUM('general', 'check_in', 'pets', 'events', 'smoking', 'parking', 'noise') NOT NULL,
  rule VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property Reviews table
CREATE TABLE IF NOT EXISTS property_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  booking_id INT NOT NULL,
  overall_rating DECIMAL(2,1) NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
  accuracy_rating INT CHECK (accuracy_rating BETWEEN 1 AND 5),
  location_rating INT CHECK (location_rating BETWEEN 1 AND 5),
  check_in_rating INT CHECK (check_in_rating BETWEEN 1 AND 5),
  value_rating INT CHECK (value_rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  host_response TEXT,
  host_response_date TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Nearby Attractions table
CREATE TABLE IF NOT EXISTS nearby_attractions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('landmark', 'transport', 'shopping', 'dining', 'entertainment', 'nature') NOT NULL,
  distance DECIMAL(10, 2) NOT NULL, -- in kilometers
  travel_time INT, -- in minutes
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property Policies table
CREATE TABLE IF NOT EXISTS property_policies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  category ENUM('payment', 'cancellation', 'check_in', 'children', 'pets', 'events', 'smoking') NOT NULL,
  policy TEXT NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property Sustainability Practices table
CREATE TABLE IF NOT EXISTS sustainability_practices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  category ENUM('energy', 'water', 'waste', 'food', 'community') NOT NULL,
  practice VARCHAR(255) NOT NULL,
  description TEXT,
  certification VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property Special Features table
CREATE TABLE IF NOT EXISTS special_features (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('event_space', 'wellness', 'dining', 'activity', 'business') NOT NULL,
  description TEXT,
  pricing_details JSON,
  availability JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Meal Plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_per_person DECIMAL(10, 2) NOT NULL,
  meal_times JSON,
  cuisine_types JSON,
  dietary_options JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
