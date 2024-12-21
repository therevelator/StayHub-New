-- Sample data for properties
INSERT INTO properties (
  name, description, property_type, star_rating, latitude, longitude,
  street, city, state, country, postal_code, base_price, cleaning_fee,
  service_fee, tax_rate, cancellation_policy, languages_spoken
) VALUES (
  'Grand Marina Resort & Spa',
  'Experience luxury living at its finest in our beachfront resort featuring world-class amenities and breathtaking ocean views.',
  'resort',
  4.5,
  44.4268, 26.1025,
  'Beach Boulevard 123',
  'Constanta',
  'Constanta',
  'Romania',
  '900178',
  299.99,
  50.00,
  25.00,
  20.00,
  'moderate',
  '["English", "Romanian", "French", "German"]'
);

SET @property_id = LAST_INSERT_ID();

-- Room Types
INSERT INTO room_types (
  property_id, name, description, room_size, max_occupancy,
  bed_configuration, base_price, quantity, amenities, room_view
) VALUES
(
  @property_id,
  'Deluxe Ocean View Suite',
  'Spacious suite with private balcony overlooking the ocean',
  45,
  3,
  '{"king": 1, "sofa_bed": 1}',
  399.99,
  10,
  '["Air Conditioning", "Mini Bar", "Safe", "Free WiFi", "Room Service", "Flat-screen TV"]',
  'Ocean Front'
),
(
  @property_id,
  'Premium Garden View Room',
  'Elegant room with garden views and modern amenities',
  35,
  2,
  '{"queen": 2}',
  299.99,
  15,
  '["Air Conditioning", "Mini Bar", "Safe", "Free WiFi", "Flat-screen TV"]',
  'Garden'
);

-- Property Amenities
INSERT INTO property_amenities (property_id, category, amenity, details) VALUES
(@property_id, 'general', 'Free WiFi', '{"speed": "100mbps", "coverage": "property-wide"}'),
(@property_id, 'outdoor', 'Swimming Pool', '{"type": "outdoor", "heated": true, "size": "25m"}'),
(@property_id, 'entertainment', 'Spa Center', '{"services": ["massage", "facial", "sauna"], "hours": "9:00-21:00"}'),
(@property_id, 'accessibility', 'Wheelchair Access', '{"areas": ["lobby", "restaurant", "rooms", "pool"]}');

-- Property Images
INSERT INTO property_images (property_id, url, caption, category, is_primary) VALUES
(@property_id, 'https://example.com/images/exterior1.jpg', 'Resort Front View', 'exterior', true),
(@property_id, 'https://example.com/images/pool1.jpg', 'Infinity Pool', 'amenity', false),
(@property_id, 'https://example.com/images/room1.jpg', 'Deluxe Ocean View Suite', 'room', false);

-- Property Rules
INSERT INTO property_rules (property_id, category, rule, details) VALUES
(@property_id, 'general', 'No smoking', 'Smoking is prohibited in all indoor areas'),
(@property_id, 'pets', 'Pets allowed', 'Dogs and cats under 20kg welcome with additional fee'),
(@property_id, 'events', 'Events allowed', 'Prior approval required for events over 20 people');

-- Nearby Attractions
INSERT INTO nearby_attractions (property_id, name, category, distance, travel_time, description) VALUES
(@property_id, 'Mamaia Beach', 'nature', 0.5, 5, 'Beautiful sandy beach with water sports'),
(@property_id, 'Old Town', 'landmark', 2.0, 15, 'Historic center with restaurants and shops'),
(@property_id, 'Constanta Casino', 'landmark', 1.5, 10, 'Historic Art Nouveau casino building');

-- Property Policies
INSERT INTO property_policies (property_id, category, policy, details) VALUES
(@property_id, 'payment', 'Accepted payment methods', '{"methods": ["credit_card", "debit_card", "bank_transfer"]}'),
(@property_id, 'cancellation', 'Free cancellation', '{"deadline": "72h", "refund_percentage": 100}'),
(@property_id, 'check_in', 'Check-in/out times', '{"check_in": "15:00", "check_out": "11:00", "late_checkout": "available"}');

-- Sustainability Practices
INSERT INTO sustainability_practices (property_id, category, practice, description, certification) VALUES
(@property_id, 'energy', 'Solar Power', 'Property powered by 50% solar energy', 'Green Energy Certified'),
(@property_id, 'water', 'Water Conservation', 'Low-flow fixtures and water recycling system', 'Water Wise'),
(@property_id, 'waste', 'Recycling Program', 'Comprehensive recycling and composting program', NULL);

-- Special Features
INSERT INTO special_features (
  property_id, name, category, description, pricing_details, availability
) VALUES
(@property_id, 'Beachfront Wedding Venue', 'event_space',
  'Beautiful beachfront venue for weddings and special events',
  '{"base_price": 5000, "per_person": 100, "minimum_guests": 50}',
  '{"days": ["Saturday", "Sunday"], "hours": "10:00-23:00"}'
),
(@property_id, 'Yoga Retreat Package', 'wellness',
  'Daily yoga classes with professional instructors',
  '{"price_per_session": 30, "package_deals": {"weekly": 150}}',
  '{"schedule": "Daily 7:00-8:00 and 17:00-18:00"}'
);

-- Meal Plans
INSERT INTO meal_plans (
  property_id, name, description, price_per_person,
  meal_times, cuisine_types, dietary_options
) VALUES
(@property_id, 'All-Inclusive Premium',
  'Full board with premium drinks and snacks',
  89.99,
  '{"breakfast": "7:00-10:30", "lunch": "12:30-15:00", "dinner": "18:30-22:00"}',
  '["International", "Romanian", "Mediterranean", "Asian"]',
  '["Vegetarian", "Vegan", "Gluten-Free", "Halal"]'
),
(@property_id, 'Bed & Breakfast',
  'Daily breakfast buffet with local and international options',
  25.99,
  '{"breakfast": "7:00-10:30"}',
  '["Continental", "Romanian", "American"]',
  '["Vegetarian", "Gluten-Free"]'
);
