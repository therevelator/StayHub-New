use stayhub;
-- Insert the property
INSERT INTO properties (
  name,
  description,
  latitude,
  longitude,
  street,
  city,
  state,
  country,
  postal_code,
  host_id,
  guests,
  bedrooms,
  beds,
  bathrooms,
  property_type,
  check_in_time,
  check_out_time,
  cancellation_policy,
  pet_policy,
  event_policy
) VALUES (
  'Bucharest Inn',
  'Luxurious hotel in the heart of Bucharest with modern amenities and stunning city views',
  44.4268,
  26.1025,
  'Strada Victoriei 25',
  'Bucharest',
  'Sector 1',
  'Romania',
  '010063',
  '9964492f-40d0-4011-a65e-e4dbada354a1', -- Replace with actual host_id
  4,
  2,
  3,
  2,
  'apartment',
  '14:00:00',
  '12:00:00',
  'flexible',
  'Pets allowed with deposit',
  'Events allowed with prior approval'
);

-- Get the inserted property ID
SET @property_id = LAST_INSERT_ID();

-- Insert rooms
INSERT INTO rooms (
  property_id,
  name,
  room_type,
  beds,
  max_occupancy,
  base_price,
  cleaning_fee,
  service_fee,
  tax_rate,
  security_deposit,
  description
) VALUES
(
  @property_id,
  'Deluxe Double Room',
  'Double Room',
  JSON_ARRAY(
    JSON_OBJECT(
      'type', 'Double Bed',
      'count', 1
    ),
    JSON_OBJECT(
      'type', 'Sofa Bed',
      'count', 1
    )
  ),
  3,
  150.00,
  30.00,
  20.00,
  19.00,
  100.00,
  'Spacious room with city view'
),
(
  @property_id,
  'Single Room',
  'Single Room',
  JSON_ARRAY(
    JSON_OBJECT(
      'type', 'Single Bed',
      'count', 1
    )
  ),
  1,
  100.00,
  20.00,
  15.00,
  19.00,
  50.00,
  'Cozy room perfect for solo travelers'
);

-- Insert amenities
INSERT INTO property_amenities (property_id, amenity, category) VALUES
(@property_id, 'WiFi', 'general'),
(@property_id, 'Air Conditioning', 'general'),
(@property_id, 'TV', 'room'),
(@property_id, 'Mini Bar', 'room'),
(@property_id, 'Hair Dryer', 'bathroom'),
(@property_id, 'Rain Shower', 'bathroom'),
(@property_id, 'Coffee Maker', 'kitchen'),
(@property_id, 'Microwave', 'kitchen'),
(@property_id, 'Balcony', 'outdoor'),
(@property_id, 'City View', 'outdoor'),
(@property_id, 'Elevator', 'accessibility'),
(@property_id, 'Wheelchair Access', 'accessibility');

-- Insert property images
INSERT INTO property_images (property_id, url, caption) VALUES
(@property_id, 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 'Hotel Exterior'),
(@property_id, 'https://images.unsplash.com/photo-1582719508461-905c673771fd', 'Bedroom'),
(@property_id, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7', 'Bathroom');

-- Insert house rules
INSERT INTO property_rules (property_id, rule) VALUES
(@property_id, 'Check-in after 2 PM'),
(@property_id, 'No parties'),
(@property_id, 'No smoking'),
(@property_id, 'Quiet hours after 10 PM');