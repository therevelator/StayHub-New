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
  `bathroom_type` enum('private','shared') NOT NULL DEFAULT 'private',
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
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (24,8,'Deluxe Double Room123','Deluxe Room','Single Bed','[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 2}]',5,151.00,46.00,21.00,23.00,105.00,'Spacious room with city view123','2024-12-12 15:42:16','2024-12-20 19:44:09','shared','Ocean View',0,1,'[\"accessibility\"]',1,1,1,1,NULL,47.00,'moderate',1,0,1,'[]','on_request',1,1,1,'Hardwood','[]','occupied',1,'[\"Balcony\", \"Kitchen\", \"Mini Bar\", \"Toiletries\", \"Towels & Linens\", \"Room Service\"]'),(25,8,'Single Room','single room','Single Bed','[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 3}]',7,100.00,20.00,15.00,19.00,50.00,'Cozy room perfect for solo travelers','2024-12-12 15:42:16','2024-12-20 19:13:15','private','City View',1,1,'[]',0,0,0,0,NULL,12.00,'flexible',0,0,1,'[]','daily',1,1,1,'Carpet','[]','available',0,'[\"Private Bathroom\"]'),(33,12,'Double Deluxe Standard','double room','Single Bed',NULL,3,180.00,25.00,12.00,19.00,NULL,'this is a test deluxe double room','2024-12-13 21:29:07','2024-12-13 21:29:07','private',NULL,1,0,NULL,NULL,0,0,0,NULL,NULL,NULL,0,0,0,NULL,NULL,0,0,0,NULL,NULL,'available',NULL,NULL),(34,12,'Deluxe triple room','double room','Single Bed',NULL,3,123.00,12.00,12.00,19.00,NULL,'test triple room','2024-12-13 21:29:07','2024-12-13 21:29:07','private',NULL,1,0,NULL,NULL,0,0,0,NULL,NULL,NULL,0,0,0,NULL,NULL,0,0,0,NULL,NULL,'available',NULL,NULL),(35,12,'Four people room','deluxe room','Single Bed',NULL,4,189.00,39.00,23.00,19.00,NULL,'test four people room','2024-12-13 21:29:07','2024-12-13 21:29:07','private',NULL,1,0,NULL,NULL,0,0,0,NULL,NULL,NULL,0,0,0,NULL,NULL,0,0,0,NULL,NULL,'available',NULL,NULL),(38,16,'Double room','standard room','Single Bed',NULL,2,10.00,10.00,10.00,19.00,NULL,'test','2024-12-14 18:30:06','2024-12-14 18:30:06','private',NULL,1,0,NULL,NULL,0,0,0,NULL,NULL,NULL,0,0,0,NULL,NULL,0,0,0,NULL,NULL,'available',NULL,NULL),(47,1,'ion 123','Suite',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}]',1,12.00,NULL,NULL,NULL,NULL,'test','2024-12-14 21:23:50','2024-12-22 20:22:08','private','Garden View',1,0,'[]',1,0,1,1,'{\"hasCooling\": true, \"hasHeating\": true}',125.00,'moderate',0,1,1,'[]','before_check_in',1,1,0,'Carpet','[]','available',1223,'[\"Private Bathroom\", \"Kitchen\", \"Mini Bar\", \"Toiletries\", \"Towels & Linens\"]'),(57,8,'johnny test 567','Suite',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}]',1,NULL,NULL,NULL,NULL,NULL,'this is the most amazing room','2024-12-20 21:47:41','2024-12-20 19:54:14','private','Pool View',0,0,'[\"additional\", \"features\"]',323,1,0,0,'null',202.00,'strict',0,0,0,'[]','monthly',1,0,1,'Marble','[\"energy\"]','maintenance',324,'[\"Balcony\", \"Toiletries\", \"Room Service\"]'),(60,21,'Deluxe Room12','Standard Room',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 1}, {\"type\": \"Queen Bed\", \"count\": 1}]',5,100.10,1.00,1.00,19.00,1.00,'','2024-12-24 13:59:46','2024-12-24 21:19:14','shared','Ocean View',0,1,'\"[\\\"r\\\"]\"',5,1,0,0,NULL,20.10,'moderate',1,0,0,'\"[]\"','biweekly',1,1,0,'Hardwood','\"[\\\"a\\\"]\"','available',311,'\"[\\\"Towels & Linens\\\"]\"'),(61,21,'test','Suite',NULL,'[{\"type\": \"Single Bed\", \"count\": 1}, {\"type\": \"Double Bed\", \"count\": 1}, {\"type\": \"King Bed\", \"count\": 1}]',5,46.00,NULL,NULL,NULL,NULL,'','2024-12-24 14:32:37','2024-12-24 14:44:24','shared','Ocean View',0,0,'\"[]\"',9,1,0,0,NULL,12.00,'flexible',0,0,0,'\"[]\"','on_request',1,0,1,'Carpet','\"[]\"','available',928,'\"[\\\"Balcony\\\",\\\"Toiletries\\\",\\\"Room Service\\\"]\"');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
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
