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
INSERT INTO `user_profiles` VALUES ('4aadba24-54bc-427e-adf0-056db08c2a1b',NULL,'en','USD',NULL,NULL,'2024-12-12 20:11:22','2024-12-12 20:11:22','en','USD','{\"push\": false, \"email\": true}'),('9964492f-40d0-4011-a65e-e4dbada354a1',NULL,'en','USD','{\"push\": false, \"email\": true}',NULL,'2024-12-07 19:31:36','2024-12-12 20:10:19','en','USD','{\"push\": false, \"email\": true}'),('a527cb72-180c-483b-89b4-7b5f5c14076d',NULL,'en','USD',NULL,NULL,'2024-12-15 19:28:44','2024-12-15 19:28:44','en','USD','{\"push\": false, \"email\": true}'),('b530663c-b46c-4ed5-ae2a-1a3f3de55eb6',NULL,'en','USD',NULL,NULL,'2024-12-12 20:11:07','2024-12-12 20:11:07','en','USD','{\"push\": false, \"email\": true}'),('c9967d0a-3773-46a9-84fc-94362014a0ff',NULL,'en','USD',NULL,NULL,'2024-12-12 20:10:32','2024-12-12 20:10:32','en','USD','{\"push\": false, \"email\": true}'),('f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',NULL,'en','USD','{\"push\": false, \"email\": true}','{}','2024-12-10 20:01:45','2024-12-12 20:10:19','en','USD','{\"push\": false, \"email\": true}');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
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
