-- MySQL dump 10.13  Distrib 9.3.0, for macos14.7 (arm64)
--
-- Host: localhost    Database: StayHub
-- ------------------------------------------------------
-- Server version	9.0.1

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

--
-- Table structure for table `blocked_dates`
--

DROP TABLE IF EXISTS `blocked_dates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocked_dates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `room_id` int DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` enum('maintenance','personal','other') NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `property_id` (`property_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `blocked_dates_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  CONSTRAINT `blocked_dates_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocked_dates`
--

LOCK TABLES `blocked_dates` WRITE;
/*!40000 ALTER TABLE `blocked_dates` DISABLE KEYS */;
/*!40000 ALTER TABLE `blocked_dates` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=276 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (57,57,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-24','2024-12-28','confirmed','2024-12-22 20:12:24','2024-12-22 20:12:24',0.00,1,NULL,'BK-15BB688F',NULL,'admin@123.com',NULL,NULL,'pending',1),(58,57,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-01','2025-01-03','confirmed','2024-12-22 20:17:21','2024-12-22 20:17:21',0.00,1,NULL,'BK-0561E372',NULL,'admin@123.com',NULL,NULL,'pending',1),(59,57,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-03','2025-01-04','confirmed','2024-12-22 20:19:54','2024-12-22 20:19:54',0.00,1,NULL,'BK-1FAA7077',NULL,'admin@123.com',NULL,NULL,'pending',1),(60,38,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-23','2024-12-25','confirmed','2024-12-22 20:32:24','2024-12-22 20:32:24',20.00,1,NULL,'BK-E8A1AE70',NULL,'admin@123.com',NULL,NULL,'pending',1),(61,24,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-23','2024-12-27','confirmed','2024-12-22 20:56:56','2024-12-22 20:56:56',604.00,1,'test','BK-C831A216',NULL,'admin@123.com',NULL,NULL,'pending',1),(62,38,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-25','2024-12-27','confirmed','2024-12-22 21:09:23','2024-12-22 21:09:23',20.00,1,NULL,'BK-B51CC0F5',NULL,'admin@123.com',NULL,NULL,'pending',1),(63,24,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-28','2025-01-04','confirmed','2024-12-23 20:11:09','2024-12-23 20:11:09',1057.00,1,NULL,'BK-4E8D1626',NULL,'admin@123.com',NULL,NULL,'pending',1),(64,47,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-23','2024-12-28','confirmed','2024-12-23 20:12:49','2024-12-23 20:12:49',60.00,1,NULL,'BK-FA3B01D2',NULL,'admin@123.com',NULL,NULL,'pending',1),(65,47,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-28','2025-01-04','confirmed','2024-12-23 20:13:15','2024-12-23 20:13:15',84.00,1,NULL,'BK-4F062A3D',NULL,'admin@123.com',NULL,NULL,'pending',1),(66,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-24','2024-12-28','cancelled','2024-12-24 14:33:06','2025-03-04 09:19:44',0.00,1,NULL,'BK-A48594F1',NULL,'admin@123.com',NULL,NULL,'pending',1),(67,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-28','2025-01-04','cancelled','2024-12-24 14:33:17','2025-02-03 19:56:59',0.00,1,NULL,'BK-5B902577',NULL,'admin@123.com',NULL,NULL,'pending',1),(68,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-04','2025-01-05','cancelled','2024-12-24 14:33:29','2025-02-03 19:56:59',0.00,1,NULL,'BK-E82466B8',NULL,'admin@123.com',NULL,NULL,'pending',1),(69,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-05','2025-01-07','cancelled','2024-12-24 14:33:43','2025-02-03 19:56:58',0.00,1,NULL,'BK-4EA3F329',NULL,'admin@123.com',NULL,NULL,'pending',1),(70,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-07','2025-01-13','cancelled','2024-12-24 14:36:04','2025-02-03 19:36:45',0.00,1,NULL,'BK-EF129EB2',NULL,'admin@123.com',NULL,NULL,'pending',1),(71,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2024-12-27','2025-01-03','cancelled','2024-12-27 20:15:40','2025-02-03 19:57:00',700.70,1,NULL,'BK-F12EBB9E',NULL,'admin@123.com',NULL,NULL,'pending',1),(72,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-03','2025-01-05','cancelled','2024-12-27 20:15:53','2025-02-03 19:56:59',200.20,1,NULL,'BK-CD6193D2',NULL,'admin@123.com',NULL,NULL,'pending',1),(73,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-01','2025-01-03','confirmed','2024-12-28 21:56:01','2024-12-28 21:56:01',2.00,1,NULL,'BK-E4CCD3A2',NULL,'admin@123.com',NULL,NULL,'pending',1),(74,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-03','2025-01-05','confirmed','2024-12-28 21:57:09','2024-12-28 21:57:09',2.00,1,NULL,'BK-98A00DA6',NULL,'admin@123.com',NULL,NULL,'pending',1),(75,69,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-14','2025-01-18','confirmed','2025-01-04 19:02:34','2025-01-04 19:02:34',4.00,1,NULL,'BK-54468660',NULL,'admin@123.com',NULL,NULL,'pending',1),(76,33,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-13','2025-01-19','confirmed','2025-01-04 20:11:30','2025-01-04 20:11:30',1080.00,1,NULL,'BK-AFD2443F',NULL,'admin@123.com',NULL,NULL,'pending',1),(77,34,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-27','2025-02-02','confirmed','2025-01-05 18:11:36','2025-01-05 18:11:36',738.00,1,NULL,'BK-BCC55CF4',NULL,'admin@123.com',NULL,NULL,'pending',1),(78,68,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-17','2025-01-18','cancelled','2025-01-05 18:12:24','2025-03-20 12:32:33',2.00,1,NULL,'BK-7F118E25',NULL,'admin@123.com',NULL,NULL,'pending',1),(79,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-05','2025-01-10','confirmed','2025-01-05 19:49:55','2025-01-05 19:49:55',5.00,1,NULL,'BK-D199C5BD',NULL,'admin@123.com',NULL,NULL,'pending',1),(80,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-21','2025-01-25','cancelled','2025-01-21 19:48:19','2025-02-03 19:39:28',400.40,1,'test','BK-86C98EEE',NULL,'admin@123.com',NULL,NULL,'pending',1),(81,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-25','2025-01-26','cancelled','2025-01-21 19:48:32','2025-02-03 19:39:22',100.10,1,NULL,'BK-BD1715EB',NULL,'admin@123.com',NULL,NULL,'pending',1),(82,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-23','2025-01-25','confirmed','2025-01-23 21:23:01','2025-01-23 21:23:01',2.00,1,NULL,'BK-4A1BC55F',NULL,'admin@123.com',NULL,NULL,'pending',1),(83,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-26','2025-01-27','confirmed','2025-01-23 21:39:46','2025-01-23 21:39:46',1.00,1,NULL,'BK-FB78E2C0',NULL,'admin@123.com',NULL,NULL,'pending',1),(84,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-27','2025-01-28','confirmed','2025-01-23 21:39:50','2025-01-23 21:39:50',1.00,1,NULL,'BK-FD6D05B2',NULL,'admin@123.com',NULL,NULL,'pending',1),(85,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-30','2025-01-31','confirmed','2025-01-23 21:44:42','2025-01-23 21:44:42',1.00,1,NULL,'BK-D5959E10',NULL,'admin@123.com',NULL,NULL,'pending',1),(86,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-01','2025-02-04','confirmed','2025-01-23 22:10:56','2025-01-23 22:10:56',100.50,1,NULL,'BK-0AAD1F1A',NULL,'admin@123.com',NULL,NULL,'pending',1),(87,33,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-30','2025-01-31','confirmed','2025-01-24 19:23:46','2025-01-24 19:23:46',12.00,1,NULL,'BK-93A74C71',NULL,'admin@123.com',NULL,NULL,'pending',1),(88,33,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-01','2025-02-07','confirmed','2025-01-24 19:32:17','2025-01-24 19:32:17',72.00,1,NULL,'BK-A727B284',NULL,'admin@123.com',NULL,NULL,'pending',1),(89,33,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-01-27','2025-01-28','confirmed','2025-01-24 20:32:08','2025-01-24 20:32:08',12.00,1,NULL,'BK-9E5CF895',NULL,'admin@123.com',NULL,NULL,'pending',1),(90,33,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-16','confirmed','2025-01-24 20:55:44','2025-01-24 20:55:44',72.00,1,NULL,'BK-8289EA0E',NULL,'admin@123.com',NULL,NULL,'pending',1),(91,33,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-18','2025-02-20','confirmed','2025-01-24 22:34:47','2025-01-24 22:34:47',24.00,1,NULL,'BK-20D6C031',NULL,'admin@123.com',NULL,NULL,'pending',1),(92,33,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-23','2025-02-23','confirmed','2025-01-24 22:35:12','2025-01-24 22:35:12',0.00,1,NULL,'BK-5737E8B9',NULL,'admin@123.com',NULL,NULL,'pending',1),(93,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-17','2025-02-19','confirmed','2025-02-01 16:53:37','2025-02-01 16:53:37',2.00,1,'make me breakfast please','BK-BF8E2369',NULL,'admin@123.com',NULL,NULL,'pending',1),(94,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-21','2025-02-23','confirmed','2025-02-01 17:41:34','2025-02-01 17:41:34',2.00,1,'vhki','BK-2317D4B7',NULL,'admin@123.com',NULL,NULL,'pending',1),(95,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-05','2025-02-07','confirmed','2025-02-01 17:43:29','2025-02-01 17:43:29',2.00,1,NULL,'BK-7FAAB7B7',NULL,'admin@123.com',NULL,NULL,'pending',1),(96,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-03','2025-03-05','confirmed','2025-02-01 17:43:37','2025-02-01 17:43:37',2.00,1,NULL,'BK-FA75A8AF',NULL,'admin@123.com',NULL,NULL,'pending',1),(97,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-08','2025-02-09','confirmed','2025-02-01 17:45:27','2025-02-01 17:45:27',1.00,1,NULL,'BK-8B7527F6',NULL,'admin@123.com',NULL,NULL,'pending',1),(98,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-11','confirmed','2025-02-01 17:46:14','2025-02-01 17:46:14',1.00,1,NULL,'BK-F7AD2B13',NULL,'admin@123.com',NULL,NULL,'pending',1),(99,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-12','2025-02-13','confirmed','2025-02-01 17:47:23','2025-02-01 17:47:23',1.00,1,NULL,'BK-B70ECB26',NULL,'admin@123.com',NULL,NULL,'pending',1),(100,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-14','2025-02-15','confirmed','2025-02-01 17:48:30','2025-02-01 17:48:30',1.00,1,NULL,'BK-298D11D4',NULL,'admin@123.com',NULL,NULL,'pending',1),(101,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-26','cancelled','2025-02-01 17:49:50','2025-02-01 18:48:56',2.00,1,NULL,'BK-36247E40',NULL,'admin@123.com',NULL,NULL,'pending',1),(102,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-27','2025-02-28','confirmed','2025-02-01 17:56:39','2025-02-01 17:56:39',1.00,1,NULL,'BK-D6D52595',NULL,'admin@123.com',NULL,NULL,'pending',1),(103,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-06','2025-03-07','confirmed','2025-02-01 17:58:33','2025-02-01 17:58:33',1.00,1,NULL,'BK-C9C3814A',NULL,'admin@123.com',NULL,NULL,'pending',1),(104,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-08','2025-03-09','confirmed','2025-02-01 18:00:49','2025-02-01 18:00:49',1.00,1,NULL,'BK-5C56A1D0',NULL,'admin@123.com',NULL,NULL,'pending',1),(105,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-10','2025-03-11','confirmed','2025-02-01 18:01:42','2025-02-01 18:01:42',1.00,1,NULL,'BK-B403BFD9',NULL,'admin@123.com',NULL,NULL,'pending',1),(106,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-12','2025-03-13','confirmed','2025-02-01 18:03:25','2025-02-01 18:03:25',1.00,1,NULL,'BK-A6C43A80',NULL,'admin@123.com',NULL,NULL,'pending',1),(107,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-14','2025-03-15','confirmed','2025-02-01 18:04:55','2025-02-01 18:04:55',1.00,1,NULL,'BK-56A56333',NULL,'admin@123.com',NULL,NULL,'pending',1),(108,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-17','2025-03-18','confirmed','2025-02-01 18:05:11','2025-02-01 18:05:11',1.00,1,NULL,'BK-AA4F5DB9',NULL,'admin@123.com',NULL,NULL,'pending',1),(109,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-19','2025-03-20','cancelled','2025-02-01 18:16:18','2025-02-01 18:42:52',1.00,1,NULL,'BK-538A3428',NULL,'admin@123.com',NULL,NULL,'pending',1),(110,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-25','confirmed','2025-02-02 16:49:20','2025-02-02 16:49:20',0.00,1,NULL,'BK-3D433722',NULL,'admin@123.com',NULL,NULL,'pending',1),(111,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-03','2025-02-05','cancelled','2025-02-02 17:10:23','2025-02-02 17:12:40',40.20,1,NULL,'BK-DC38FC6D',NULL,'admin@123.com',NULL,NULL,'pending',1),(112,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-03','2025-02-05','cancelled','2025-02-02 17:13:06','2025-02-02 17:14:10',40.20,1,NULL,'BK-1095B77E',NULL,'admin@123.com',NULL,NULL,'pending',1),(113,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-03','2025-02-05','cancelled','2025-02-02 17:15:10','2025-02-03 19:14:33',40.20,1,NULL,'BK-51642E87',NULL,'admin@123.com',NULL,NULL,'pending',1),(114,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-16','cancelled','2025-02-02 17:21:56','2025-02-02 17:22:20',120.60,1,NULL,'BK-879000FE',NULL,'admin@123.com',NULL,NULL,'pending',1),(115,73,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-09','2025-02-10','cancelled','2025-02-02 19:15:28','2025-02-05 19:07:38',145.00,1,NULL,'BK-FE6039C7',NULL,'admin@123.com',NULL,NULL,'pending',1),(116,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-16','cancelled','2025-02-02 20:47:53','2025-02-03 19:13:41',120.60,1,NULL,'BK-4540D7EA',NULL,'admin@123.com',NULL,NULL,'pending',1),(117,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-03 18:46:39','2025-02-03 18:47:00',80.40,1,NULL,'BK-FB9C9B46',NULL,'admin@123.com',NULL,NULL,'pending',1),(118,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-03 19:02:43','2025-02-03 19:13:22',80.40,1,NULL,'BK-242D0334',NULL,'admin@123.com',NULL,NULL,'pending',1),(126,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-03 19:30:34','2025-02-03 19:30:46',80.40,1,NULL,'BK-706B045A',NULL,'admin@123.com',NULL,NULL,'pending',1),(127,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-03 19:31:00','2025-02-03 19:31:09',80.40,1,NULL,'BK-0BCB9B5E',NULL,'admin@123.com',NULL,NULL,'pending',1),(128,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-03 19:31:17','2025-02-03 19:31:39',80.40,1,NULL,'BK-597A0C2D',NULL,'admin@123.com',NULL,NULL,'pending',1),(129,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-11','cancelled','2025-02-03 19:49:19','2025-02-03 19:56:54',20.10,1,NULL,'BK-B3533C8D',NULL,'admin@123.com',NULL,NULL,'pending',1),(130,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-11','2025-02-12','cancelled','2025-02-03 19:49:24','2025-02-03 19:55:28',20.10,1,NULL,'BK-2EE8628F',NULL,'admin@123.com',NULL,NULL,'pending',1),(131,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-12','2025-02-13','cancelled','2025-02-03 19:49:28','2025-02-03 19:55:26',20.10,1,NULL,'BK-EEAD2F01',NULL,'admin@123.com',NULL,NULL,'pending',1),(132,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-03','2025-02-04','cancelled','2025-02-03 19:58:25','2025-02-03 20:19:32',20.10,1,NULL,'BK-FD54A002',NULL,'admin@123.com',NULL,NULL,'pending',1),(133,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-04','2025-02-05','cancelled','2025-02-03 19:58:33','2025-02-03 20:19:23',20.10,1,NULL,'BK-45619798',NULL,'admin@123.com',NULL,NULL,'pending',1),(134,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-06','2025-02-09','cancelled','2025-02-03 19:58:45','2025-02-03 20:19:21',80.40,1,'','BK-3BB0205B',NULL,'admin@123.com',NULL,NULL,'pending',1),(135,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-12','2025-02-15','cancelled','2025-02-03 20:06:02','2025-02-03 20:14:16',120.60,1,'','BK-02A508F8',NULL,'admin@123.com',NULL,NULL,'pending',1),(136,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-11','cancelled','2025-02-03 20:14:27','2025-02-03 20:19:19',20.10,1,NULL,'BK-844D9C88',NULL,'admin@123.com',NULL,NULL,'pending',1),(137,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-12','2025-02-13','cancelled','2025-02-03 20:16:20','2025-02-03 20:19:18',20.10,1,NULL,'BK-2A0F5CFE',NULL,'admin@123.com',NULL,NULL,'pending',1),(138,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-14','2025-02-15','cancelled','2025-02-03 20:17:39','2025-02-03 20:19:16',20.10,1,NULL,'BK-B64E3C6F',NULL,'admin@123.com',NULL,NULL,'pending',1),(139,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-03','2025-02-05','cancelled','2025-02-03 20:19:42','2025-02-06 21:57:07',40.20,1,NULL,'BK-F1285AF1',NULL,'admin@123.com',NULL,NULL,'pending',1),(140,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-05','2025-02-06','cancelled','2025-02-03 20:19:51','2025-02-06 21:57:04',20.10,1,NULL,'BK-10D9D760',NULL,'admin@123.com',NULL,NULL,'pending',1),(141,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-06','2025-02-07','cancelled','2025-02-03 20:19:59','2025-02-06 21:57:01',20.10,1,NULL,'BK-9D68168B',NULL,'admin@123.com',NULL,NULL,'pending',1),(142,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-07','2025-02-08','cancelled','2025-02-03 20:26:01','2025-02-06 21:56:58',20.10,1,NULL,'BK-DC91C3A3',NULL,'admin@123.com',NULL,NULL,'pending',1),(143,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-08','2025-02-09','cancelled','2025-02-03 20:26:30','2025-02-06 21:56:55',20.10,1,NULL,'BK-03578015',NULL,'admin@123.com',NULL,NULL,'pending',1),(144,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-09','2025-02-10','cancelled','2025-02-03 20:27:00','2025-02-06 21:56:52',20.10,1,NULL,'BK-CDA40EA2',NULL,'admin@123.com',NULL,NULL,'pending',1),(145,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-11','cancelled','2025-02-03 20:27:08','2025-02-06 21:56:49',20.10,1,NULL,'BK-0C168552',NULL,'admin@123.com',NULL,NULL,'pending',1),(146,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-11','2025-02-12','cancelled','2025-02-03 20:27:40','2025-02-06 21:56:45',20.10,1,NULL,'BK-4DD409CA',NULL,'admin@123.com',NULL,NULL,'pending',1),(147,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-12','2025-02-13','cancelled','2025-02-03 20:27:53','2025-02-06 21:56:42',20.10,1,NULL,'BK-CD324F29',NULL,'admin@123.com',NULL,NULL,'pending',1),(148,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-13','2025-02-14','cancelled','2025-02-03 20:28:33','2025-02-06 21:56:39',20.10,1,NULL,'BK-DB3D24F2',NULL,'admin@123.com',NULL,NULL,'pending',1),(149,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-14','2025-02-15','cancelled','2025-02-03 20:28:50','2025-02-06 21:56:35',20.10,1,NULL,'BK-B0E537B4',NULL,'admin@123.com',NULL,NULL,'pending',1),(150,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-15','2025-02-16','cancelled','2025-02-03 20:31:34','2025-02-06 21:56:32',20.10,1,'this is a test','BK-156DC29F',NULL,'admin@123.com',NULL,NULL,'pending',1),(151,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-16','2025-02-17','cancelled','2025-02-03 20:38:34','2025-02-03 21:20:03',20.10,1,NULL,'BK-C1E8F42E',NULL,'admin@123.com',NULL,NULL,'pending',1),(152,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-17','2025-02-18','cancelled','2025-02-03 20:43:17','2025-02-04 19:06:39',20.10,1,NULL,'BK-0669EC9C',NULL,'admin@123.com',NULL,NULL,'pending',1),(153,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-18','2025-02-19','cancelled','2025-02-03 20:44:34','2025-02-06 21:56:29',20.10,1,NULL,'BK-FAC88797',NULL,'admin@123.com',NULL,NULL,'pending',1),(154,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-19','2025-02-21','cancelled','2025-02-03 20:44:48','2025-02-04 19:48:56',40.20,1,'test','BK-0EFA7D28',NULL,'admin@123.com',NULL,NULL,'pending',1),(155,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-23','2025-02-24','cancelled','2025-02-03 20:55:36','2025-02-04 19:48:48',154.21,1,NULL,'BK-89B6B7FA',NULL,'admin@123.com',NULL,NULL,'pending',1),(156,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-25','2025-02-26','cancelled','2025-02-04 18:04:09','2025-02-04 19:06:11',128.00,1,NULL,'e1913859-aa36-4e3b-b1d3-4ef271b51b4b',NULL,NULL,NULL,NULL,'pending',0),(157,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-24','cancelled','2025-02-04 18:36:01','2025-02-04 18:38:27',0.00,1,NULL,'71ffa55a-0e85-4d50-8052-648a99cf94e5',NULL,NULL,NULL,NULL,'pending',0),(158,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-27','cancelled','2025-02-04 18:45:22','2025-02-04 18:45:40',171.36,1,NULL,'67d3ca7c-5ca4-4d8a-b982-75e3d4c09595',NULL,NULL,NULL,NULL,'pending',0),(159,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-25','cancelled','2025-02-04 18:48:40','2025-02-04 19:06:07',147.36,1,NULL,'ff69dc75-f4d1-4b85-aac3-6459df8b6155',NULL,NULL,NULL,NULL,'pending',0),(160,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-17','2025-02-18','cancelled','2025-02-04 19:05:08','2025-02-04 19:06:41',333.33,1,NULL,'BK-J3GJ4H8K',NULL,NULL,NULL,NULL,'pending',0),(161,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-17','2025-02-19','cancelled','2025-02-04 19:06:53','2025-02-04 19:32:26',666.66,1,NULL,'BK-2M4I8A87',NULL,NULL,NULL,NULL,'pending',0),(162,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-17','2025-02-19','cancelled','2025-02-04 19:32:54','2025-02-04 19:33:19',666.66,1,NULL,'BK-MUUX0K4U',NULL,NULL,NULL,NULL,'pending',0),(163,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-18','2025-02-21','cancelled','2025-02-04 20:15:42','2025-03-04 09:19:39',999.99,1,NULL,'BK-GYPQK5LN',NULL,NULL,NULL,NULL,'pending',0),(164,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-15','2025-02-17','cancelled','2025-02-05 17:01:01','2025-03-04 09:19:41',666.66,1,NULL,'BK-AU3K0HFB',NULL,NULL,NULL,NULL,'pending',0),(165,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 19:32:07','2025-02-05 19:33:21',322.42,1,'testing','BK-EICEJQHY',NULL,NULL,NULL,NULL,'pending',0),(166,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 19:34:24','2025-02-05 19:34:42',322.42,1,'test','BK-H6FF365O',NULL,NULL,NULL,NULL,'pending',0),(167,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 19:37:24','2025-02-05 19:38:35',322.42,1,'test','BK-T29OXQZ8',NULL,NULL,NULL,NULL,'pending',0),(168,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 19:39:07','2025-02-05 19:42:17',322.42,1,'test','BK-472QZOU1',NULL,NULL,NULL,NULL,'pending',0),(169,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 19:58:18','2025-02-05 19:58:50',322.42,1,'test','BK-00IMB6Q0',NULL,NULL,NULL,NULL,'pending',0),(170,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 19:59:23','2025-02-05 20:02:04',322.42,1,'dfgfgbdfg','BK-Y2XW7VS4',NULL,NULL,NULL,NULL,'pending',0),(171,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 20:02:49','2025-02-05 20:05:41',322.42,1,'test','BK-YBS62EJV',NULL,NULL,NULL,NULL,'pending',0),(172,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 20:06:11','2025-02-05 20:07:11',322.42,1,'test','BK-Z7439DTR',NULL,NULL,NULL,NULL,'pending',0),(173,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 20:08:03','2025-02-05 20:08:36',322.42,1,'test','BK-I51T3A79',NULL,NULL,NULL,NULL,'pending',0),(174,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 20:10:49','2025-02-05 20:11:34',322.42,1,'test','BK-XQH82JQK',NULL,NULL,NULL,NULL,'pending',0),(175,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-24','2025-02-28','cancelled','2025-02-05 20:14:13','2025-02-05 20:14:23',322.42,1,'test','BK-5AK9EN52',NULL,NULL,NULL,NULL,'pending',0),(176,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-05 20:23:29','2025-02-05 20:23:39',440.40,1,'test','BK-EBIGIGBG',NULL,NULL,NULL,NULL,'pending',0),(177,84,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-13','2025-02-16','confirmed','2025-02-05 20:55:16','2025-02-05 20:55:16',3636.00,1,NULL,'BK-WD9QJUER',NULL,NULL,NULL,NULL,'pending',0),(178,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-05 20:55:38','2025-02-05 20:55:41',440.40,1,'test','BK-CK7TQG2M',NULL,NULL,NULL,NULL,'pending',0),(181,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-05 22:06:19','2025-02-05 22:06:22',440.40,1,'test','BK-HXN92X9L',NULL,NULL,NULL,NULL,'pending',0),(182,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-05 22:07:40','2025-02-05 22:07:43',440.40,1,'test','BK-6CPHFP37',NULL,NULL,NULL,NULL,'pending',0),(183,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-06 20:23:52','2025-02-06 20:23:58',440.40,1,'test','BK-2CYR2JJU',NULL,NULL,NULL,NULL,'pending',0),(184,60,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-02-23','2025-03-01','cancelled','2025-02-06 20:59:50','2025-02-06 21:50:19',630.63,1,'','BK-8VFRGYDU',NULL,NULL,NULL,NULL,'pending',0),(185,60,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-02-19','2025-02-28','cancelled','2025-02-06 21:01:27','2025-02-06 21:50:02',691.14,1,'','BK-C5Y6J50P',NULL,NULL,NULL,NULL,'pending',0),(186,60,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-02-27','2025-02-28','cancelled','2025-02-06 21:01:41','2025-02-06 21:26:05',154.00,1,NULL,'BK-YBSUVU68',NULL,NULL,NULL,NULL,'pending',0),(187,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-07 00:06:32','2025-02-07 00:06:37',440.40,1,'test','BK-DJ95ZCEI',NULL,NULL,NULL,NULL,'pending',0),(188,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-07 00:17:05','2025-02-07 00:17:09',440.40,1,'test','BK-YOX7KYOP',NULL,NULL,NULL,NULL,'pending',0),(189,60,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-01','2025-03-06','cancelled','2025-02-07 00:44:02','2025-03-04 09:19:37',0.00,1,'','BK-Y7K8N04W',NULL,NULL,NULL,NULL,'pending',0),(190,60,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-10','2025-03-13','cancelled','2025-02-07 00:49:52','2025-02-16 11:39:47',60.30,1,'special request: quiet room','BK-T3U6UMLW',NULL,NULL,NULL,NULL,'pending',0),(191,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-07 00:56:18','2025-02-07 00:56:18',440.40,1,NULL,'BK-F35865S9',NULL,NULL,NULL,NULL,'pending',0),(192,24,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-16','confirmed','2025-02-08 09:50:29','2025-02-08 09:50:29',282.00,5,'test please','BK-XK7OWYRI',NULL,NULL,NULL,NULL,'pending',0),(193,25,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-02-10','2025-02-16','confirmed','2025-02-08 09:52:42','2025-02-08 09:52:42',72.00,1,NULL,'BK-SYC8T8NC',NULL,NULL,NULL,NULL,'pending',0),(194,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-02-15 19:57:18','2025-02-15 19:57:25',440.40,1,NULL,'BK-95FR71KO',NULL,NULL,NULL,NULL,'pending',0),(195,78,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-12','2025-03-15','cancelled','2025-03-01 12:10:11','2025-03-04 09:19:32',372.00,1,NULL,'BK-XCTAA1HU',NULL,NULL,NULL,NULL,'pending',0),(196,78,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-16','2025-03-17','cancelled','2025-03-01 12:10:48','2025-03-04 09:19:13',124.00,1,NULL,'BK-YKVQ2S0W',NULL,NULL,NULL,NULL,'pending',0),(197,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-12','2025-03-14','cancelled','2025-03-01 14:58:15','2025-03-04 09:19:29',40.20,1,NULL,'BK-XLKH3PYA',NULL,NULL,NULL,NULL,'pending',0),(198,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-14','2025-03-16','cancelled','2025-03-01 14:58:25','2025-03-04 09:19:16',40.20,1,NULL,'BK-Q0AQYVX7',NULL,NULL,NULL,NULL,'pending',0),(199,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-17','2025-03-19','cancelled','2025-03-01 14:58:31','2025-03-04 09:19:11',40.20,1,NULL,'BK-49DZ311T',NULL,NULL,NULL,NULL,'pending',0),(200,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-19','2025-03-22','cancelled','2025-03-01 14:58:42','2025-03-04 09:19:06',60.30,1,NULL,'BK-VX2MNAXH',NULL,NULL,NULL,NULL,'pending',0),(201,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-28','2025-05-02','cancelled','2025-03-02 16:27:01','2025-03-02 16:27:53',80.40,1,'test','BK-3K49RKME',NULL,NULL,NULL,NULL,'pending',0),(202,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-28','2025-05-02','cancelled','2025-03-02 16:29:52','2025-03-02 16:29:53',80.40,1,'test','BK-J8I3BH6G',NULL,NULL,NULL,NULL,'pending',0),(203,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-29','2025-04-02','cancelled','2025-03-02 17:34:45','2025-03-04 09:18:55',80.40,1,'','BK-RGPJUNAG',NULL,NULL,NULL,NULL,'pending',0),(204,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-30','2025-03-31','cancelled','2025-03-02 18:56:50','2025-03-04 09:18:28',20.10,1,'jahsbfvjhadbc,kjds ','BK-6KZOAAX7',NULL,NULL,NULL,NULL,'pending',0),(205,78,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-28','cancelled','2025-03-02 20:14:19','2025-03-04 09:19:03',448.00,1,'this is a test','BK-UUC3JOK4',NULL,NULL,NULL,NULL,'pending',0),(206,78,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-03','2025-03-08','cancelled','2025-03-02 20:45:51','2025-03-04 09:19:34',560.00,3,NULL,'BK-1BN0L4UA',NULL,NULL,NULL,NULL,'pending',0),(207,78,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-18','2025-03-21','cancelled','2025-03-02 20:46:14','2025-03-04 09:19:08',336.00,1,NULL,'BK-RAWRVO97',NULL,NULL,NULL,NULL,'pending',0),(208,78,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-29','2025-03-30','cancelled','2025-03-02 20:50:03','2025-03-04 09:18:30',112.00,1,NULL,'BK-9GFTB2DC',NULL,NULL,NULL,NULL,'pending',0),(209,78,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-31','2025-04-01','cancelled','2025-03-02 20:50:10','2025-03-04 09:18:22',112.00,1,NULL,'BK-ESOXTO10',NULL,NULL,NULL,NULL,'pending',0),(210,47,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-04','2025-03-07','confirmed','2025-03-03 10:07:30','2025-03-03 10:07:30',375.00,1,NULL,'BK-1UG2OS66',NULL,NULL,NULL,NULL,'pending',0),(211,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-01','2025-04-04','cancelled','2025-03-03 10:19:28','2025-03-04 09:18:18',60.30,1,NULL,'BK-E9P6TL9U',NULL,NULL,NULL,NULL,'pending',0),(212,84,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-13','2025-03-16','confirmed','2025-03-03 10:20:17','2025-03-03 10:20:17',3636.00,1,NULL,'BK-J25AAUOZ',NULL,NULL,NULL,NULL,'pending',0),(213,84,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-24','2025-03-26','confirmed','2025-03-03 10:20:47','2025-03-03 10:20:47',2424.00,1,NULL,'BK-94WPIE5A',NULL,NULL,NULL,NULL,'pending',0),(218,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-25','2025-03-27','cancelled','2025-03-03 21:33:18','2025-03-04 09:18:12',24.00,1,NULL,'BK-JTB7UPWL',NULL,NULL,NULL,NULL,'pending',0),(219,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-25','2025-03-27','cancelled','2025-03-04 09:01:02','2025-03-04 09:19:00',220.20,1,'jygfj','BK-P72GFNIM',NULL,NULL,NULL,NULL,'pending',0),(220,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-25','2025-03-27','cancelled','2025-03-04 09:20:00','2025-03-20 21:20:12',220.20,1,NULL,'BK-UZ7YXPBQ',NULL,NULL,NULL,NULL,'pending',0),(223,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-26','2025-03-29','confirmed','2025-03-04 17:09:27','2025-03-04 17:09:27',528.00,1,NULL,'BK-MVBYVU2P',NULL,NULL,NULL,NULL,'pending',0),(224,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-30','2025-03-31','confirmed','2025-03-04 17:10:15','2025-03-04 17:10:15',12.00,1,NULL,'BK-76HJ7Z4Q',NULL,NULL,NULL,NULL,'pending',0),(225,123,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-25','2025-03-27','cancelled','2025-03-04 20:12:27','2025-03-20 21:20:15',310.00,1,NULL,'BK-HJAKZBRJ',NULL,NULL,NULL,NULL,'pending',0),(226,61,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-25','2025-03-27','cancelled','2025-03-04 20:14:00','2025-03-20 21:20:18',24.00,1,NULL,'BK-XOZ0JMC4',NULL,NULL,NULL,NULL,'pending',0),(227,125,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-29','2025-03-31','cancelled','2025-03-09 19:35:44','2025-03-11 20:00:46',24.00,1,NULL,'BK-RENQTL4V',NULL,NULL,NULL,NULL,'pending',0),(228,125,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-18','2025-03-22','confirmed','2025-03-09 19:36:14','2025-03-09 19:36:42',0.00,1,'','BK-512I0WXZ',NULL,NULL,NULL,NULL,'pending',0),(229,125,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-11','2025-03-12','confirmed','2025-03-11 16:25:06','2025-03-11 16:25:06',12.00,1,NULL,'BK-C35MTX9G',NULL,NULL,NULL,NULL,'pending',0),(230,125,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-13','2025-03-14','confirmed','2025-03-11 16:25:15','2025-03-11 16:25:15',12.00,1,NULL,'BK-PGBVE70H',NULL,NULL,NULL,NULL,'pending',0),(231,125,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-15','2025-03-17','confirmed','2025-03-11 19:53:29','2025-03-11 19:53:29',135.00,4,'i want to smoke in the room','BK-3Z061LOX',NULL,NULL,NULL,NULL,'pending',0),(232,123,'ca8e83d5-3717-42a3-a58c-774f7173872c','2025-03-17','2025-03-21','cancelled','2025-03-11 20:21:31','2025-03-20 21:20:25',620.00,3,'gffgukhgjyfhtyjgukhgjh','BK-2FGGM4AV',NULL,NULL,NULL,NULL,'pending',0),(233,125,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-23','2025-03-25','confirmed','2025-03-16 20:58:23','2025-03-16 20:58:23',1108.00,1,NULL,'BK-8ZI2UKWD',NULL,NULL,NULL,NULL,'pending',0),(234,125,'3471b43b-d6c1-4341-9a07-387d0643e16c','2025-03-26','2025-03-27','confirmed','2025-03-18 18:08:48','2025-03-18 18:08:48',554.00,1,NULL,'BK-BWPJ40M0',NULL,NULL,NULL,NULL,'pending',0),(235,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-28','2025-03-29','confirmed','2025-03-20 08:41:37','2025-03-20 08:41:37',554.00,1,NULL,'BK-CVM328LP',NULL,NULL,NULL,NULL,'pending',0),(236,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-01','2025-04-04','confirmed','2025-03-20 12:30:34','2025-03-20 12:30:34',36.00,1,NULL,'BK-HMKB4IO5',NULL,NULL,NULL,NULL,'pending',0),(237,73,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-20','2025-03-22','confirmed','2025-03-20 20:47:51','2025-03-20 20:47:51',28.00,1,NULL,'BK-P435JXD2',NULL,NULL,NULL,NULL,'pending',0),(238,73,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-25','2025-03-27','confirmed','2025-03-20 20:50:25','2025-03-20 20:50:25',28.00,1,NULL,'BK-RS04GTNU',NULL,NULL,NULL,NULL,'pending',0),(239,73,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-30','2025-03-31','confirmed','2025-03-20 20:54:12','2025-03-20 20:54:12',14.00,1,NULL,'BK-PT3A3TBT',NULL,NULL,NULL,NULL,'pending',0),(240,84,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-27','2025-03-29','confirmed','2025-03-20 20:55:42','2025-03-20 20:55:42',2424.00,1,NULL,'BK-Z8M3EJIU',NULL,NULL,NULL,NULL,'pending',0),(241,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-28','2025-03-31','cancelled','2025-03-20 21:13:47','2025-03-20 21:20:02',150.30,1,NULL,'BK-S3OBEOV8',NULL,NULL,NULL,NULL,'pending',0),(242,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-20','2025-03-22','cancelled','2025-03-20 21:15:33','2025-03-20 21:20:22',40.20,1,NULL,'BK-1OR8TSKJ',NULL,NULL,NULL,NULL,'pending',0),(243,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-01','2025-04-03','cancelled','2025-03-20 21:16:40','2025-03-20 21:19:59',40.20,1,NULL,'BK-CA9FDN5C',NULL,NULL,NULL,NULL,'pending',0),(244,60,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-23','2025-03-29','confirmed','2025-03-20 21:33:12','2025-03-20 21:33:12',660.60,1,NULL,'BK-KE2VN73B',NULL,NULL,NULL,NULL,'pending',0),(245,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-06','2025-04-09','confirmed','2025-03-20 21:49:54','2025-03-20 21:49:54',36.00,1,NULL,'BK-I16VYYM9',NULL,NULL,NULL,NULL,'pending',0),(246,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-23','2025-03-25','confirmed','2025-03-20 22:04:23','2025-03-20 22:04:23',188.00,1,NULL,'BK-OX33UIOV',NULL,NULL,NULL,NULL,'pending',0),(247,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-20','2025-04-22','confirmed','2025-03-20 22:23:02','2025-03-20 22:23:02',24.00,1,NULL,'BK-VA10JIEA',NULL,NULL,NULL,NULL,'pending',0),(248,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-15','2025-04-18','confirmed','2025-03-20 22:29:40','2025-03-20 22:29:40',36.00,1,NULL,'BK-GTI08QND',NULL,NULL,NULL,NULL,'pending',0),(249,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-04','2025-04-06','confirmed','2025-03-20 22:40:23','2025-03-20 22:40:23',24.00,1,NULL,'BK-KDK1KTU7',NULL,NULL,NULL,NULL,'pending',0),(250,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-18','2025-04-20','confirmed','2025-03-20 22:40:53','2025-03-20 22:40:53',24.00,1,NULL,'BK-O127DBL3',NULL,NULL,NULL,NULL,'pending',0),(251,69,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-23','2025-03-25','confirmed','2025-03-20 22:42:22','2025-03-20 22:42:22',2.00,1,NULL,'BK-74IQ2X3J',NULL,NULL,NULL,NULL,'pending',0),(252,69,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-25','2025-03-27','confirmed','2025-03-20 22:42:34','2025-03-20 22:42:34',2.00,1,NULL,'BK-XD5MHBBR',NULL,NULL,NULL,NULL,'pending',0),(253,69,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-28','2025-03-30','confirmed','2025-03-20 22:56:18','2025-03-20 22:56:18',2.00,1,NULL,'BK-U7ZUHQRL',NULL,NULL,NULL,NULL,'pending',0),(254,84,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-03-30','2025-03-31','confirmed','2025-03-25 21:50:03','2025-03-25 21:50:03',1212.00,1,NULL,'BK-9M4I1KJG',NULL,NULL,NULL,NULL,'pending',0),(255,84,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-01','2025-04-04','confirmed','2025-03-25 21:50:16','2025-03-25 21:50:16',3636.00,1,NULL,'BK-GM5SC570',NULL,NULL,NULL,NULL,'pending',0),(256,84,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-05','2025-04-07','confirmed','2025-03-25 21:50:27','2025-03-25 21:50:27',2424.00,1,NULL,'BK-CM2XTIW0',NULL,NULL,NULL,NULL,'pending',0),(257,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-27','2025-04-30','confirmed','2025-03-26 18:58:05','2025-03-26 18:58:05',36.00,1,NULL,'BK-FZBRO4JW',NULL,NULL,NULL,NULL,'pending',0),(258,67,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-04-23','2025-04-26','confirmed','2025-03-27 21:27:06','2025-03-27 21:27:06',36.00,1,NULL,'BK-M75BIHM3',NULL,NULL,NULL,NULL,'pending',0),(259,60,'a116a205-65a6-4796-91e4-697a30965087','2025-08-18','2025-08-21','confirmed','2025-08-08 19:48:37','2025-08-08 19:48:37',60.30,1,NULL,'BK-JNXDB79Y',NULL,NULL,NULL,NULL,'pending',0),(260,60,'a116a205-65a6-4796-91e4-697a30965087','2025-08-22','2025-08-25','confirmed','2025-08-08 19:49:01','2025-08-08 19:49:01',60.30,3,NULL,'BK-IRK1UZR5',NULL,NULL,NULL,NULL,'pending',0),(261,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-12-16','2025-12-19','confirmed','2025-12-04 20:08:29','2025-12-04 20:08:29',36.00,1,NULL,'BK-MTTX3BSO',NULL,NULL,NULL,NULL,'pending',0),(262,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-12-13','2025-12-15','confirmed','2025-12-04 20:22:09','2025-12-04 20:22:09',24.00,2,NULL,'BK-RPVWKMJ1',NULL,NULL,NULL,NULL,'pending',0),(263,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-12-06','2025-12-08','confirmed','2025-12-04 20:22:22','2025-12-04 20:22:22',24.00,1,NULL,'BK-T1CGA4RQ',NULL,NULL,NULL,NULL,'pending',0),(264,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-12-20','2025-12-23','confirmed','2025-12-04 20:29:19','2025-12-04 20:29:19',36.00,1,NULL,'BK-A36XS9OT',NULL,NULL,NULL,NULL,'pending',0),(265,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-12-24','2025-12-25','confirmed','2025-12-04 20:29:32','2025-12-04 20:29:32',12.00,1,NULL,'BK-SMA8M6N5',NULL,NULL,NULL,NULL,'pending',0),(266,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-12-26','2025-12-28','confirmed','2025-12-04 20:51:00','2025-12-04 20:51:00',24.00,1,NULL,'BK-LB283IMP',NULL,NULL,NULL,NULL,'pending',0),(267,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-12-29','2025-12-30','confirmed','2025-12-04 20:51:27','2025-12-04 20:51:27',12.00,1,NULL,'BK-7F8C1YF2',NULL,NULL,NULL,NULL,'pending',0),(268,125,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','2025-12-09','2025-12-13','confirmed','2025-12-04 20:58:44','2025-12-04 20:58:44',48.00,1,NULL,'BK-HST7TDTQ',NULL,NULL,NULL,NULL,'pending',0),(269,84,'ca8e83d5-3717-42a3-a58c-774f7173872c','2025-12-09','2025-12-12','confirmed','2025-12-09 20:48:33','2025-12-09 20:48:33',3636.00,2,NULL,'BK-AOB8J30T',NULL,NULL,NULL,NULL,'pending',0),(270,61,'ca8e83d5-3717-42a3-a58c-774f7173872c','2025-12-25','2025-12-31','confirmed','2025-12-09 20:49:29','2025-12-09 20:49:29',72.00,1,NULL,'BK-B59X9BQF',NULL,NULL,NULL,NULL,'pending',0),(271,61,'ca8e83d5-3717-42a3-a58c-774f7173872c','2025-12-12','2025-12-14','confirmed','2025-12-09 20:53:16','2025-12-09 20:53:16',24.00,1,NULL,'BK-QF98VUB7',NULL,NULL,NULL,NULL,'pending',0),(272,61,'ca8e83d5-3717-42a3-a58c-774f7173872c','2025-12-14','2025-12-16','confirmed','2025-12-09 20:53:26','2025-12-09 20:53:26',24.00,1,NULL,'BK-P3BL7982',NULL,NULL,NULL,NULL,'pending',0),(273,61,'ca8e83d5-3717-42a3-a58c-774f7173872c','2025-12-10','2025-12-12','confirmed','2025-12-09 20:53:38','2025-12-09 20:53:38',24.00,1,NULL,'BK-9LJAWIKN',NULL,NULL,NULL,NULL,'pending',0),(274,61,'ca8e83d5-3717-42a3-a58c-774f7173872c','2026-01-01','2026-01-02','confirmed','2025-12-09 20:55:45','2025-12-09 20:55:45',12.00,1,NULL,'BK-7ND6NLPN',NULL,NULL,NULL,NULL,'pending',0),(275,73,'ca8e83d5-3717-42a3-a58c-774f7173872c','2025-12-22','2025-12-25','confirmed','2025-12-09 21:10:56','2025-12-09 21:10:56',42.00,1,NULL,'BK-MH85328I',NULL,NULL,NULL,NULL,'pending',0);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_verifications`
--

DROP TABLE IF EXISTS `email_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email_verifications_token` (`token`),
  KEY `idx_email_verifications_user_id` (`user_id`),
  CONSTRAINT `email_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `email_verifications_chk_1` CHECK ((`expires_at` > `created_at`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_verifications`
--

LOCK TABLES `email_verifications` WRITE;
/*!40000 ALTER TABLE `email_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financial_transactions`
--

DROP TABLE IF EXISTS `financial_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financial_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `property_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('booking_payment','refund','maintenance_cost','cleaning_fee','other') NOT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `description` text,
  `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `property_id` (`property_id`),
  CONSTRAINT `financial_transactions_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `financial_transactions_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_transactions`
--

LOCK TABLES `financial_transactions` WRITE;
/*!40000 ALTER TABLE `financial_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `financial_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_tasks`
--

DROP TABLE IF EXISTS `maintenance_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `room_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `assigned_to` char(36) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `property_id` (`property_id`),
  KEY `room_id` (`room_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `maintenance_tasks_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  CONSTRAINT `maintenance_tasks_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `maintenance_tasks_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_tasks`
--

LOCK TABLES `maintenance_tasks` WRITE;
/*!40000 ALTER TABLE `maintenance_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `sender_id` char(36) NOT NULL,
  `receiver_id` char(36) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `street` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT '0.0',
  `host_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guests` int NOT NULL,
  `bedrooms` int NOT NULL,
  `beds` int NOT NULL,
  `bathrooms` int NOT NULL,
  `property_type` enum('hotel','apartment','villa','resort','guesthouse','hostel','house','condo','townhouse','cabin','cottage','bungalow','mansion','castle','farm','ranch','boat','treehouse','yurt','tent','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hotel',
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `cancellation_policy` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pet_policy` text COLLATE utf8mb4_unicode_ci,
  `event_policy` text COLLATE utf8mb4_unicode_ci,
  `star_rating` decimal(2,1) DEFAULT NULL,
  `languages_spoken` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `min_stay` int DEFAULT '1',
  `max_stay` int DEFAULT '30',
  `house_rules` text COLLATE utf8mb4_unicode_ci,
  `is_featured` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` VALUES (1,'','',45.25690716,25.17071843,'Strada Principala 47','Stoenesti, Stoenesti','Arges','Romania','117675',NULL,0.0,'9964492f-40d0-4011-a65e-e4dbada354a1',0,0,0,0,'hotel','14:00:00','11:00:00','','2024-12-11 20:21:45','2024-12-27 20:14:39','','',NULL,NULL,0,1,30,NULL,0),(8,'Exigent Apartments','Luxurious apartment in the heart of Bucharest with modern amenities and stunning city views',53.38934125,-6.24288662,'Strada Victoriei 25','Bucharest','Sector 1','Romania','010063',NULL,0.0,'9964492f-40d0-4011-a65e-e4dbada354a1',4,2,3,2,'apartment','14:00:00','12:00:00','flexible','2024-12-11 21:49:14','2025-03-26 12:26:06','Pets allowed with deposit','Events allowed with prior approval',5.0,NULL,1,1,30,NULL,1),(12,'Radison Blu Hotel','radison blu',53.38934125,-6.24288662,'Bulevardul Eroilor 23','Brasov','Brasov','Romania','500030',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',10,6,1,1,'hotel','15:00:00','12:00:00','moderate','2024-12-13 21:29:07','2024-12-27 18:35:07','pets','events',NULL,NULL,1,1,30,NULL,0),(16,'test','test',53.38934125,-6.24288662,'37 Shanrath Road','Dublin','Ireland','Ireland','D09NY56',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',2,1,1,1,'hotel','12:00:00','00:00:00','moderate','2024-12-14 18:30:06','2024-12-14 19:12:23','pets','next',NULL,NULL,1,1,30,NULL,0),(21,'Bucharest Inn 123','Luxurious hotel in the heart of Bucharest with modern amenities and stunning city views',45.25440728,25.17105103,'Strada Principala 47','Stoenesti, Stoenesti','Arges','Romania','117675',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',1,1,1,1,'hotel','15:00:00','12:00:00','moderate','2024-12-24 13:59:46','2024-12-24 21:44:08','pets1','events1',0.0,'[]',1,1,30,NULL,0),(26,'qwertyuiop','22222',45.26281560,25.17520690,'Strada Principala 47','Stoenesti','Arges','Romania','117675',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',2,2,2,2,'house','15:00:00','12:00:00','moderate','2024-12-28 21:00:38','2025-03-27 19:45:35','1212112','123123123213',2.0,'[\"English\", \"Romanian\", \"German\"]',1,1,30,NULL,1),(27,'testIonut123','test',45.25000000,25.16667000,'Strada Principala 47','Stoenesti','Arges','Romania','117675',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',1,1,1,1,'hotel','14:00:00','11:00:00','strict','2024-12-28 21:10:58','2024-12-28 21:10:58','case_by_case','with_permission',0.0,'[\"English\", \"Italian\", \"Japanese\"]',1,1,30,NULL,0),(28,'Dragoslavele','this is a test',53.29067460,-6.42496170,'3007 Lake Drive','Dublin','Dublin','Ireland','d123',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',1,1,1,1,'villa','14:00:00','11:00:00','moderate','2025-01-04 17:04:15','2025-01-04 17:04:15','not_allowed','not_allowed',0.0,'[\"English\", \"Italian\", \"Portuguese\"]',1,1,30,NULL,0),(29,'Enothera1','this is about 20 km away from Stoenesti and this is a test111',45.16667000,25.18333000,'147 Strada Principală','Valeni','Dambovita','Romania','',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',2,2,2,2,'resort','17:00:00','14:00:00','strict','2025-01-11 20:27:09','2025-02-01 21:41:37','case_by_case','with_permission',1.0,'[\"English\", \"Spanish\", \"French\", \"German\"]',1,1,29,'hdhdhd',0),(46,'123abc','test selenium',45.25269000,25.17252890,'DN72A','Stoenești','Arges','Romania','117676',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',2,2,2,2,'treehouse','16:00:00','12:00:00','strict','2025-02-05 20:48:13','2025-02-05 20:48:13','case_by_case','with_permission',1.0,'[\"Dutch\"]',1,2,29,'no smoking selenium',0),(65,'123abc','jksbadkcjhbsjacbjnsdx',44.43225000,26.10626000,'Strada Cara Anghel 11','Bucharest','București','Romania','031006',NULL,0.0,'ca8e83d5-3717-42a3-a58c-774f7173872c',11,11,11,11,'villa','16:00:00','13:00:00','moderate','2025-03-04 17:50:55','2025-03-26 12:17:13','case_by_case','with_permission',5.0,'[\"Turkish\", \"Swedish\", \"Indonesian\"]',1,2,30,'no smoking, motherfuckers',1);
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_amenities`
--

DROP TABLE IF EXISTS `property_amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_amenities` (
  `property_id` int NOT NULL,
  `amenity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`property_id`,`amenity`),
  CONSTRAINT `property_amenities_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_amenities`
--

LOCK TABLES `property_amenities` WRITE;
/*!40000 ALTER TABLE `property_amenities` DISABLE KEYS */;
INSERT INTO `property_amenities` VALUES (1,'Elevator','general'),(1,'Refrigerator','kitchen'),(1,'Swimming Pool','outdoor'),(1,'Toiletries','bathroom'),(1,'Wheelchair Access','accessibility'),(1,'Wide Doorways','accessibility'),(1,'WiFi','general'),(8,'Air Conditioning','general'),(8,'Balcony','outdoor'),(8,'City View','outdoor'),(8,'Coffee Maker','kitchen'),(8,'Elevator','accessibility'),(8,'Hair Dryer','bathroom'),(8,'Microwave','kitchen'),(8,'Mini Bar','room'),(8,'Rain Shower','bathroom'),(8,'TV','room'),(8,'Wheelchair Access','accessibility'),(8,'WiFi','general'),(12,'Air Conditioning','general'),(12,'Bathtub','bathroom'),(12,'BBQ Facilities','outdoor'),(12,'BBQ Grill','outdoor'),(12,'Beach Access','outdoor'),(12,'Bike Rental','outdoor'),(12,'Braille Signage','accessibility'),(12,'City View','room'),(12,'Closet','room'),(12,'Coffee Machine','kitchen'),(12,'Coffee Maker','kitchen'),(12,'Desk','room'),(12,'Dining Area','kitchen'),(12,'Dishes','kitchen'),(12,'Dishwasher','kitchen'),(12,'Elevator','accessibility'),(12,'Elevator Access','accessibility'),(12,'Emergency Cord','accessibility'),(12,'Free WiFi','general'),(12,'Full Kitchen','kitchen'),(12,'Garden','outdoor'),(12,'Grab Rails','accessibility'),(12,'Ground Floor','accessibility'),(12,'Hair Dryer','bathroom'),(12,'Heating','general'),(12,'Hot Water','bathroom'),(12,'Iron','room'),(12,'Luggage Storage','general'),(12,'Microwave','kitchen'),(12,'Mini Bar','room'),(12,'Parking','outdoor'),(12,'Private Bathroom','bathroom'),(12,'Reception 24/7','general'),(12,'Refrigerator','kitchen'),(12,'Roll-in Shower','accessibility'),(12,'Safe','room'),(12,'Security','general'),(12,'Shampoo','bathroom'),(12,'Shower','bathroom'),(12,'Swimming Pool','outdoor'),(12,'Terrace','outdoor'),(12,'test','general'),(12,'Toiletries','bathroom'),(12,'Towels','bathroom'),(12,'TV','general'),(12,'Wardrobe','room'),(12,'Washing Machine','bathroom'),(12,'Wheelchair Access','accessibility'),(12,'Wheelchair Accessible','accessibility'),(12,'Wide Doorway','accessibility'),(12,'WiFi','general'),(16,'Air Conditioning','general'),(16,'Coffee Maker','kitchen'),(16,'Ground Floor','accessibility'),(16,'Heating','general'),(16,'Hot Water','bathroom'),(16,'Iron','room'),(16,'Parking','outdoor'),(16,'test','accessibility'),(16,'TV','general'),(16,'WiFi','general');
/*!40000 ALTER TABLE `property_amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_click_counts`
--

DROP TABLE IF EXISTS `property_click_counts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_click_counts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `click_count` int DEFAULT '0',
  `last_clicked` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `featured_clicks` int DEFAULT '0',
  `normal_clicks` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_property_click_counts_property_id` (`property_id`),
  CONSTRAINT `property_click_counts_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_click_counts`
--

LOCK TABLES `property_click_counts` WRITE;
/*!40000 ALTER TABLE `property_click_counts` DISABLE KEYS */;
INSERT INTO `property_click_counts` VALUES (1,1,0,'2025-03-26 18:03:11',0,0),(2,8,0,'2025-03-27 18:19:44',2,0),(3,12,0,'2025-03-26 18:03:11',0,0),(4,16,0,'2025-03-26 18:03:11',0,0),(5,21,0,'2025-08-08 19:56:06',0,10),(6,26,0,'2025-03-29 23:38:38',67,141),(7,27,0,'2025-03-27 21:44:19',0,4),(8,28,0,'2025-03-26 18:03:11',0,0),(9,29,0,'2025-08-08 09:16:14',0,14),(10,46,0,'2025-03-26 18:03:11',0,0),(11,65,0,'2025-03-26 18:03:11',0,0);
/*!40000 ALTER TABLE `property_click_counts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_images`
--

DROP TABLE IF EXISTS `property_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `url` varchar(2048) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `property_id` (`property_id`),
  CONSTRAINT `property_images_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_images`
--

LOCK TABLES `property_images` WRITE;
/*!40000 ALTER TABLE `property_images` DISABLE KEYS */;
INSERT INTO `property_images` VALUES (1,1,'https://images.unsplash.com/photo-1566073771259-6a8506099945','Hotel Exterior'),(2,1,'https://images.unsplash.com/photo-1582719508461-905c673771fd','Bedroom'),(3,1,'https://images.unsplash.com/photo-1584132967334-10e028bd69f7','Bathroom'),(27,8,'https://images.unsplash.com/photo-1566073771259-6a8506099945','Hotel Exterior'),(28,8,'https://images.unsplash.com/photo-1582719508461-905c673771fd','Bedroom'),(29,8,'https://images.unsplash.com/photo-1584132967334-10e028bd69f7','Bathroom'),(33,12,'blob:http://localhost:3000/78de54e6-49aa-4de7-aeba-a5b1f3896859',NULL),(36,26,'https://picsum.photos/200/300','test'),(37,26,'https://picsum.photos/200/300','test1'),(38,26,'https://picsum.photos/200/300','main');
/*!40000 ALTER TABLE `property_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_rules`
--

DROP TABLE IF EXISTS `property_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_rules` (
  `property_id` int NOT NULL,
  `rule` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`property_id`,`rule`),
  CONSTRAINT `property_rules_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_rules`
--

LOCK TABLES `property_rules` WRITE;
/*!40000 ALTER TABLE `property_rules` DISABLE KEYS */;
INSERT INTO `property_rules` VALUES (1,'Check-in after 2 PM'),(1,'No parties'),(1,'No smoking'),(1,'Quiet hours after 10 PM'),(8,'Check-in after 2 PM'),(8,'No parties'),(8,'No smoking'),(8,'Quiet hours after 10 PM'),(12,'no smoking'),(16,'no smoking');
/*!40000 ALTER TABLE `property_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_amenities`
--

DROP TABLE IF EXISTS `room_amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_amenities` (
  `room_id` int NOT NULL,
  `amenity` varchar(100) NOT NULL,
  PRIMARY KEY (`room_id`,`amenity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_amenities`
--

LOCK TABLES `room_amenities` WRITE;
/*!40000 ALTER TABLE `room_amenities` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_availability`
--

DROP TABLE IF EXISTS `room_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_availability` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `date` date NOT NULL,
  `status` enum('available','occupied','maintenance','blocked') NOT NULL DEFAULT 'available',
  `booking_id` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reason` enum('available','booked','maintenance','blocked') NOT NULL DEFAULT 'available',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_room_date` (`room_id`,`date`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `room_availability_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `room_availability_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_availability`
--

LOCK TABLES `room_availability` WRITE;
/*!40000 ALTER TABLE `room_availability` DISABLE KEYS */;
INSERT INTO `room_availability` VALUES (1,67,'2025-01-27','available',NULL,NULL,'2025-01-23 21:39:20','2025-01-23 21:39:59',1.00,'available'),(2,67,'2025-01-30','available',NULL,NULL,'2025-01-23 21:40:54','2025-01-23 21:44:32',101.00,'available'),(3,67,'2025-02-01','available',NULL,NULL,'2025-01-23 22:05:16','2025-01-23 22:05:16',4.00,'available'),(4,67,'2025-02-03','available',NULL,NULL,'2025-01-23 22:05:34','2025-01-23 22:05:44',95.50,'available'),(5,34,'2025-01-26','blocked',NULL,NULL,'2025-01-24 19:22:50','2025-01-24 19:22:50',122.00,'available'),(6,33,'2025-02-01','maintenance',NULL,NULL,'2025-01-24 19:31:47','2025-01-24 19:31:47',12.00,'available'),(7,33,'2025-02-02','maintenance',NULL,NULL,'2025-01-24 19:31:47','2025-01-24 19:31:47',12.00,'available'),(8,33,'2025-02-03','maintenance',NULL,NULL,'2025-01-24 19:31:47','2025-01-24 19:31:47',12.00,'available'),(9,33,'2025-02-04','maintenance',NULL,NULL,'2025-01-24 19:31:47','2025-01-24 19:31:47',12.00,'available'),(10,33,'2025-02-05','maintenance',NULL,NULL,'2025-01-24 19:31:47','2025-01-24 19:31:47',12.00,'available'),(11,33,'2025-02-06','maintenance',NULL,NULL,'2025-01-24 19:31:47','2025-01-24 19:31:47',12.00,'available'),(12,33,'2025-02-07','maintenance',NULL,NULL,'2025-01-24 19:31:47','2025-01-24 19:31:47',12.00,'available'),(13,33,'2025-02-22','available',NULL,NULL,'2025-01-24 20:29:32','2025-01-24 20:29:32',14.00,'available'),(14,33,'2025-02-23','available',NULL,NULL,'2025-01-24 20:29:32','2025-01-24 20:29:32',14.00,'available'),(15,33,'2025-02-24','maintenance',NULL,NULL,'2025-01-24 20:29:32','2025-01-24 21:19:10',12.00,'available'),(16,33,'2025-02-25','maintenance',NULL,NULL,'2025-01-24 20:29:32','2025-01-24 21:19:10',12.00,'available'),(17,33,'2025-02-26','available',NULL,NULL,'2025-01-24 20:29:32','2025-01-24 20:29:32',14.00,'available'),(18,33,'2025-02-27','available',NULL,NULL,'2025-01-24 20:29:32','2025-01-24 20:29:32',14.00,'available'),(19,33,'2025-02-28','available',NULL,NULL,'2025-01-24 20:29:32','2025-01-24 20:29:32',14.00,'available'),(20,33,'2025-01-20','maintenance',NULL,NULL,'2025-01-24 20:48:36','2025-01-24 20:48:36',12.00,'available'),(21,33,'2025-03-01','maintenance',NULL,NULL,'2025-01-24 21:09:45','2025-01-24 21:09:45',12.00,'available'),(22,33,'2025-03-02','maintenance',NULL,NULL,'2025-01-24 21:09:45','2025-01-24 21:09:45',12.00,'available'),(23,33,'2025-03-03','maintenance',NULL,NULL,'2025-01-24 21:09:45','2025-01-24 21:09:45',12.00,'available'),(24,33,'2025-03-04','maintenance',NULL,NULL,'2025-01-24 21:09:45','2025-01-24 21:09:45',12.00,'available'),(25,33,'2025-03-05','maintenance',NULL,NULL,'2025-01-24 21:09:45','2025-01-24 21:09:45',12.00,'available'),(26,33,'2025-03-06','maintenance',NULL,NULL,'2025-01-24 21:09:45','2025-01-24 21:09:45',12.00,'available'),(27,33,'2025-03-07','maintenance',NULL,NULL,'2025-01-24 21:09:45','2025-01-24 21:09:45',12.00,'available'),(28,73,'2025-02-01','maintenance',NULL,NULL,'2025-02-02 19:14:19','2025-02-02 19:14:35',145.00,'available'),(29,73,'2025-02-02','maintenance',NULL,NULL,'2025-02-02 19:14:19','2025-02-02 19:14:35',145.00,'available'),(30,73,'2025-02-03','maintenance',NULL,NULL,'2025-02-02 19:14:19','2025-02-02 19:14:35',145.00,'available'),(31,73,'2025-02-04','maintenance',NULL,NULL,'2025-02-02 19:14:19','2025-02-02 19:14:35',145.00,'available'),(32,73,'2025-02-05','maintenance',NULL,NULL,'2025-02-02 19:14:19','2025-02-02 19:14:35',145.00,'available'),(33,73,'2025-02-06','maintenance',NULL,NULL,'2025-02-02 19:14:19','2025-02-02 19:14:35',145.00,'available'),(34,73,'2025-02-07','maintenance',NULL,NULL,'2025-02-02 19:14:19','2025-02-02 19:14:35',145.00,'available'),(35,60,'2025-02-22','available',NULL,NULL,'2025-02-03 20:51:00','2025-02-16 11:44:07',154.21,'available'),(36,60,'2025-02-23','available',NULL,NULL,'2025-02-03 20:51:00','2025-02-16 11:44:07',154.21,'available'),(37,60,'2025-02-24','available',NULL,NULL,'2025-02-03 20:51:00','2025-02-16 11:44:07',20.10,'available'),(38,60,'2025-02-25','available',NULL,NULL,'2025-02-03 20:51:00','2025-02-16 11:44:07',128.00,'available'),(39,60,'2025-02-26','available',NULL,NULL,'2025-02-03 20:51:00','2025-02-16 11:44:31',20.32,'available'),(40,60,'2025-02-27','available',NULL,NULL,'2025-02-03 20:51:00','2025-02-03 20:51:30',154.00,'available'),(41,60,'2025-02-28','available',NULL,NULL,'2025-02-03 20:51:00','2025-02-03 20:51:30',154.00,'available'),(42,60,'2025-02-21','available',NULL,NULL,'2025-02-03 21:03:29','2025-02-16 11:44:07',20.10,'available'),(43,61,'2025-02-01','available',NULL,NULL,'2025-02-04 18:22:08','2025-02-04 18:22:08',124.25,'available'),(44,61,'2025-02-02','available',NULL,NULL,'2025-02-04 18:22:08','2025-02-04 18:22:08',124.25,'available'),(45,61,'2025-02-03','available',NULL,NULL,'2025-02-04 18:22:08','2025-02-04 18:22:08',124.25,'available'),(46,61,'2025-02-04','available',NULL,NULL,'2025-02-04 18:22:08','2025-02-04 18:22:08',124.25,'available'),(47,61,'2025-02-05','available',NULL,NULL,'2025-02-04 18:22:08','2025-02-04 18:22:08',124.25,'available'),(48,61,'2025-02-06','available',NULL,NULL,'2025-02-04 18:22:08','2025-02-04 18:22:08',124.25,'available'),(49,61,'2025-02-07','available',NULL,NULL,'2025-02-04 18:22:08','2025-02-04 18:22:08',124.25,'available'),(50,61,'2025-02-08','maintenance',NULL,NULL,'2025-02-04 18:22:53','2025-02-04 18:22:53',12.00,'maintenance'),(51,61,'2025-02-09','maintenance',NULL,NULL,'2025-02-04 18:22:53','2025-02-04 18:22:53',12.00,'maintenance'),(52,61,'2025-02-10','maintenance',NULL,NULL,'2025-02-04 18:22:53','2025-02-04 18:22:53',12.00,'maintenance'),(53,61,'2025-02-11','maintenance',NULL,NULL,'2025-02-04 18:22:53','2025-02-04 18:22:53',12.00,'maintenance'),(54,61,'2025-02-12','maintenance',NULL,NULL,'2025-02-04 18:22:53','2025-02-04 18:22:53',12.00,'maintenance'),(55,61,'2025-02-13','maintenance',NULL,NULL,'2025-02-04 18:22:53','2025-02-04 18:22:53',12.00,'maintenance'),(56,61,'2025-02-14','maintenance',NULL,NULL,'2025-02-04 18:22:53','2025-02-04 18:22:53',12.00,'maintenance'),(57,61,'2025-02-15','available',NULL,NULL,'2025-02-04 18:24:14','2025-02-04 18:24:14',333.33,'available'),(58,61,'2025-02-16','available',NULL,NULL,'2025-02-04 18:24:14','2025-02-04 18:24:14',333.33,'available'),(59,61,'2025-02-17','available',NULL,NULL,'2025-02-04 18:24:14','2025-02-04 18:24:14',333.33,'available'),(60,61,'2025-02-18','available',NULL,NULL,'2025-02-04 18:24:14','2025-02-04 18:24:14',333.33,'available'),(61,61,'2025-02-19','available',NULL,NULL,'2025-02-04 18:24:14','2025-02-04 18:24:14',333.33,'available'),(62,61,'2025-02-20','available',NULL,NULL,'2025-02-04 18:24:14','2025-02-04 18:24:14',333.33,'available'),(63,61,'2025-02-21','available',NULL,NULL,'2025-02-04 18:24:14','2025-02-04 18:24:14',333.33,'available'),(64,61,'2025-02-22','blocked',NULL,NULL,'2025-02-04 18:24:21','2025-02-04 18:24:21',12.00,'blocked'),(65,61,'2025-02-23','blocked',NULL,NULL,'2025-02-04 18:24:21','2025-02-04 18:24:21',12.00,'blocked'),(66,61,'2025-02-24','available',NULL,NULL,'2025-02-04 18:24:31','2025-02-04 18:24:31',147.36,'available'),(67,60,'2025-03-01','occupied',NULL,NULL,'2025-02-05 20:21:23','2025-02-16 11:44:31',154.25,'available'),(68,60,'2025-03-02','occupied',NULL,NULL,'2025-02-05 20:21:23','2025-02-16 11:44:31',154.25,'available'),(69,60,'2025-03-03','occupied',NULL,NULL,'2025-02-05 20:21:23','2025-02-16 11:44:31',154.25,'available'),(70,60,'2025-03-04','occupied',NULL,NULL,'2025-02-05 20:21:23','2025-02-16 11:44:31',154.25,'available'),(71,60,'2025-03-05','occupied',NULL,NULL,'2025-02-05 20:21:23','2025-02-16 11:44:31',154.25,'available'),(72,60,'2025-03-06','available',NULL,NULL,'2025-02-05 20:21:23','2025-02-05 20:21:23',154.25,'available'),(73,60,'2025-03-07','available',NULL,NULL,'2025-02-05 20:21:23','2025-02-05 20:21:23',154.25,'available'),(74,60,'2025-03-22','available',NULL,NULL,'2025-02-05 20:21:51','2025-02-05 20:21:51',110.10,'available'),(75,60,'2025-03-23','available',NULL,NULL,'2025-02-05 20:21:51','2025-02-05 20:21:51',110.10,'available'),(76,60,'2025-03-24','available',NULL,NULL,'2025-02-05 20:21:51','2025-02-05 20:21:51',110.10,'available'),(77,60,'2025-03-25','available',NULL,NULL,'2025-02-05 20:21:51','2025-02-05 20:21:51',110.10,'available'),(78,60,'2025-03-26','available',NULL,NULL,'2025-02-05 20:21:51','2025-02-05 20:21:51',110.10,'available'),(79,60,'2025-03-27','available',NULL,NULL,'2025-02-05 20:21:51','2025-02-05 20:21:51',110.10,'available'),(80,60,'2025-03-28','available',NULL,NULL,'2025-02-05 20:21:51','2025-02-05 20:21:51',110.10,'available'),(89,61,'2025-03-09','available',NULL,NULL,'2025-03-01 14:11:32','2025-03-01 14:11:32',195.00,'available'),(90,61,'2025-03-10','available',NULL,NULL,'2025-03-01 14:11:32','2025-03-01 14:11:32',195.00,'available'),(91,61,'2025-03-11','available',NULL,NULL,'2025-03-01 14:11:32','2025-03-01 14:11:32',195.00,'available'),(92,61,'2025-03-12','available',NULL,NULL,'2025-03-01 14:11:32','2025-03-01 14:11:32',195.00,'available'),(93,61,'2025-03-13','available',NULL,NULL,'2025-03-01 14:11:32','2025-03-01 14:11:32',195.00,'available'),(94,61,'2025-03-14','available',NULL,NULL,'2025-03-01 14:11:32','2025-03-01 14:11:32',195.00,'available'),(95,67,'2025-03-24','available',NULL,NULL,'2025-03-04 17:09:07','2025-03-04 17:09:07',176.00,'available'),(96,67,'2025-03-25','available',NULL,NULL,'2025-03-04 17:09:07','2025-03-04 17:09:07',176.00,'available'),(97,67,'2025-03-26','available',NULL,NULL,'2025-03-04 17:09:07','2025-03-04 17:09:07',176.00,'available'),(98,67,'2025-03-27','available',NULL,NULL,'2025-03-04 17:09:07','2025-03-04 17:09:07',176.00,'available'),(99,67,'2025-03-28','available',NULL,NULL,'2025-03-04 17:09:07','2025-03-04 17:09:07',176.00,'available'),(100,125,'2025-03-16','available',NULL,NULL,'2025-03-04 17:55:39','2025-03-04 17:55:39',123.00,'available'),(101,125,'2025-03-17','available',NULL,NULL,'2025-03-04 17:55:39','2025-03-04 17:55:39',123.00,'available'),(102,125,'2025-03-18','occupied',NULL,NULL,'2025-03-04 17:55:39','2025-03-09 19:36:42',123.00,'available'),(103,125,'2025-03-19','occupied',NULL,NULL,'2025-03-04 17:55:39','2025-03-09 19:36:42',123.00,'available'),(104,125,'2025-03-20','occupied',NULL,NULL,'2025-03-04 17:55:39','2025-03-09 19:36:42',123.00,'available'),(105,125,'2025-03-21','occupied',NULL,NULL,'2025-03-04 17:55:39','2025-03-09 19:36:42',123.00,'available'),(106,125,'2025-03-23','available',NULL,NULL,'2025-03-04 17:55:49','2025-03-11 19:58:15',554.00,'available'),(107,125,'2025-03-24','available',NULL,NULL,'2025-03-04 17:55:49','2025-03-11 19:58:15',554.00,'available'),(108,125,'2025-03-25','available',NULL,NULL,'2025-03-04 17:55:49','2025-03-11 19:58:15',554.00,'available'),(109,125,'2025-03-26','available',NULL,NULL,'2025-03-04 17:55:49','2025-03-11 19:58:15',554.00,'available'),(110,125,'2025-03-27','available',NULL,NULL,'2025-03-04 17:55:49','2025-03-11 19:58:15',554.00,'available'),(111,125,'2025-03-28','available',NULL,NULL,'2025-03-04 17:55:49','2025-03-11 19:58:15',554.00,'available'),(112,125,'2025-04-07','blocked',NULL,NULL,'2025-03-11 19:58:40','2025-03-11 19:58:40',12.00,'blocked'),(113,125,'2025-04-08','blocked',NULL,NULL,'2025-03-11 19:58:40','2025-03-11 19:58:40',12.00,'blocked');
/*!40000 ALTER TABLE `room_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `room_type` varchar(50) NOT NULL,
  `bed_type` varchar(50) DEFAULT NULL,
  `beds` json DEFAULT NULL,
  `max_occupancy` int NOT NULL,
  `base_price` decimal(10,2) DEFAULT NULL,
  `cleaning_fee` decimal(10,2) DEFAULT NULL,
  `service_fee` decimal(10,2) DEFAULT NULL,
  `tax_rate` decimal(5,2) DEFAULT NULL,
  `security_deposit` decimal(10,2) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bathroom_type` enum('private','shared','en-suite','jack-and-jill','split') NOT NULL DEFAULT 'private',
  `view_type` varchar(50) DEFAULT NULL,
  `has_private_bathroom` tinyint(1) DEFAULT '1',
  `smoking` tinyint(1) DEFAULT '0',
  `accessibility_features` json DEFAULT NULL,
  `floor_level` int DEFAULT NULL,
  `has_balcony` tinyint(1) DEFAULT '0',
  `has_kitchen` tinyint(1) DEFAULT '0',
  `has_minibar` tinyint(1) DEFAULT '0',
  `climate` json DEFAULT NULL,
  `price_per_night` decimal(10,2) DEFAULT NULL,
  `cancellation_policy` varchar(50) DEFAULT NULL,
  `includes_breakfast` tinyint(1) DEFAULT '0',
  `extra_bed_available` tinyint(1) DEFAULT '0',
  `pets_allowed` tinyint(1) DEFAULT '0',
  `images` json DEFAULT NULL,
  `cleaning_frequency` varchar(50) DEFAULT NULL,
  `has_toiletries` tinyint(1) DEFAULT '0',
  `has_towels_linens` tinyint(1) DEFAULT '0',
  `has_room_service` tinyint(1) DEFAULT '0',
  `flooring_type` varchar(50) DEFAULT NULL,
  `energy_saving_features` json DEFAULT NULL,
  `status` varchar(20) DEFAULT 'available',
  `room_size` int DEFAULT NULL,
  `amenities` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rooms_property_id` (`property_id`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (24,8,'Deluxe Double Room123','Deluxe Room','Single Bed','[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 2}]',5,151.00,46.00,21.00,23.00,105.00,'Spacious room with city view123','2024-12-12 15:42:16','2024-12-20 19:44:09','shared','Ocean View',0,1,'[\"accessibility\"]',1,1,1,1,NULL,47.00,'moderate',1,0,1,'[]','on_request',1,1,1,'Hardwood','[]','occupied',1,'[\"Balcony\", \"Kitchen\", \"Mini Bar\", \"Toiletries\", \"Towels & Linens\", \"Room Service\"]'),(25,8,'Single Room','single room','Single Bed','[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 3}]',7,100.00,20.00,15.00,19.00,50.00,'Cozy room perfect for solo travelers','2024-12-12 15:42:16','2024-12-20 19:13:15','private','City View',1,1,'[]',0,0,0,0,NULL,12.00,'flexible',0,0,1,'[]','daily',1,1,1,'Carpet','[]','available',0,'[\"Private Bathroom\"]'),(33,12,'Double Deluxe Standard1','Suite','Single Bed','\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Double Bed\\\",\\\"count\\\":1}]\"',3,NULL,NULL,NULL,NULL,NULL,'this is a test deluxe double room111','2024-12-13 21:29:07','2025-01-05 20:48:29','private','No View',0,0,'\"[]\"',1,0,0,0,'null',12.00,NULL,0,0,0,'\"[]\"',NULL,0,0,0,'Carpet','\"[]\"','available',12,'\"\\\"[]\\\"\"'),(34,12,'Deluxe triple room','Deluxe Room','Single Bed','\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Double Bed\\\",\\\"count\\\":1}]\"',3,NULL,NULL,NULL,NULL,NULL,'test triple room1111111122222','2024-12-13 21:29:07','2025-01-05 21:57:16','private','No View',0,0,'\"[]\"',11,0,0,0,'null',122.00,'flexible',0,0,0,'\"[]\"','daily',0,0,0,'Carpet','\"[]\"','available',11,'\"\\\"[\\\\\\\"Air Conditioning\\\\\\\",\\\\\\\"Balcony\\\\\\\",\\\\\\\"Safe\\\\\\\",\\\\\\\"Kitchen\\\\\\\"]\\\"\"'),(38,16,'Double room','standard room','Single Bed',NULL,2,10.00,10.00,10.00,19.00,NULL,'test','2024-12-14 18:30:06','2024-12-14 18:30:06','private',NULL,1,0,NULL,NULL,0,0,0,NULL,NULL,NULL,0,0,0,NULL,NULL,0,0,0,NULL,NULL,'available',NULL,NULL),(47,1,'ion 123','Suite',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}]',1,12.00,NULL,NULL,NULL,NULL,'test','2024-12-14 21:23:50','2024-12-22 20:22:08','private','Garden View',1,0,'[]',1,0,1,1,'{\"hasCooling\": true, \"hasHeating\": true}',125.00,'moderate',0,1,1,'[]','before_check_in',1,1,0,'Carpet','[]','available',1223,'[\"Private Bathroom\", \"Kitchen\", \"Mini Bar\", \"Toiletries\", \"Towels & Linens\"]'),(57,8,'johnny test 567','Suite',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}]',1,NULL,NULL,NULL,NULL,NULL,'this is the most amazing room','2024-12-20 21:47:41','2024-12-20 19:54:14','private','Pool View',0,0,'[\"additional\", \"features\"]',323,1,0,0,'null',202.00,'strict',0,0,0,'[]','monthly',1,0,1,'Marble','[\"energy\"]','maintenance',324,'[\"Balcony\", \"Toiletries\", \"Room Service\"]'),(60,21,'Deluxe Room12','Standard Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 1}, {\"type\": \"Queen Bed\", \"count\": 1}, {\"type\": \"Bunk Bed\", \"count\": 3}]',11,100.10,0.00,0.00,0.00,0.00,NULL,'2024-12-24 13:59:46','2025-03-02 16:09:11','shared','Ocean View',0,1,'[\"r\"]',5,1,0,0,'{\"type\": \"ac\", \"available\": true}',20.10,'moderate',1,0,0,'[]','biweekly',1,1,0,'Hardwood','[\"a\"]','available',311,'[\"Towels & Linens\", \"Balcony\", \"Private Bathroom\", \"Kitchen\"]'),(61,21,'test','Suite',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}]',5,46.00,NULL,NULL,NULL,NULL,'','2024-12-24 14:32:37','2024-12-24 14:44:24','shared','Ocean View',0,0,'\"[]\"',9,1,0,0,NULL,12.00,'flexible',0,0,0,'\"[]\"','on_request',1,0,1,'Carpet','\"[]\"','available',928,'\"[\\\"Balcony\\\",\\\"Toiletries\\\",\\\"Room Service\\\"]\"'),(67,26,'Amazing room','Standard Room',NULL,'\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Queen Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"King Bed\\\",\\\"count\\\":1}]\"',2,0.00,0.00,0.00,0.00,0.00,'test','2024-12-28 21:00:38','2025-03-04 17:09:58','private','City View',0,0,'\"[]\"',1,0,0,0,'{\"type\": \"ac\", \"available\": true}',12.00,'moderate',0,0,0,'[]','daily',1,1,0,'carpet','\"[]\"','available',111,'\"[\\\"Private Bathroom\\\",\\\"Safe\\\"]\"'),(68,27,'mansarda','Deluxe Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 1}]',3,2.00,2.00,2.00,2.00,2.00,'11111','2024-12-28 21:10:58','2024-12-28 21:10:58','private','City View',0,0,'[]',0,0,0,1,NULL,2.00,'flexible',1,0,0,'[]','daily',0,1,0,'Carpet','[]','available',111,'[]'),(69,28,'fidelity','Deluxe Room',NULL,'[{\"type\": \"Double Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}]',4,1.00,1.00,1.00,1.00,1.00,'121212','2025-01-04 17:04:15','2025-01-04 17:04:15','shared','City View',0,0,'[]',12,0,0,0,NULL,1.00,'moderate',0,0,0,'[]','weekly',1,1,0,'Tile','[]','available',122,'[]'),(73,29,'Amazing room1','Deluxe Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}, {\"type\": \"Bunk Bed\", \"count\": 1}]',5,0.00,NULL,NULL,NULL,NULL,'Amazing room with','2025-01-11 20:27:09','2025-02-02 20:20:29','shared','City View',0,0,'[]',1,0,0,0,'{\"type\": \"ac\", \"available\": true}',14.00,'flexible',0,0,0,'[]','daily',1,1,0,'Tile','[]','available',123,'[\"Wi-Fi\", \"TV\", \"Mini Bar\", \"Safe\"]'),(78,21,'selenium test','Deluxe Room',NULL,'[{\"type\": \"Queen Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}, {\"type\": \"Bunk Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Single Bed\", \"count\": 1}]',12,0.00,0.00,0.00,0.00,0.00,'this is a selenium test','2025-02-02 19:30:45','2025-03-02 16:40:12','en-suite','Pool View',0,0,'[]',114,0,0,0,'{\"type\": \"ac\", \"available\": true}',112.00,'moderate',0,0,0,'[]','daily',1,1,0,'Marble','[]','available',113,'[\"Balcony\", \"Wi-Fi\", \"TV\", \"Air Conditioning\"]'),(84,46,'1212','Deluxe Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}]',3,0.00,0.00,0.00,0.00,0.00,'14','2025-02-05 20:48:52','2025-02-05 20:52:02','en-suite','Mountain View',1,0,'[]',14,0,0,0,'{\"type\": \"ac\", \"available\": true}',1212.00,'strict',0,0,0,'[]','daily',1,1,0,'Tile','[]','available',1212,'[\"TV\", \"Wi-Fi\", \"Kitchen\"]'),(123,21,'automation room123','Suite',NULL,'\"[{\\\"type\\\":\\\"Double Bed\\\",\\\"count\\\":3},{\\\"type\\\":\\\"King Bed\\\",\\\"count\\\":3},{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":2}]\"',14,0.00,0.00,0.00,0.00,0.00,'auto description111','2025-03-03 20:15:59','2025-03-03 20:16:19','private','City View',1,0,'\"[]\"',14,0,0,0,'{\"type\": \"ac\", \"available\": true}',155.00,'moderate',0,0,0,'[]','daily',1,1,0,'Carpet','\"[]\"','available',155,'\"[\\\"Wi-Fi\\\",\\\"Safe\\\",\\\"Private Bathroom\\\",\\\"Mini Bar\\\",\\\"Air Conditioning\\\",\\\"Sea View\\\",\\\"Balcony\\\",\\\"TV\\\",\\\"Kitchen\\\"]\"'),(125,65,'123abc','Standard Room',NULL,'\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":2},{\\\"type\\\":\\\"Double Bed\\\",\\\"count\\\":2}]\"',6,0.00,0.00,0.00,0.00,0.00,'121212','2025-03-04 17:54:47','2025-03-11 19:58:53','private','No View',1,0,'\"[]\"',12,0,0,0,'{\"type\": \"ac\", \"available\": true}',12.00,'moderate',0,0,0,'[]','daily',1,1,0,'Carpet','\"[]\"','available',12,'\"[\\\"Safe\\\",\\\"TV\\\"]\"'),(126,26,'amazing suite','Suite',NULL,'\"[{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Single Bed\\\",\\\"count\\\":1},{\\\"type\\\":\\\"Queen Bed\\\",\\\"count\\\":1}]\"',4,0.00,0.00,0.00,0.00,0.00,'11111','2025-03-27 18:29:40','2025-03-27 18:29:40','private','Ocean View',1,0,'\"[]\"',11,0,0,0,'\"{\\\"type\\\":\\\"ac\\\",\\\"available\\\":true}\"',11.00,'flexible',0,0,0,'\"[]\"','daily',1,1,0,'Marble','\"[]\"','available',111,'\"[\\\"Wi-Fi\\\",\\\"Kitchen\\\",\\\"Private Bathroom\\\"]\"');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seasonal_pricing`
--

DROP TABLE IF EXISTS `seasonal_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seasonal_pricing` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `price_multiplier` decimal(3,2) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `seasonal_pricing_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seasonal_pricing`
--

LOCK TABLES `seasonal_pricing` WRITE;
/*!40000 ALTER TABLE `seasonal_pricing` DISABLE KEYS */;
/*!40000 ALTER TABLE `seasonal_pricing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `device_info` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `is_valid` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_sessions_token` (`token`),
  KEY `idx_sessions_user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sessions_chk_1` CHECK ((`expires_at` > `created_at`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `user_id` char(36) NOT NULL,
  `avatar_url` text,
  `preferred_language` varchar(10) DEFAULT 'en',
  `preferred_currency` varchar(3) DEFAULT 'USD',
  `notification_preferences` json DEFAULT NULL,
  `address_info` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `language` varchar(5) DEFAULT 'en',
  `currency` varchar(3) DEFAULT 'USD',
  `notifications` json DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES ('3471b43b-d6c1-4341-9a07-387d0643e16c',NULL,'en','USD',NULL,NULL,'2025-02-06 20:58:35','2025-02-06 20:58:35','en','USD','{\"push\": false, \"email\": true}'),('4aadba24-54bc-427e-adf0-056db08c2a1b',NULL,'en','USD',NULL,NULL,'2024-12-12 20:11:22','2024-12-12 20:11:22','en','USD','{\"push\": false, \"email\": true}'),('a527cb72-180c-483b-89b4-7b5f5c14076d',NULL,'en','USD',NULL,NULL,'2024-12-15 19:28:44','2024-12-15 19:28:44','en','USD','{\"push\": false, \"email\": true}'),('b530663c-b46c-4ed5-ae2a-1a3f3de55eb6',NULL,'en','USD',NULL,NULL,'2024-12-12 20:11:07','2024-12-12 20:11:07','en','USD','{\"push\": false, \"email\": true}'),('c9967d0a-3773-46a9-84fc-94362014a0ff',NULL,'en','USD',NULL,NULL,'2024-12-12 20:10:32','2024-12-12 20:10:32','en','USD','{\"push\": false, \"email\": true}'),('ca8e83d5-3717-42a3-a58c-774f7173872c',NULL,'en','USD',NULL,NULL,'2025-02-07 21:44:34','2025-02-07 21:44:34','en','USD','{\"push\": false, \"email\": true}'),('f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',NULL,'en','USD','{\"push\": false, \"email\": true}','{}','2024-12-10 20:01:45','2024-12-12 20:10:19','en','USD','{\"push\": false, \"email\": true}');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_security`
--

DROP TABLE IF EXISTS `user_security`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_security` (
  `user_id` char(36) NOT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `two_factor_method` enum('email','authenticator','sms') DEFAULT NULL,
  `recovery_email` varchar(255) DEFAULT NULL,
  `last_password_change` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `failed_login_attempts` int DEFAULT '0',
  `last_failed_attempt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_security_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_security`
--

LOCK TABLES `user_security` WRITE;
/*!40000 ALTER TABLE `user_security` DISABLE KEYS */;
INSERT INTO `user_security` VALUES ('3471b43b-d6c1-4341-9a07-387d0643e16c',0,NULL,NULL,'2025-02-06 20:58:35',0,NULL),('482ce028-281c-432b-9343-e20db1f14efc',0,NULL,NULL,'2024-12-12 20:08:47',0,NULL),('4aadba24-54bc-427e-adf0-056db08c2a1b',0,NULL,NULL,'2024-12-12 20:11:22',0,NULL),('a116a205-65a6-4796-91e4-697a30965087',0,NULL,NULL,'2024-12-10 19:57:34',0,NULL),('a527cb72-180c-483b-89b4-7b5f5c14076d',0,NULL,NULL,'2024-12-15 19:28:44',0,NULL),('b530663c-b46c-4ed5-ae2a-1a3f3de55eb6',0,NULL,NULL,'2024-12-12 20:11:07',0,NULL),('c5320fdc-5aa9-490f-b37b-1f154c2c4b0d',0,NULL,NULL,'2024-12-12 20:05:38',0,NULL),('c9967d0a-3773-46a9-84fc-94362014a0ff',0,NULL,NULL,'2024-12-12 20:10:32',0,NULL),('ca8e83d5-3717-42a3-a58c-774f7173872c',0,NULL,NULL,'2025-02-07 21:44:34',0,NULL),('f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',0,NULL,NULL,'2024-12-10 19:57:54',0,NULL);
/*!40000 ALTER TABLE `user_security` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `email_verified` tinyint(1) DEFAULT '0',
  `role` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('3471b43b-d6c1-4341-9a07-387d0643e16c','guest11@123.com','$2a$10$G9C51eEv8xWKU0unwu3Y.uce/D0NCkELR31Gay4mhGtYZT0yrb/my','Ionut1','Apostu1','283746283764238747','2025-02-06 20:58:35','2025-02-07 01:23:25',NULL,'active',0,'user'),('482ce028-281c-432b-9343-e20db1f14efc','ionut1@user.com','$2a$10$X7yNvjoEEqt7pdvgcAUE6OoxsHcOlIRSWPN/0wqKNtNq5M4E.68Ma','ion','onu','1234567890','2024-12-12 20:08:47','2024-12-12 20:08:47',NULL,'active',0,'user'),('4aadba24-54bc-427e-adf0-056db08c2a1b','ionut4@user.com','$2a$10$W.NlQYex9QtFHCSOmVaUkeDciT202V44cn6FfXGFT5xhdcYP8Bb.u','ion','onu','1234567890','2024-12-12 20:11:22','2024-12-12 20:11:22',NULL,'active',0,'user'),('50f5dbf4-e4cc-11ef-a46a-2c6163ccd4c3','guest@123.com','$2b$10$`0dCRUJB.FgKnEWv5VLQyOy7J6r7y1y1XQ9X9X9X9X9X9X9X9X9X9','Guest','User',NULL,'2025-02-06 20:52:45','2025-02-06 20:52:45',NULL,'active',0,'guest'),('a116a205-65a6-4796-91e4-697a30965087','admin@example.com','$2a$10$w/1rCcsCwWC0obEYj/zvzOlgmBsq82Ri1DsMo53qu3a.YptaV3OM6','Ionut','Apostu','9858153486','2024-12-10 19:57:34','2025-08-08 19:46:08',NULL,'active',0,'admin'),('a527cb72-180c-483b-89b4-7b5f5c14076d','123@123.com','$2a$10$IvZpdp72CKHQeT5BbfpFMuIJjul.qRj5mFyntzMBm2TJZkXChi74C','ionut','apostu','1818181818','2024-12-15 19:28:44','2024-12-15 19:28:44',NULL,'active',0,'user'),('b530663c-b46c-4ed5-ae2a-1a3f3de55eb6','ionut3@user.com','$2a$10$qsyf6ibqPpqkcRJHhW8sfecbuvFZJK2L5cx14zNLYPZKJloOKtlaW','ion','onu','1234567890','2024-12-12 20:11:07','2024-12-12 20:11:07',NULL,'active',0,'user'),('ba0b32ca-b730-11ef-b45f-3a2a2436a493','admin@admin.com','$2b$10$5QZX.H1ymxD7kRiEJWYPaOsWxvXuBUJQIhG9r.L1iC2N.oZDRxEtG','Admin','User',NULL,'2024-12-10 19:55:37','2024-12-10 19:55:37',NULL,'active',0,'admin'),('c5320fdc-5aa9-490f-b37b-1f154c2c4b0d','ionut@user.com','$2a$10$ETbBedtNytunfdnWG/oBvOL7oJ.GTVVRPQv0mUM8asN2rWZQgbiNW','ion','onu','1234567890','2024-12-12 20:05:38','2024-12-12 20:05:38',NULL,'active',0,'user'),('c9967d0a-3773-46a9-84fc-94362014a0ff','ionut2@user.com','$2a$10$SchjcEQ6VBsPeJwky/HnP.FExJ8fMw8y4rIWizp/NEdyFUZAZCLgm','ion','onu','1234567890','2024-12-12 20:10:32','2024-12-12 20:10:32',NULL,'active',0,'user'),('ca8e83d5-3717-42a3-a58c-774f7173872c','owner@mail.com','$2a$10$4bT8ocezacz7QIkcKf92Jeo1SfOCC5R2og.tdG6MznBFdMkMfDbX6','owner','owner',NULL,'2025-02-07 21:44:34','2025-02-07 22:02:49',NULL,'active',0,'host'),('f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','admin@123.com','$2a$10$uVPUcC9.StkQHXcmhEp/v.BdAIUxIU5570PMekl/kizjx3DRCQMQa','Ionut','Apostu','9858153486','2024-12-10 19:57:54','2024-12-10 20:02:08','2024-12-10 20:02:08','active',0,'admin');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-10 15:56:44
