-- StayHub demo seed (data only, PostgreSQL). Load AFTER schema.sql.
-- Demo accounts (password: Demo1234!):
--   admin@stayhub.demo (admin) | host@stayhub.demo (host) | guest@stayhub.demo (guest)
-- Idempotent: rows are upserted on their primary key.

-- users (3)
INSERT INTO "users" ("id", "email", "password_hash", "first_name", "last_name", "phone_number", "created_at", "updated_at", "last_login", "status", "email_verified", "role") VALUES
  ('3be4de6a-2b68-448b-b11a-ca56ec543e85', 'host@stayhub.demo', '$2a$10$PhkN5m5qfbgHuSEHbJYQY.u/HbyRUVoOUefO07.yOm8lxKhSSLWPi', 'Host', 'Demo', NULL, '2026-07-26 16:06:28+00', '2026-07-26 16:06:29+00', NULL, 'active', false, 'host'),
  ('4fd46774-db5e-4634-a95a-591a29c1d078', 'admin@stayhub.demo', '$2a$10$BztjUDaPecinAu0mNWKRwO4PnHni57X0Ad0adGTdYl9x8C26.LeCa', 'Admin', 'Demo', NULL, '2026-07-26 16:06:28+00', '2026-07-26 16:06:29+00', NULL, 'active', false, 'admin'),
  ('f3f29faf-db0f-45a2-9f18-80380196163d', 'guest@stayhub.demo', '$2a$10$WvjQpqgZNErLtMwN05.oc.kaU7RVBL1B3znKf2pULJGrs9IkALYpa', 'Guest', 'Demo', NULL, '2026-07-26 16:06:29+00', '2026-07-26 16:06:29+00', NULL, 'active', false, 'guest')
ON CONFLICT ("id") DO UPDATE SET "email" = EXCLUDED."email", "password_hash" = EXCLUDED."password_hash", "first_name" = EXCLUDED."first_name", "last_name" = EXCLUDED."last_name", "phone_number" = EXCLUDED."phone_number", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "last_login" = EXCLUDED."last_login", "status" = EXCLUDED."status", "email_verified" = EXCLUDED."email_verified", "role" = EXCLUDED."role";

-- user_profiles (3)
INSERT INTO "user_profiles" ("user_id", "avatar_url", "preferred_language", "preferred_currency", "notification_preferences", "address_info", "created_at", "updated_at", "language", "currency", "notifications") VALUES
  ('3be4de6a-2b68-448b-b11a-ca56ec543e85', NULL, 'en', 'USD', NULL, NULL, '2026-07-26 16:06:28+00', '2026-07-26 16:06:28+00', 'en', 'USD', '{"push": false, "email": true}'::jsonb),
  ('4fd46774-db5e-4634-a95a-591a29c1d078', NULL, 'en', 'USD', NULL, NULL, '2026-07-26 16:06:28+00', '2026-07-26 16:06:28+00', 'en', 'USD', '{"push": false, "email": true}'::jsonb),
  ('f3f29faf-db0f-45a2-9f18-80380196163d', NULL, 'en', 'USD', NULL, NULL, '2026-07-26 16:06:29+00', '2026-07-26 16:06:29+00', 'en', 'USD', '{"push": false, "email": true}'::jsonb)
ON CONFLICT ("user_id") DO UPDATE SET "avatar_url" = EXCLUDED."avatar_url", "preferred_language" = EXCLUDED."preferred_language", "preferred_currency" = EXCLUDED."preferred_currency", "notification_preferences" = EXCLUDED."notification_preferences", "address_info" = EXCLUDED."address_info", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "language" = EXCLUDED."language", "currency" = EXCLUDED."currency", "notifications" = EXCLUDED."notifications";

-- user_security (3)
INSERT INTO "user_security" ("user_id", "two_factor_enabled", "two_factor_method", "recovery_email", "last_password_change", "failed_login_attempts", "last_failed_attempt") VALUES
  ('3be4de6a-2b68-448b-b11a-ca56ec543e85', false, NULL, NULL, '2026-07-26 16:06:28+00', 0, NULL),
  ('4fd46774-db5e-4634-a95a-591a29c1d078', false, NULL, NULL, '2026-07-26 16:06:28+00', 0, NULL),
  ('f3f29faf-db0f-45a2-9f18-80380196163d', false, NULL, NULL, '2026-07-26 16:06:29+00', 0, NULL)
