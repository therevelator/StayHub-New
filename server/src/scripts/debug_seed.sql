-- First, clean up existing data
DELETE FROM property_rules;
DELETE FROM property_amenities;
DELETE FROM property_images;
DELETE FROM properties;

-- Insert test properties and store their IDs in variables
INSERT INTO properties 
(name, description, latitude, longitude, street, city, country, postal_code, price, rating, host_id, guests, bedrooms, beds, bathrooms, property_type, check_in_time, check_out_time, cancellation_policy)
VALUES 
-- Luxury Villa in North Bucharest
('Luxury Villa Primaverii', 'Stunning modern villa in the prestigious Primaverii area with private pool and garden', 44.4677, 26.0877, 'Strada Primaverii 50', 'Bucharest', 'Romania', '011972', 450.00, 4.9, 1, 8, 4, 5, 3, 'villa', '15:00', '11:00', 'flexible');

SET @villa_id = LAST_INSERT_ID();

INSERT INTO properties 
(name, description, latitude, longitude, street, city, country, postal_code, price, rating, host_id, guests, bedrooms, beds, bathrooms, property_type, check_in_time, check_out_time, cancellation_policy)
VALUES 
-- City Center Apartment
('Central Luxury Apartment', 'Modern apartment in the heart of Bucharest, walking distance to Old Town', 44.4368, 26.0973, 'Bulevardul Unirii 15', 'Bucharest', 'Romania', '030167', 120.00, 4.7, 1, 2, 1, 1, 1, 'apartment', '14:00', '11:00', 'moderate');

SET @apartment_id = LAST_INSERT_ID();

INSERT INTO properties 
(name, description, latitude, longitude, street, city, country, postal_code, price, rating, host_id, guests, bedrooms, beds, bathrooms, property_type, check_in_time, check_out_time, cancellation_policy)
VALUES 
-- Cozy Studio near University
('Cozy University Studio', 'Charming studio apartment near University Square, perfect for students and young professionals', 44.4359, 26.1024, 'Strada Academiei 8', 'Bucharest', 'Romania', '010131', 80.00, 4.5, 1, 2, 1, 1, 1, 'apartment', '15:00', '11:00', 'flexible');

SET @studio_id = LAST_INSERT_ID();

INSERT INTO properties 
(name, description, latitude, longitude, street, city, country, postal_code, price, rating, host_id, guests, bedrooms, beds, bathrooms, property_type, check_in_time, check_out_time, cancellation_policy)
VALUES 
-- Penthouse in Herastrau
('Herastrau Lake Penthouse', 'Luxurious penthouse with panoramic views of Herastrau Lake and Park', 44.4747, 26.0927, 'Soseaua Nordului 96', 'Bucharest', 'Romania', '014104', 350.00, 4.8, 1, 4, 2, 2, 2, 'apartment', '16:00', '10:00', 'strict');

SET @penthouse_id = LAST_INSERT_ID();

-- Insert property images using the stored IDs
INSERT INTO property_images (property_id, url, caption) VALUES
(@villa_id, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9', 'Luxury villa exterior'),
(@villa_id, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c', 'Villa pool area'),
(@apartment_id, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'Modern apartment living room'),
(@apartment_id, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2', 'Apartment bedroom'),
(@studio_id, 'https://images.unsplash.com/photo-1554995207-c18c203602cb', 'Cozy studio overview'),
(@studio_id, 'https://images.unsplash.com/photo-1630699144867-37acec97df5a', 'Studio kitchen'),
(@penthouse_id, 'https://images.unsplash.com/photo-1600607687644-c7171b42498b', 'Penthouse living area'),
(@penthouse_id, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d', 'Penthouse terrace view');

-- Insert amenities using the stored IDs
INSERT INTO property_amenities (property_id, amenity) VALUES
-- Luxury Villa amenities
(@villa_id, 'Private Pool'),
(@villa_id, 'Garden'),
(@villa_id, 'Free WiFi'),
(@villa_id, 'Air Conditioning'),
(@villa_id, 'Free Parking'),
(@villa_id, 'BBQ'),
-- City Center Apartment amenities
(@apartment_id, 'Free WiFi'),
(@apartment_id, 'Air Conditioning'),
(@apartment_id, 'Kitchen'),
(@apartment_id, 'Smart TV'),
(@apartment_id, 'Elevator'),
-- Studio amenities
(@studio_id, 'Free WiFi'),
(@studio_id, 'Kitchen'),
(@studio_id, 'Air Conditioning'),
(@studio_id, 'Study Desk'),
-- Penthouse amenities
(@penthouse_id, 'Free WiFi'),
(@penthouse_id, 'Terrace'),
(@penthouse_id, 'Air Conditioning'),
(@penthouse_id, 'Kitchen'),
(@penthouse_id, 'Free Parking'),
(@penthouse_id, 'City View');

-- Insert property rules using the stored IDs
INSERT INTO property_rules (property_id, rule) VALUES
(@villa_id, 'No smoking inside'),
(@villa_id, 'No parties or events'),
(@villa_id, 'Pets allowed'),
(@apartment_id, 'No smoking'),
(@apartment_id, 'No pets'),
(@apartment_id, 'No parties'),
(@studio_id, 'No smoking'),
(@studio_id, 'Quiet hours after 10 PM'),
(@penthouse_id, 'No smoking'),
(@penthouse_id, 'No pets'),
(@penthouse_id, 'No parties or events');
