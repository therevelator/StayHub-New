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
  `property_type` enum('hotel','apartment','villa','resort','guesthouse','hostel') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hotel',
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` VALUES (1,'','',45.25690716,25.17071843,'Strada Principala 47','Stoenesti, Stoenesti','Arges','Romania','117675',NULL,0.0,'9964492f-40d0-4011-a65e-e4dbada354a1',0,0,0,0,'hotel','14:00:00','11:00:00','','2024-12-11 20:21:45','2024-12-27 20:14:39','','',NULL,NULL,0),(8,'Exigent Apartments','Luxurious apartment in the heart of Bucharest with modern amenities and stunning city views',53.38934125,-6.24288662,'Strada Victoriei 25','Bucharest','Sector 1','Romania','010063',NULL,0.0,'9964492f-40d0-4011-a65e-e4dbada354a1',4,2,3,2,'apartment','14:00:00','12:00:00','flexible','2024-12-11 21:49:14','2024-12-27 20:34:55','Pets allowed with deposit','Events allowed with prior approval',NULL,NULL,1),(12,'Radison Blu Hotel','radison blu',53.38934125,-6.24288662,'Bulevardul Eroilor 23','Brasov','Brasov','Romania','500030',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',10,6,1,1,'hotel','15:00:00','12:00:00','moderate','2024-12-13 21:29:07','2024-12-27 18:35:07','pets','events',NULL,NULL,1),(16,'test','test',53.38934125,-6.24288662,'37 Shanrath Road','Dublin','Ireland','Ireland','D09NY56',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',2,1,1,1,'hotel','12:00:00','00:00:00','moderate','2024-12-14 18:30:06','2024-12-14 19:12:23','pets','next',NULL,NULL,1),(21,'Bucharest Inn 123','Luxurious hotel in the heart of Bucharest with modern amenities and stunning city views',45.25440728,25.17105103,'Strada Principala 47','Stoenesti, Stoenesti','Arges','Romania','117675',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',1,1,1,1,'hotel','15:00:00','12:00:00','moderate','2024-12-24 13:59:46','2024-12-24 21:44:08','pets1','events1',0.0,'[]',1),(24,'johnny bucharest 1','desc',44.41874000,26.04838840,'Cara Anghel 11','Sector 6','Bucharest','Romania','031006',NULL,0.0,'f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',1,1,1,1,'apartment','14:00:00','11:00:00','flexible','2024-12-28 10:27:24','2024-12-28 10:27:24','','',0.0,'[\"German\", \"Romanian\"]',1);
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
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