ON CONFLICT ("user_id") DO UPDATE SET "two_factor_enabled" = EXCLUDED."two_factor_enabled", "two_factor_method" = EXCLUDED."two_factor_method", "recovery_email" = EXCLUDED."recovery_email", "last_password_change" = EXCLUDED."last_password_change", "failed_login_attempts" = EXCLUDED."failed_login_attempts", "last_failed_attempt" = EXCLUDED."last_failed_attempt";

-- properties (10)
INSERT INTO "properties" ("id", "name", "description", "latitude", "longitude", "street", "city", "state", "country", "postal_code", "price", "rating", "host_id", "guests", "bedrooms", "beds", "bathrooms", "property_type", "check_in_time", "check_out_time", "cancellation_policy", "created_at", "updated_at", "pet_policy", "event_policy", "star_rating", "languages_spoken", "is_active", "min_stay", "max_stay", "house_rules", "is_featured") VALUES
  (8, 'Exigent Apartments', 'Luxurious apartment in the heart of Bucharest with modern amenities and stunning city views', '53.38934125', '-6.24288662', 'Strada Victoriei 25', 'Bucharest', 'Sector 1', 'Romania', '010063', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 4, 2, 3, 2, 'apartment', '14:00:00', '12:00:00', 'flexible', '2024-12-11 21:49:14+00', '2026-07-26 16:06:48+00', 'Pets allowed with deposit', 'Events allowed with prior approval', '5.0', NULL, true, 1, 30, NULL, true),
  (12, 'Radison Blu Hotel', 'radison blu', '45.25730318', '25.17080506', 'Bd timisoara 16B, sector 6 Bucuresti', 'Brasov', 'Brasov', 'Romania', '500030', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 11, 7, 2, 2, 'hotel', '15:01:00', '11:01:00', 'strict', '2024-12-13 21:29:07+00', '2026-07-26 16:06:48+00', 'not_allowed', 'not_allowed', '3.5', NULL, true, 2, 29, NULL, false),
  (16, 'test', 'test', '53.38934125', '-6.24288662', '37 Shanrath Road', 'Dublin', 'Ireland', 'Ireland', 'D09NY56', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 2, 1, 1, 1, 'hotel', '12:00:00', '00:00:00', 'moderate', '2024-12-14 18:30:06+00', '2026-07-26 16:08:04+00', 'pets', 'next', NULL, NULL, true, 1, 30, NULL, false),
  (21, 'Bucharest Inn 123', 'Luxurious hotel in the heart of Bucharest with modern amenities and stunning city views', '45.25440728', '25.17105103', 'Strada Principala 47', 'Stoenesti, Stoenesti', 'Arges', 'Romania', '117675', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 1, 1, 1, 1, 'hotel', '15:00:00', '12:00:00', 'moderate', '2024-12-24 13:59:46+00', '2026-07-26 16:06:48+00', 'pets1', 'events1', '0.0', '[]'::jsonb, true, 1, 30, NULL, false),
  (26, 'qwertyuiop', '22222', '45.26281560', '25.17520690', 'Strada Principala 47', 'Stoenesti', 'Arges', 'Romania', '117675', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 2, 2, 2, 2, 'house', '15:00:00', '12:00:00', 'moderate', '2024-12-28 21:00:38+00', '2026-07-26 16:06:48+00', '1212112', '123123123213', '2.0', '["English", "Romanian", "German"]'::jsonb, true, 1, 30, NULL, true),
  (27, 'testIonut123', 'test', '45.25000000', '25.16667000', 'Strada Principala 47', 'Stoenesti', 'Arges', 'Romania', '117675', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 1, 1, 1, 1, 'hotel', '14:00:00', '11:00:00', 'strict', '2024-12-28 21:10:58+00', '2026-07-26 16:08:04+00', 'case_by_case', 'with_permission', '0.0', '["English", "Italian", "Japanese"]'::jsonb, true, 1, 30, NULL, false),
  (28, 'Dragoslavele', 'this is a test', '53.29067460', '-6.42496170', '3007 Lake Drive', 'Dublin', 'Dublin', 'Ireland', 'd123', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 1, 1, 1, 1, 'villa', '14:00:00', '11:00:00', 'moderate', '2025-01-04 17:04:15+00', '2026-07-26 16:08:04+00', 'not_allowed', 'not_allowed', '0.0', '["English", "Italian", "Portuguese"]'::jsonb, true, 1, 30, NULL, false),
  (29, 'Enothera1', 'this is about 20 km away from Stoenesti and this is a test111', '45.16667000', '25.18333000', '147 Strada Principală', 'Valeni', 'Dambovita', 'Romania', '', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 2, 2, 2, 2, 'resort', '17:00:00', '14:00:00', 'strict', '2025-01-11 20:27:09+00', '2026-07-26 16:08:04+00', 'case_by_case', 'with_permission', '1.0', '["English", "Spanish", "French", "German"]'::jsonb, true, 1, 29, 'hdhdhd', false),
  (46, '123abc', 'test selenium', '45.25269000', '25.17252890', 'DN72A', 'Stoenești', 'Arges', 'Romania', '117676', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 2, 2, 2, 2, 'treehouse', '16:00:00', '12:00:00', 'strict', '2025-02-05 20:48:13+00', '2026-07-26 16:08:04+00', 'case_by_case', 'with_permission', '1.0', '["Dutch"]'::jsonb, true, 2, 29, 'no smoking selenium', false),
  (65, '123abc', 'jksbadkcjhbsjacbjnsdx', '44.43225000', '26.10626000', 'Strada Cara Anghel 11', 'Bucharest', 'București', 'Romania', '031006', NULL, '0.0', '3be4de6a-2b68-448b-b11a-ca56ec543e85', 11, 11, 11, 11, 'villa', '16:00:00', '13:00:00', 'moderate', '2025-03-04 17:50:55+00', '2026-07-26 16:08:04+00', 'case_by_case', 'with_permission', '5.0', '["Turkish", "Swedish", "Indonesian"]'::jsonb, true, 2, 30, 'no smoking, motherfuckers', true)
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "latitude" = EXCLUDED."latitude", "longitude" = EXCLUDED."longitude", "street" = EXCLUDED."street", "city" = EXCLUDED."city", "state" = EXCLUDED."state", "country" = EXCLUDED."country", "postal_code" = EXCLUDED."postal_code", "price" = EXCLUDED."price", "rating" = EXCLUDED."rating", "host_id" = EXCLUDED."host_id", "guests" = EXCLUDED."guests", "bedrooms" = EXCLUDED."bedrooms", "beds" = EXCLUDED."beds", "bathrooms" = EXCLUDED."bathrooms", "property_type" = EXCLUDED."property_type", "check_in_time" = EXCLUDED."check_in_time", "check_out_time" = EXCLUDED."check_out_time", "cancellation_policy" = EXCLUDED."cancellation_policy", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "pet_policy" = EXCLUDED."pet_policy", "event_policy" = EXCLUDED."event_policy", "star_rating" = EXCLUDED."star_rating", "languages_spoken" = EXCLUDED."languages_spoken", "is_active" = EXCLUDED."is_active", "min_stay" = EXCLUDED."min_stay", "max_stay" = EXCLUDED."max_stay", "house_rules" = EXCLUDED."house_rules", "is_featured" = EXCLUDED."is_featured";

