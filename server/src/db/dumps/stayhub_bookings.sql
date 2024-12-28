-- MySQL dump 10.13  Distrib 8.0.38, for macos14 (arm64)
--
-- Host: localhost    Database: stayhub
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `number_of_guests` int DEFAULT '1',
  `special_requests` text,
  `booking_reference` varchar(50) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text,
  `payment_status` enum('pending','paid','refunded','failed') DEFAULT 'pending',
  `terms_accepted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_reference` (`booking_reference`),
  KEY `room_id` (`room_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (57,57,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-24','2024-12-28','confirmed','2024-12-22 20:12:24','2024-12-22 20:12:24',0.00,1,NULL,'BK-15BB688F',NULL,'admin@123.com',NULL,NULL,'pending',1),(58,57,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-01','2025-01-03','confirmed','2024-12-22 20:17:21','2024-12-22 20:17:21',0.00,1,NULL,'BK-0561E372',NULL,'admin@123.com',NULL,NULL,'pending',1),(59,57,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-03','2025-01-04','confirmed','2024-12-22 20:19:54','2024-12-22 20:19:54',0.00,1,NULL,'BK-1FAA7077',NULL,'admin@123.com',NULL,NULL,'pending',1),(60,38,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-23','2024-12-25','confirmed','2024-12-22 20:32:24','2024-12-22 20:32:24',20.00,1,NULL,'BK-E8A1AE70',NULL,'admin@123.com',NULL,NULL,'pending',1),(61,24,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-23','2024-12-27','confirmed','2024-12-22 20:56:56','2024-12-22 20:56:56',604.00,1,'test','BK-C831A216',NULL,'admin@123.com',NULL,NULL,'pending',1),(62,38,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-25','2024-12-27','confirmed','2024-12-22 21:09:23','2024-12-22 21:09:23',20.00,1,NULL,'BK-B51CC0F5',NULL,'admin@123.com',NULL,NULL,'pending',1),(63,24,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-28','2025-01-04','confirmed','2024-12-23 20:11:09','2024-12-23 20:11:09',1057.00,1,NULL,'BK-4E8D1626',NULL,'admin@123.com',NULL,NULL,'pending',1),(64,47,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-23','2024-12-28','confirmed','2024-12-23 20:12:49','2024-12-23 20:12:49',60.00,1,NULL,'BK-FA3B01D2',NULL,'admin@123.com',NULL,NULL,'pending',1),(65,47,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-28','2025-01-04','confirmed','2024-12-23 20:13:15','2024-12-23 20:13:15',84.00,1,NULL,'BK-4F062A3D',NULL,'admin@123.com',NULL,NULL,'pending',1),(66,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-24','2024-12-28','confirmed','2024-12-24 14:33:06','2024-12-24 14:33:06',0.00,1,NULL,'BK-A48594F1',NULL,'admin@123.com',NULL,NULL,'pending',1),(67,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-28','2025-01-04','confirmed','2024-12-24 14:33:17','2024-12-24 14:33:17',0.00,1,NULL,'BK-5B902577',NULL,'admin@123.com',NULL,NULL,'pending',1),(68,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-04','2025-01-05','confirmed','2024-12-24 14:33:29','2024-12-24 14:33:29',0.00,1,NULL,'BK-E82466B8',NULL,'admin@123.com',NULL,NULL,'pending',1),(69,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-05','2025-01-07','confirmed','2024-12-24 14:33:43','2024-12-24 14:33:43',0.00,1,NULL,'BK-4EA3F329',NULL,'admin@123.com',NULL,NULL,'pending',1),(70,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-07','2025-01-13','confirmed','2024-12-24 14:36:04','2024-12-24 14:36:04',0.00,1,NULL,'BK-EF129EB2',NULL,'admin@123.com',NULL,NULL,'pending',1),(71,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-27','2025-01-03','confirmed','2024-12-27 20:15:40','2024-12-27 20:15:40',700.70,1,NULL,'BK-F12EBB9E',NULL,'admin@123.com',NULL,NULL,'pending',1),(72,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-03','2025-01-05','confirmed','2024-12-27 20:15:53','2024-12-27 20:15:53',200.20,1,NULL,'BK-CD6193D2',NULL,'admin@123.com',NULL,NULL,'pending',1);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-28 13:18:43
