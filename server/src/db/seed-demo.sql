-- StayHub demo seed (data only). Load AFTER schema.sql.
-- Demo accounts (password: Demo1234!):
--   admin@stayhub.demo (admin) | host@stayhub.demo (host) | guest@stayhub.demo (guest)
SET FOREIGN_KEY_CHECKS=0;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `users` DISABLE KEYS */;
REPLACE INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone_number`, `created_at`, `updated_at`, `last_login`, `status`, `email_verified`, `role`) VALUES ('3be4de6a-2b68-448b-b11a-ca56ec543e85','host@stayhub.demo','$2a$10$PhkN5m5qfbgHuSEHbJYQY.u/HbyRUVoOUefO07.yOm8lxKhSSLWPi','Host','Demo',NULL,'2026-07-26 16:06:28','2026-07-26 16:06:29',NULL,'active',0,'host'),('4fd46774-db5e-4634-a95a-591a29c1d078','admin@stayhub.demo','$2a$10$BztjUDaPecinAu0mNWKRwO4PnHni57X0Ad0adGTdYl9x8C26.LeCa','Admin','Demo',NULL,'2026-07-26 16:06:28','2026-07-26 16:06:29',NULL,'active',0,'admin'),('f3f29faf-db0f-45a2-9f18-80380196163d','guest@stayhub.demo','$2a$10$WvjQpqgZNErLtMwN05.oc.kaU7RVBL1B3znKf2pULJGrs9IkALYpa','Guest','Demo',NULL,'2026-07-26 16:06:29','2026-07-26 16:06:29',NULL,'active',0,'guest');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
REPLACE INTO `user_profiles` (`user_id`, `avatar_url`, `preferred_language`, `preferred_currency`, `notification_preferences`, `address_info`, `created_at`, `updated_at`, `language`, `currency`, `notifications`) VALUES ('3be4de6a-2b68-448b-b11a-ca56ec543e85',NULL,'en','USD',NULL,NULL,'2026-07-26 16:06:28','2026-07-26 16:06:28','en','USD','{\"push\": false, \"email\": true}'),('4fd46774-db5e-4634-a95a-591a29c1d078',NULL,'en','USD',NULL,NULL,'2026-07-26 16:06:28','2026-07-26 16:06:28','en','USD','{\"push\": false, \"email\": true}'),('f3f29faf-db0f-45a2-9f18-80380196163d',NULL,'en','USD',NULL,NULL,'2026-07-26 16:06:29','2026-07-26 16:06:29','en','USD','{\"push\": false, \"email\": true}');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `user_security` DISABLE KEYS */;
REPLACE INTO `user_security` (`user_id`, `two_factor_enabled`, `two_factor_method`, `recovery_email`, `last_password_change`, `failed_login_attempts`, `last_failed_attempt`) VALUES ('3be4de6a-2b68-448b-b11a-ca56ec543e85',0,NULL,NULL,'2026-07-26 16:06:28',0,NULL),('4fd46774-db5e-4634-a95a-591a29c1d078',0,NULL,NULL,'2026-07-26 16:06:28',0,NULL),('f3f29faf-db0f-45a2-9f18-80380196163d',0,NULL,NULL,'2026-07-26 16:06:29',0,NULL);
/*!40000 ALTER TABLE `user_security` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
REPLACE INTO `properties` (`id`, `name`, `description`, `latitude`, `longitude`, `street`, `city`, `state`, `country`, `postal_code`, `price`, `rating`, `host_id`, `guests`, `bedrooms`, `beds`, `bathrooms`, `property_type`, `check_in_time`, `check_out_time`, `cancellation_policy`, `created_at`, `updated_at`, `pet_policy`, `event_policy`, `star_rating`, `languages_spoken`, `is_active`, `min_stay`, `max_stay`, `house_rules`, `is_featured`) VALUES (8,'Exigent Apartments','Luxurious apartment in the heart of Bucharest with modern amenities and stunning city views',53.38934125,-6.24288662,'Strada Victoriei 25','Bucharest','Sector 1','Romania','010063',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',4,2,3,2,'apartment','14:00:00','12:00:00','flexible','2024-12-11 21:49:14','2026-07-26 16:06:48','Pets allowed with deposit','Events allowed with prior approval',5.0,NULL,1,1,30,NULL,1),(12,'Radison Blu Hotel','radison blu',45.25730318,25.17080506,'Bd timisoara 16B, sector 6 Bucuresti','Brasov','Brasov','Romania','500030',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',11,7,2,2,'hotel','15:01:00','11:01:00','strict','2024-12-13 21:29:07','2026-07-26 16:06:48','not_allowed','not_allowed',3.5,NULL,1,2,29,NULL,0),(16,'test','test',53.38934125,-6.24288662,'37 Shanrath Road','Dublin','Ireland','Ireland','D09NY56',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',2,1,1,1,'hotel','12:00:00','00:00:00','moderate','2024-12-14 18:30:06','2026-07-26 16:08:04','pets','next',NULL,NULL,1,1,30,NULL,0),(21,'Bucharest Inn 123','Luxurious hotel in the heart of Bucharest with modern amenities and stunning city views',45.25440728,25.17105103,'Strada Principala 47','Stoenesti, Stoenesti','Arges','Romania','117675',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',1,1,1,1,'hotel','15:00:00','12:00:00','moderate','2024-12-24 13:59:46','2026-07-26 16:06:48','pets1','events1',0.0,'[]',1,1,30,NULL,0),(26,'qwertyuiop','22222',45.26281560,25.17520690,'Strada Principala 47','Stoenesti','Arges','Romania','117675',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',2,2,2,2,'house','15:00:00','12:00:00','moderate','2024-12-28 21:00:38','2026-07-26 16:06:48','1212112','123123123213',2.0,'[\"English\", \"Romanian\", \"German\"]',1,1,30,NULL,1),(27,'testIonut123','test',45.25000000,25.16667000,'Strada Principala 47','Stoenesti','Arges','Romania','117675',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',1,1,1,1,'hotel','14:00:00','11:00:00','strict','2024-12-28 21:10:58','2026-07-26 16:08:04','case_by_case','with_permission',0.0,'[\"English\", \"Italian\", \"Japanese\"]',1,1,30,NULL,0),(28,'Dragoslavele','this is a test',53.29067460,-6.42496170,'3007 Lake Drive','Dublin','Dublin','Ireland','d123',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',1,1,1,1,'villa','14:00:00','11:00:00','moderate','2025-01-04 17:04:15','2026-07-26 16:08:04','not_allowed','not_allowed',0.0,'[\"English\", \"Italian\", \"Portuguese\"]',1,1,30,NULL,0),(29,'Enothera1','this is about 20 km away from Stoenesti and this is a test111',45.16667000,25.18333000,'147 Strada Principală','Valeni','Dambovita','Romania','',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',2,2,2,2,'resort','17:00:00','14:00:00','strict','2025-01-11 20:27:09','2026-07-26 16:08:04','case_by_case','with_permission',1.0,'[\"English\", \"Spanish\", \"French\", \"German\"]',1,1,29,'hdhdhd',0),(46,'123abc','test selenium',45.25269000,25.17252890,'DN72A','Stoenești','Arges','Romania','117676',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',2,2,2,2,'treehouse','16:00:00','12:00:00','strict','2025-02-05 20:48:13','2026-07-26 16:08:04','case_by_case','with_permission',1.0,'[\"Dutch\"]',1,2,29,'no smoking selenium',0),(65,'123abc','jksbadkcjhbsjacbjnsdx',44.43225000,26.10626000,'Strada Cara Anghel 11','Bucharest','București','Romania','031006',NULL,0.0,'3be4de6a-2b68-448b-b11a-ca56ec543e85',11,11,11,11,'villa','16:00:00','13:00:00','moderate','2025-03-04 17:50:55','2026-07-26 16:08:04','case_by_case','with_permission',5.0,'[\"Turkish\", \"Swedish\", \"Indonesian\"]',1,2,30,'no smoking, motherfuckers',1);
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
REPLACE INTO `rooms` (`id`, `property_id`, `name`, `room_type`, `bed_type`, `beds`, `max_occupancy`, `base_price`, `cleaning_fee`, `service_fee`, `tax_rate`, `security_deposit`, `description`, `created_at`, `updated_at`, `bathroom_type`, `view_type`, `has_private_bathroom`, `smoking`, `accessibility_features`, `floor_level`, `has_balcony`, `has_kitchen`, `has_minibar`, `climate`, `price_per_night`, `cancellation_policy`, `includes_breakfast`, `extra_bed_available`, `pets_allowed`, `images`, `cleaning_frequency`, `has_toiletries`, `has_towels_linens`, `has_room_service`, `flooring_type`, `energy_saving_features`, `status`, `room_size`, `amenities`) VALUES (24,8,'Deluxe Double Room123','Deluxe Room','Single Bed','[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 2}]',5,151.00,46.00,21.00,23.00,105.00,'Spacious room with city view123','2024-12-12 15:42:16','2024-12-20 19:44:09','shared','Ocean View',0,1,'[\"accessibility\"]',1,1,1,1,NULL,47.00,'moderate',1,0,1,'[]','on_request',1,1,1,'Hardwood','[]','occupied',1,'[\"Balcony\", \"Kitchen\", \"Mini Bar\", \"Toiletries\", \"Towels & Linens\", \"Room Service\"]'),(25,8,'Single Room','single room','Single Bed','[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 3}]',7,100.00,20.00,15.00,19.00,50.00,'Cozy room perfect for solo travelers','2024-12-12 15:42:16','2024-12-20 19:13:15','private','City View',1,1,'[]',0,0,0,0,NULL,12.00,'flexible',0,0,1,'[]','daily',1,1,1,'Carpet','[]','available',0,'[\"Private Bathroom\"]'),(33,12,'Double Deluxe Standard1','Suite','Single Bed','\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Double Bed\\\",\\\"count\\\":1}]\"',3,NULL,NULL,NULL,NULL,NULL,'this is a test deluxe double room111','2024-12-13 21:29:07','2025-01-05 20:48:29','private','No View',0,0,'\"[]\"',1,0,0,0,'null',12.00,NULL,0,0,0,'\"[]\"',NULL,0,0,0,'Carpet','\"[]\"','available',12,'\"\\\"[]\\\"\"'),(34,12,'Deluxe triple room','Deluxe Room','Single Bed','\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Double Bed\\\",\\\"count\\\":1}]\"',3,NULL,NULL,NULL,NULL,NULL,'test triple room1111111122222','2024-12-13 21:29:07','2025-01-05 21:57:16','private','No View',0,0,'\"[]\"',11,0,0,0,'null',122.00,'flexible',0,0,0,'\"[]\"','daily',0,0,0,'Carpet','\"[]\"','available',11,'\"\\\"[\\\\\\\"Air Conditioning\\\\\\\",\\\\\\\"Balcony\\\\\\\",\\\\\\\"Safe\\\\\\\",\\\\\\\"Kitchen\\\\\\\"]\\\"\"'),(38,16,'Double room','standard room','Single Bed',NULL,2,10.00,10.00,10.00,19.00,NULL,'test','2024-12-14 18:30:06','2024-12-14 18:30:06','private',NULL,1,0,NULL,NULL,0,0,0,NULL,NULL,NULL,0,0,0,NULL,NULL,0,0,0,NULL,NULL,'available',NULL,NULL),(57,8,'johnny test 567','Suite',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}]',1,NULL,NULL,NULL,NULL,NULL,'this is the most amazing room','2024-12-20 21:47:41','2024-12-20 19:54:14','private','Pool View',0,0,'[\"additional\", \"features\"]',323,1,0,0,'null',202.00,'strict',0,0,0,'[]','monthly',1,0,1,'Marble','[\"energy\"]','maintenance',324,'[\"Balcony\", \"Toiletries\", \"Room Service\"]'),(60,21,'Deluxe Room12','Standard Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 1}, {\"type\": \"Queen Bed\", \"count\": 1}, {\"type\": \"Bunk Bed\", \"count\": 3}]',11,100.10,0.00,0.00,0.00,0.00,NULL,'2024-12-24 13:59:46','2025-03-02 16:09:11','shared','Ocean View',0,1,'[\"r\"]',5,1,0,0,'{\"type\": \"ac\", \"available\": true}',20.10,'moderate',1,0,0,'[]','biweekly',1,1,0,'Hardwood','[\"a\"]','available',311,'[\"Towels & Linens\", \"Balcony\", \"Private Bathroom\", \"Kitchen\"]'),(61,21,'test','Suite',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}]',5,46.00,NULL,NULL,NULL,NULL,'','2024-12-24 14:32:37','2024-12-24 14:44:24','shared','Ocean View',0,0,'\"[]\"',9,1,0,0,NULL,12.00,'flexible',0,0,0,'\"[]\"','on_request',1,0,1,'Carpet','\"[]\"','available',928,'\"[\\\"Balcony\\\",\\\"Toiletries\\\",\\\"Room Service\\\"]\"'),(67,26,'Amazing room','Standard Room',NULL,'\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Queen Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"King Bed\\\",\\\"count\\\":1}]\"',2,0.00,0.00,0.00,0.00,0.00,'test','2024-12-28 21:00:38','2025-03-04 17:09:58','private','City View',0,0,'\"[]\"',1,0,0,0,'{\"type\": \"ac\", \"available\": true}',12.00,'moderate',0,0,0,'[]','daily',1,1,0,'carpet','\"[]\"','available',111,'\"[\\\"Private Bathroom\\\",\\\"Safe\\\"]\"'),(68,27,'mansarda','Deluxe Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 1}]',3,2.00,2.00,2.00,2.00,2.00,'11111','2024-12-28 21:10:58','2024-12-28 21:10:58','private','City View',0,0,'[]',0,0,0,1,NULL,2.00,'flexible',1,0,0,'[]','daily',0,1,0,'Carpet','[]','available',111,'[]'),(69,28,'fidelity','Deluxe Room',NULL,'[{\"type\": \"Double Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}]',4,1.00,1.00,1.00,1.00,1.00,'121212','2025-01-04 17:04:15','2025-01-04 17:04:15','shared','City View',0,0,'[]',12,0,0,0,NULL,1.00,'moderate',0,0,0,'[]','weekly',1,1,0,'Tile','[]','available',122,'[]'),(73,29,'Amazing room1','Deluxe Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}, {\"type\": \"Bunk Bed\", \"count\": 1}]',5,0.00,NULL,NULL,NULL,NULL,'Amazing room with','2025-01-11 20:27:09','2025-02-02 20:20:29','shared','City View',0,0,'[]',1,0,0,0,'{\"type\": \"ac\", \"available\": true}',14.00,'flexible',0,0,0,'[]','daily',1,1,0,'Tile','[]','available',123,'[\"Wi-Fi\", \"TV\", \"Mini Bar\", \"Safe\"]'),(78,21,'selenium test','Deluxe Room',NULL,'[{\"type\": \"Queen Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}, {\"type\": \"Bunk Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}]',12,0.00,0.00,0.00,0.00,0.00,'this is a selenium test','2025-02-02 19:30:45','2025-03-02 16:40:12','en-suite','Pool View',0,0,'[]',114,0,0,0,'{\"type\": \"ac\", \"available\": true}',112.00,'moderate',0,0,0,'[]','daily',1,1,0,'Marble','[]','available',113,'[\"Balcony\", \"Wi-Fi\", \"TV\", \"Air Conditioning\"]'),(84,46,'1212','Deluxe Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}]',3,0.00,0.00,0.00,0.00,0.00,'14','2025-02-05 20:48:52','2025-02-05 20:52:02','en-suite','Mountain View',1,0,'[]',14,0,0,0,'{\"type\": \"ac\", \"available\": true}',1212.00,'strict',0,0,0,'[]','daily',1,1,0,'Tile','[]','available',1212,'[\"TV\", \"Wi-Fi\", \"Kitchen\"]'),(123,21,'automation room123','Suite',NULL,'\"[{\\\"type\\\":\\\"Double Bed\\\",\\\"count\\\":3},{\\\"type\\\":\\\"King Bed\\\",\\\"count\\\":3},{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":2}]\"',14,0.00,0.00,0.00,0.00,0.00,'auto description111','2025-03-03 20:15:59','2025-03-03 20:16:19','private','City View',1,0,'\"[]\"',14,0,0,0,'{\"type\": \"ac\", \"available\": true}',155.00,'moderate',0,0,0,'[]','daily',1,1,0,'Carpet','\"[]\"','available',155,'\"[\\\"Wi-Fi\\\",\\\"Safe\\\",\\\"Private Bathroom\\\",\\\"Mini Bar\\\",\\\"Air Conditioning\\\",\\\"Sea View\\\",\\\"Balcony\\\",\\\"TV\\\",\\\"Kitchen\\\"]\"'),(125,65,'123abc','Standard Room',NULL,'\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":2},{\\\"type\\\":\\\"Double Bed\\\",\\\"count\\\":2}]\"',6,0.00,0.00,0.00,0.00,0.00,'121212','2025-03-04 17:54:47','2025-03-11 19:58:53','private','No View',1,0,'\"[]\"',12,0,0,0,'{\"type\": \"ac\", \"available\": true}',12.00,'moderate',0,0,0,'[]','daily',1,1,0,'Carpet','\"[]\"','available',12,'\"[\\\"Safe\\\",\\\"TV\\\"]\"'),(126,26,'amazing suite','Suite',NULL,'\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Queen Bed\\\",\\\"count\\\":1}]\"',4,0.00,0.00,0.00,0.00,0.00,'11111','2025-03-27 18:29:40','2025-03-27 18:29:40','private','Ocean View',1,0,'\"[]\"',11,0,0,0,'\"{\\\"type\\\":\\\"ac\\\",\\\"available\\\":true}\"',11.00,'flexible',0,0,0,'\"[]\"','daily',1,1,0,'Marble','\"[]\"','available',111,'\"[\\\"Wi-Fi\\\",\\\"Kitchen\\\",\\\"Private Bathroom\\\"]\"'),(182,12,'Triple test','Deluxe Room',NULL,'\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"King Bed\\\",\\\"count\\\":2},{\\\"type\\\":\\\"Queen Bed\\\",\\\"count\\\":2}]\"',9,0.00,0.00,0.00,0.00,0.00,'triple test room with private bathroom','2026-07-26 14:15:07','2026-07-26 14:15:07','private','No View',1,0,'\"[]\"',2,0,0,0,'\"{\\\"type\\\":\\\"ac\\\",\\\"available\\\":true}\"',125.00,'flexible',0,0,0,'\"[]\"','daily',1,1,0,'Carpet','\"[]\"','available',1290,'\"[\\\"Safe\\\",\\\"Balcony\\\"]\"');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `property_amenities` DISABLE KEYS */;
REPLACE INTO `property_amenities` (`property_id`, `amenity`, `category`) VALUES (8,'Air Conditioning','general'),(8,'Balcony','outdoor'),(8,'City View','outdoor'),(8,'Coffee Maker','kitchen'),(8,'Elevator','accessibility'),(8,'Hair Dryer','bathroom'),(8,'Microwave','kitchen'),(8,'Mini Bar','room'),(8,'Rain Shower','bathroom'),(8,'TV','room'),(8,'Wheelchair Access','accessibility'),(8,'WiFi','general'),(12,'Air Conditioning','general'),(12,'Bathtub','bathroom'),(12,'BBQ Facilities','outdoor'),(12,'BBQ Grill','outdoor'),(12,'Beach Access','outdoor'),(12,'Bike Rental','outdoor'),(12,'Braille Signage','accessibility'),(12,'City View','room'),(12,'Closet','room'),(12,'Coffee Machine','kitchen'),(12,'Coffee Maker','kitchen'),(12,'Desk','room'),(12,'Dining Area','kitchen'),(12,'Dishes','kitchen'),(12,'Dishwasher','kitchen'),(12,'Elevator','accessibility'),(12,'Elevator Access','accessibility'),(12,'Emergency Cord','accessibility'),(12,'Free WiFi','general'),(12,'Full Kitchen','kitchen'),(12,'Garden','outdoor'),(12,'Grab Rails','accessibility'),(12,'Ground Floor','accessibility'),(12,'Hair Dryer','bathroom'),(12,'Heating','general'),(12,'Hot Water','bathroom'),(12,'Iron','room'),(12,'Luggage Storage','general'),(12,'Microwave','kitchen'),(12,'Mini Bar','room'),(12,'Parking','outdoor'),(12,'Private Bathroom','bathroom'),(12,'Reception 24/7','general'),(12,'Refrigerator','kitchen'),(12,'Roll-in Shower','accessibility'),(12,'Safe','room'),(12,'Security','general'),(12,'Shampoo','bathroom'),(12,'Shower','bathroom'),(12,'Swimming Pool','outdoor'),(12,'Terrace','outdoor'),(12,'test','general'),(12,'Toiletries','bathroom'),(12,'Towels','bathroom'),(12,'TV','general'),(12,'Wardrobe','room'),(12,'Washing Machine','bathroom'),(12,'Wheelchair Access','accessibility'),(12,'Wheelchair Accessible','accessibility'),(12,'Wide Doorway','accessibility'),(12,'WiFi','general'),(16,'Air Conditioning','general'),(16,'Coffee Maker','kitchen'),(16,'Ground Floor','accessibility'),(16,'Heating','general'),(16,'Hot Water','bathroom'),(16,'Iron','room'),(16,'Parking','outdoor'),(16,'test','accessibility'),(16,'TV','general'),(16,'WiFi','general');
/*!40000 ALTER TABLE `property_amenities` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `property_images` DISABLE KEYS */;
REPLACE INTO `property_images` (`id`, `property_id`, `url`, `caption`) VALUES (27,8,'https://images.unsplash.com/photo-1566073771259-6a8506099945','Hotel Exterior'),(28,8,'https://images.unsplash.com/photo-1582719508461-905c673771fd','Bedroom'),(29,8,'https://images.unsplash.com/photo-1584132967334-10e028bd69f7','Bathroom'),(33,12,'blob:http://localhost:3000/78de54e6-49aa-4de7-aeba-a5b1f3896859',NULL),(36,26,'https://picsum.photos/200/300','test'),(37,26,'https://picsum.photos/200/300','test1'),(38,26,'https://picsum.photos/200/300','main');
/*!40000 ALTER TABLE `property_images` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `property_rules` DISABLE KEYS */;
REPLACE INTO `property_rules` (`property_id`, `rule`) VALUES (8,'Check-in after 2 PM'),(8,'No parties'),(8,'No smoking'),(8,'Quiet hours after 10 PM'),(12,'no smoking'),(16,'no smoking');
/*!40000 ALTER TABLE `property_rules` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `room_amenities` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_amenities` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

SET FOREIGN_KEY_CHECKS=1;