-- rooms (18)
INSERT INTO "rooms" ("id", "property_id", "name", "room_type", "bed_type", "beds", "max_occupancy", "base_price", "cleaning_fee", "service_fee", "tax_rate", "security_deposit", "description", "created_at", "updated_at", "bathroom_type", "view_type", "has_private_bathroom", "smoking", "accessibility_features", "floor_level", "has_balcony", "has_kitchen", "has_minibar", "climate", "price_per_night", "cancellation_policy", "includes_breakfast", "extra_bed_available", "pets_allowed", "images", "cleaning_frequency", "has_toiletries", "has_towels_linens", "has_room_service", "flooring_type", "energy_saving_features", "status", "room_size", "amenities") VALUES
  (24, 8, 'Deluxe Double Room123', 'Deluxe Room', 'Single Bed', '[{"type": "Single Bed", "count": 1}, {"type": "Double Bed", "count": 2}]'::jsonb, 5, '151.00', '46.00', '21.00', '23.00', '105.00', 'Spacious room with city view123', '2024-12-12 15:42:16+00', '2024-12-20 19:44:09+00', 'shared', 'Ocean View', false, true, '["accessibility"]'::jsonb, 1, true, true, true, NULL, '47.00', 'moderate', true, false, true, '[]'::jsonb, 'on_request', true, true, true, 'Hardwood', '[]'::jsonb, 'occupied', 1, '["Balcony", "Kitchen", "Mini Bar", "Toiletries", "Towels & Linens", "Room Service"]'::jsonb),
  (25, 8, 'Single Room', 'single room', 'Single Bed', '[{"type": "Single Bed", "count": 1}, {"type": "Double Bed", "count": 3}]'::jsonb, 7, '100.00', '20.00', '15.00', '19.00', '50.00', 'Cozy room perfect for solo travelers', '2024-12-12 15:42:16+00', '2024-12-20 19:13:15+00', 'private', 'City View', true, true, '[]'::jsonb, 0, false, false, false, NULL, '12.00', 'flexible', false, false, true, '[]'::jsonb, 'daily', true, true, true, 'Carpet', '[]'::jsonb, 'available', 0, '["Private Bathroom"]'::jsonb),
  (33, 12, 'Double Deluxe Standard1', 'Suite', 'Single Bed', '"[{\"type\":\"Single Bed\",\"count\":1},{\"type\":\"Double Bed\",\"count\":1}]"'::jsonb, 3, NULL, NULL, NULL, NULL, NULL, 'this is a test deluxe double room111', '2024-12-13 21:29:07+00', '2025-01-05 20:48:29+00', 'private', 'No View', false, false, '"[]"'::jsonb, 1, false, false, false, 'null'::jsonb, '12.00', NULL, false, false, false, '"[]"'::jsonb, NULL, false, false, false, 'Carpet', '"[]"'::jsonb, 'available', 12, '"\"[]\""'::jsonb),
  (34, 12, 'Deluxe triple room', 'Deluxe Room', 'Single Bed', '"[{\"type\":\"Single Bed\",\"count\":1},{\"type\":\"Double Bed\",\"count\":1}]"'::jsonb, 3, NULL, NULL, NULL, NULL, NULL, 'test triple room1111111122222', '2024-12-13 21:29:07+00', '2025-01-05 21:57:16+00', 'private', 'No View', false, false, '"[]"'::jsonb, 11, false, false, false, 'null'::jsonb, '122.00', 'flexible', false, false, false, '"[]"'::jsonb, 'daily', false, false, false, 'Carpet', '"[]"'::jsonb, 'available', 11, '"\"[\\\"Air Conditioning\\\",\\\"Balcony\\\",\\\"Safe\\\",\\\"Kitchen\\\"]\""'::jsonb),
  (38, 16, 'Double room', 'standard room', 'Single Bed', NULL, 2, '10.00', '10.00', '10.00', '19.00', NULL, 'test', '2024-12-14 18:30:06+00', '2024-12-14 18:30:06+00', 'private', NULL, true, false, NULL, NULL, false, false, false, NULL, NULL, NULL, false, false, false, NULL, NULL, false, false, false, NULL, NULL, 'available', NULL, NULL),
  (57, 8, 'johnny test 567', 'Suite', NULL, '[{"type": "Single Bed", "count": 1}]'::jsonb, 1, NULL, NULL, NULL, NULL, NULL, 'this is the most amazing room', '2024-12-20 21:47:41+00', '2024-12-20 19:54:14+00', 'private', 'Pool View', false, false, '["additional", "features"]'::jsonb, 323, true, false, false, 'null'::jsonb, '202.00', 'strict', false, false, false, '[]'::jsonb, 'monthly', true, false, true, 'Marble', '["energy"]'::jsonb, 'maintenance', 324, '["Balcony", "Toiletries", "Room Service"]'::jsonb),
  (60, 21, 'Deluxe Room12', 'Standard Room', NULL, '[{"type": "Single Bed", "count": 1}, {"type": "Double Bed", "count": 1}, {"type": "Queen Bed", "count": 1}, {"type": "Bunk Bed", "count": 3}]'::jsonb, 11, '100.10', '0.00', '0.00', '0.00', '0.00', NULL, '2024-12-24 13:59:46+00', '2025-03-02 16:09:11+00', 'shared', 'Ocean View', false, true, '["r"]'::jsonb, 5, true, false, false, '{"type": "ac", "available": true}'::jsonb, '20.10', 'moderate', true, false, false, '[]'::jsonb, 'biweekly', true, true, false, 'Hardwood', '["a"]'::jsonb, 'available', 311, '["Towels & Linens", "Balcony", "Private Bathroom", "Kitchen"]'::jsonb),
  (61, 21, 'test', 'Suite', NULL, '[{"type": "Single Bed", "count": 1}, {"type": "Double Bed", "count": 1}, {"type": "King Bed", "count": 1}]'::jsonb, 5, '46.00', NULL, NULL, NULL, NULL, '', '2024-12-24 14:32:37+00', '2024-12-24 14:44:24+00', 'shared', 'Ocean View', false, false, '"[]"'::jsonb, 9, true, false, false, NULL, '12.00', 'flexible', false, false, false, '"[]"'::jsonb, 'on_request', true, false, true, 'Carpet', '"[]"'::jsonb, 'available', 928, '"[\"Balcony\",\"Toiletries\",\"Room Service\"]"'::jsonb),
  (67, 26, 'Amazing room', 'Standard Room', NULL, '"[{\"type\":\"Single Bed\",\"count\":1},{\"type\":\"Queen Bed\",\"count\":1},{\"type\":\"King Bed\",\"count\":1}]"'::jsonb, 2, '0.00', '0.00', '0.00', '0.00', '0.00', 'test', '2024-12-28 21:00:38+00', '2025-03-04 17:09:58+00', 'private', 'City View', false, false, '"[]"'::jsonb, 1, false, false, false, '{"type": "ac", "available": true}'::jsonb, '12.00', 'moderate', false, false, false, '[]'::jsonb, 'daily', true, true, false, 'carpet', '"[]"'::jsonb, 'available', 111, '"[\"Private Bathroom\",\"Safe\"]"'::jsonb),
  (68, 27, 'mansarda', 'Deluxe Room', NULL, '[{"type": "Single Bed", "count": 1}, {"type": "Double Bed", "count": 1}]'::jsonb, 3, '2.00', '2.00', '2.00', '2.00', '2.00', '11111', '2024-12-28 21:10:58+00', '2024-12-28 21:10:58+00', 'private', 'City View', false, false, '[]'::jsonb, 0, false, false, true, NULL, '2.00', 'flexible', true, false, false, '[]'::jsonb, 'daily', false, true, false, 'Carpet', '[]'::jsonb, 'available', 111, '[]'::jsonb),
  (69, 28, 'fidelity', 'Deluxe Room', NULL, '[{"type": "Double Bed", "count": 1}, {"type": "King Bed", "count": 1}]'::jsonb, 4, '1.00', '1.00', '1.00', '1.00', '1.00', '121212', '2025-01-04 17:04:15+00', '2025-01-04 17:04:15+00', 'shared', 'City View', false, false, '[]'::jsonb, 12, false, false, false, NULL, '1.00', 'moderate', false, false, false, '[]'::jsonb, 'weekly', true, true, false, 'Tile', '[]'::jsonb, 'available', 122, '[]'::jsonb),
  (73, 29, 'Amazing room1', 'Deluxe Room', NULL, '[{"type": "Single Bed", "count": 1}, {"type": "King Bed", "count": 1}, {"type": "Bunk Bed", "count": 1}]'::jsonb, 5, '0.00', NULL, NULL, NULL, NULL, 'Amazing room with', '2025-01-11 20:27:09+00', '2025-02-02 20:20:29+00', 'shared', 'City View', false, false, '[]'::jsonb, 1, false, false, false, '{"type": "ac", "available": true}'::jsonb, '14.00', 'flexible', false, false, false, '[]'::jsonb, 'daily', true, true, false, 'Tile', '[]'::jsonb, 'available', 123, '["Wi-Fi", "TV", "Mini Bar", "Safe"]'::jsonb),
  (78, 21, 'selenium test', 'Deluxe Room', NULL, '[{"type": "Queen Bed", "count": 1}, {"type": "King Bed", "count": 1}, {"type": "Bunk Bed", "count": 1}, {"type": "Single Bed", "count": 1}, {"type": "Single Bed", "count": 1}, {"type": "Single Bed", "count": 1}, {"type": "Single Bed", "count": 1}, {"type": "Single Bed", "count": 1}, {"type": "Single Bed", "count": 1}]'::jsonb, 12, '0.00', '0.00', '0.00', '0.00', '0.00', 'this is a selenium test', '2025-02-02 19:30:45+00', '2025-03-02 16:40:12+00', 'en-suite', 'Pool View', false, false, '[]'::jsonb, 114, false, false, false, '{"type": "ac", "available": true}'::jsonb, '112.00', 'moderate', false, false, false, '[]'::jsonb, 'daily', true, true, false, 'Marble', '[]'::jsonb, 'available', 113, '["Balcony", "Wi-Fi", "TV", "Air Conditioning"]'::jsonb),
  (84, 46, '1212', 'Deluxe Room', NULL, '[{"type": "Single Bed", "count": 1}, {"type": "King Bed", "count": 1}]'::jsonb, 3, '0.00', '0.00', '0.00', '0.00', '0.00', '14', '2025-02-05 20:48:52+00', '2025-02-05 20:52:02+00', 'en-suite', 'Mountain View', true, false, '[]'::jsonb, 14, false, false, false, '{"type": "ac", "available": true}'::jsonb, '1212.00', 'strict', false, false, false, '[]'::jsonb, 'daily', true, true, false, 'Tile', '[]'::jsonb, 'available', 1212, '["TV", "Wi-Fi", "Kitchen"]'::jsonb),
  (123, 21, 'automation room123', 'Suite', NULL, '"[{\"type\":\"Double Bed\",\"count\":3},{\"type\":\"King Bed\",\"count\":3},{\"type\":\"Single Bed\",\"count\":2}]"'::jsonb, 14, '0.00', '0.00', '0.00', '0.00', '0.00', 'auto description111', '2025-03-03 20:15:59+00', '2025-03-03 20:16:19+00', 'private', 'City View', true, false, '"[]"'::jsonb, 14, false, false, false, '{"type": "ac", "available": true}'::jsonb, '155.00', 'moderate', false, false, false, '[]'::jsonb, 'daily', true, true, false, 'Carpet', '"[]"'::jsonb, 'available', 155, '"[\"Wi-Fi\",\"Safe\",\"Private Bathroom\",\"Mini Bar\",\"Air Conditioning\",\"Sea View\",\"Balcony\",\"TV\",\"Kitchen\"]"'::jsonb),
  (125, 65, '123abc', 'Standard Room', NULL, '"[{\"type\":\"Single Bed\",\"count\":2},{\"type\":\"Double Bed\",\"count\":2}]"'::jsonb, 6, '0.00', '0.00', '0.00', '0.00', '0.00', '121212', '2025-03-04 17:54:47+00', '2025-03-11 19:58:53+00', 'private', 'No View', true, false, '"[]"'::jsonb, 12, false, false, false, '{"type": "ac", "available": true}'::jsonb, '12.00', 'moderate', false, false, false, '[]'::jsonb, 'daily', true, true, false, 'Carpet', '"[]"'::jsonb, 'available', 12, '"[\"Safe\",\"TV\"]"'::jsonb),
  (126, 26, 'amazing suite', 'Suite', NULL, '"[{\"type\":\"Single Bed\",\"count\":1},{\"type\":\"Single Bed\",\"count\":1},{\"type\":\"Queen Bed\",\"count\":1}]"'::jsonb, 4, '0.00', '0.00', '0.00', '0.00', '0.00', '11111', '2025-03-27 18:29:40+00', '2025-03-27 18:29:40+00', 'private', 'Ocean View', true, false, '"[]"'::jsonb, 11, false, false, false, '"{\"type\":\"ac\",\"available\":true}"'::jsonb, '11.00', 'flexible', false, false, false, '"[]"'::jsonb, 'daily', true, true, false, 'Marble', '"[]"'::jsonb, 'available', 111, '"[\"Wi-Fi\",\"Kitchen\",\"Private Bathroom\"]"'::jsonb),
  (182, 12, 'Triple test', 'Deluxe Room', NULL, '"[{\"type\":\"Single Bed\",\"count\":1},{\"type\":\"King Bed\",\"count\":2},{\"type\":\"Queen Bed\",\"count\":2}]"'::jsonb, 9, '0.00', '0.00', '0.00', '0.00', '0.00', 'triple test room with private bathroom', '2026-07-26 14:15:07+00', '2026-07-26 14:15:07+00', 'private', 'No View', true, false, '"[]"'::jsonb, 2, false, false, false, '"{\"type\":\"ac\",\"available\":true}"'::jsonb, '125.00', 'flexible', false, false, false, '"[]"'::jsonb, 'daily', true, true, false, 'Carpet', '"[]"'::jsonb, 'available', 1290, '"[\"Safe\",\"Balcony\"]"'::jsonb)
ON CONFLICT ("id") DO UPDATE SET "property_id" = EXCLUDED."property_id", "name" = EXCLUDED."name", "room_type" = EXCLUDED."room_type", "bed_type" = EXCLUDED."bed_type", "beds" = EXCLUDED."beds", "max_occupancy" = EXCLUDED."max_occupancy", "base_price" = EXCLUDED."base_price", "cleaning_fee" = EXCLUDED."cleaning_fee", "service_fee" = EXCLUDED."service_fee", "tax_rate" = EXCLUDED."tax_rate", "security_deposit" = EXCLUDED."security_deposit", "description" = EXCLUDED."description", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "bathroom_type" = EXCLUDED."bathroom_type", "view_type" = EXCLUDED."view_type", "has_private_bathroom" = EXCLUDED."has_private_bathroom", "smoking" = EXCLUDED."smoking", "accessibility_features" = EXCLUDED."accessibility_features", "floor_level" = EXCLUDED."floor_level", "has_balcony" = EXCLUDED."has_balcony", "has_kitchen" = EXCLUDED."has_kitchen", "has_minibar" = EXCLUDED."has_minibar", "climate" = EXCLUDED."climate", "price_per_night" = EXCLUDED."price_per_night", "cancellation_policy" = EXCLUDED."cancellation_policy", "includes_breakfast" = EXCLUDED."includes_breakfast", "extra_bed_available" = EXCLUDED."extra_bed_available", "pets_allowed" = EXCLUDED."pets_allowed", "images" = EXCLUDED."images", "cleaning_frequency" = EXCLUDED."cleaning_frequency", "has_toiletries" = EXCLUDED."has_toiletries", "has_towels_linens" = EXCLUDED."has_towels_linens", "has_room_service" = EXCLUDED."has_room_service", "flooring_type" = EXCLUDED."flooring_type", "energy_saving_features" = EXCLUDED."energy_saving_features", "status" = EXCLUDED."status", "room_size" = EXCLUDED."room_size", "amenities" = EXCLUDED."amenities";

-- property_amenities (73)
INSERT INTO "property_amenities" ("property_id", "amenity", "category") VALUES
  (8, 'Air Conditioning', 'general'),
  (8, 'Balcony', 'outdoor'),
  (8, 'City View', 'outdoor'),
  (8, 'Coffee Maker', 'kitchen'),
  (8, 'Elevator', 'accessibility'),
  (8, 'Hair Dryer', 'bathroom'),
  (8, 'Microwave', 'kitchen'),
  (8, 'Mini Bar', 'room'),
  (8, 'Rain Shower', 'bathroom'),
  (8, 'TV', 'room'),
  (8, 'Wheelchair Access', 'accessibility'),
  (8, 'WiFi', 'general'),
  (12, 'Air Conditioning', 'general'),
  (12, 'Bathtub', 'bathroom'),
  (12, 'BBQ Facilities', 'outdoor'),
  (12, 'BBQ Grill', 'outdoor'),
  (12, 'Beach Access', 'outdoor'),
  (12, 'Bike Rental', 'outdoor'),
  (12, 'Braille Signage', 'accessibility'),
  (12, 'City View', 'room'),
  (12, 'Closet', 'room'),
  (12, 'Coffee Machine', 'kitchen'),
  (12, 'Coffee Maker', 'kitchen'),
  (12, 'Desk', 'room'),
  (12, 'Dining Area', 'kitchen'),
  (12, 'Dishes', 'kitchen'),
  (12, 'Dishwasher', 'kitchen'),
  (12, 'Elevator', 'accessibility'),
  (12, 'Elevator Access', 'accessibility'),
  (12, 'Emergency Cord', 'accessibility'),
  (12, 'Free WiFi', 'general'),
  (12, 'Full Kitchen', 'kitchen'),
  (12, 'Garden', 'outdoor'),
  (12, 'Grab Rails', 'accessibility'),
  (12, 'Ground Floor', 'accessibility'),
  (12, 'Hair Dryer', 'bathroom'),
  (12, 'Heating', 'general'),
  (12, 'Hot Water', 'bathroom'),
  (12, 'Iron', 'room'),
  (12, 'Luggage Storage', 'general'),
  (12, 'Microwave', 'kitchen'),
  (12, 'Mini Bar', 'room'),
  (12, 'Parking', 'outdoor'),
  (12, 'Private Bathroom', 'bathroom'),
  (12, 'Reception 24/7', 'general'),
  (12, 'Refrigerator', 'kitchen'),
  (12, 'Roll-in Shower', 'accessibility'),
  (12, 'Safe', 'room'),
  (12, 'Security', 'general'),
  (12, 'Shampoo', 'bathroom'),
  (12, 'Shower', 'bathroom'),
  (12, 'Swimming Pool', 'outdoor'),
  (12, 'Terrace', 'outdoor'),
  (12, 'test', 'general'),
  (12, 'Toiletries', 'bathroom'),
  (12, 'Towels', 'bathroom'),
  (12, 'TV', 'general'),
  (12, 'Wardrobe', 'room'),
  (12, 'Washing Machine', 'bathroom'),
  (12, 'Wheelchair Access', 'accessibility'),
  (12, 'Wheelchair Accessible', 'accessibility'),
  (12, 'Wide Doorway', 'accessibility'),
  (12, 'WiFi', 'general'),
  (16, 'Air Conditioning', 'general'),
  (16, 'Coffee Maker', 'kitchen'),
  (16, 'Ground Floor', 'accessibility'),
  (16, 'Heating', 'general'),
  (16, 'Hot Water', 'bathroom'),
  (16, 'Iron', 'room'),
  (16, 'Parking', 'outdoor'),
  (16, 'test', 'accessibility'),
  (16, 'TV', 'general'),
  (16, 'WiFi', 'general')
ON CONFLICT ("property_id", "amenity") DO UPDATE SET "category" = EXCLUDED."category";

-- property_images (7)
INSERT INTO "property_images" ("id", "property_id", "url", "caption") VALUES
  (27, 8, 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 'Hotel Exterior'),
  (28, 8, 'https://images.unsplash.com/photo-1582719508461-905c673771fd', 'Bedroom'),
  (29, 8, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7', 'Bathroom'),
  (33, 12, 'blob:http://localhost:3000/78de54e6-49aa-4de7-aeba-a5b1f3896859', NULL),
  (36, 26, 'https://picsum.photos/200/300', 'test'),
  (37, 26, 'https://picsum.photos/200/300', 'test1'),
  (38, 26, 'https://picsum.photos/200/300', 'main')
ON CONFLICT ("id") DO UPDATE SET "property_id" = EXCLUDED."property_id", "url" = EXCLUDED."url", "caption" = EXCLUDED."caption";

-- property_rules (6)
INSERT INTO "property_rules" ("property_id", "rule") VALUES
  (8, 'Check-in after 2 PM'),
  (8, 'No parties'),
  (8, 'No smoking'),
  (8, 'Quiet hours after 10 PM'),
  (12, 'no smoking'),
  (16, 'no smoking')
ON CONFLICT ("property_id", "rule") DO NOTHING;

-- Move identity sequences past the seeded ids
SELECT setval(pg_get_serial_sequence('properties', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "properties"), 1));
SELECT setval(pg_get_serial_sequence('rooms', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "rooms"), 1));
SELECT setval(pg_get_serial_sequence('property_images', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "property_images"), 1));
SELECT setval(pg_get_serial_sequence('property_click_counts', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "property_click_counts"), 1));
SELECT setval(pg_get_serial_sequence('seasonal_pricing', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "seasonal_pricing"), 1));
SELECT setval(pg_get_serial_sequence('bookings', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "bookings"), 1));
SELECT setval(pg_get_serial_sequence('room_availability', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "room_availability"), 1));
SELECT setval(pg_get_serial_sequence('blocked_dates', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "blocked_dates"), 1));
SELECT setval(pg_get_serial_sequence('financial_transactions', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "financial_transactions"), 1));
SELECT setval(pg_get_serial_sequence('maintenance_tasks', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "maintenance_tasks"), 1));
SELECT setval(pg_get_serial_sequence('messages', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "messages"), 1));
