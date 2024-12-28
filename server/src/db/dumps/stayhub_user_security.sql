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
INSERT INTO `user_security` VALUES ('01d7b0d6-08a9-430e-99de-a796a19f305d',0,NULL,NULL,'2024-12-12 20:00:23',0,NULL),('482ce028-281c-432b-9343-e20db1f14efc',0,NULL,NULL,'2024-12-12 20:08:47',0,NULL),('4aadba24-54bc-427e-adf0-056db08c2a1b',0,NULL,NULL,'2024-12-12 20:11:22',0,NULL),('9964492f-40d0-4011-a65e-e4dbada354a1',0,NULL,NULL,'2024-12-07 19:31:36',0,NULL),('a116a205-65a6-4796-91e4-697a30965087',0,NULL,NULL,'2024-12-10 19:57:34',0,NULL),('a527cb72-180c-483b-89b4-7b5f5c14076d',0,NULL,NULL,'2024-12-15 19:28:44',0,NULL),('b530663c-b46c-4ed5-ae2a-1a3f3de55eb6',0,NULL,NULL,'2024-12-12 20:11:07',0,NULL),('c5320fdc-5aa9-490f-b37b-1f154c2c4b0d',0,NULL,NULL,'2024-12-12 20:05:38',0,NULL),('c9967d0a-3773-46a9-84fc-94362014a0ff',0,NULL,NULL,'2024-12-12 20:10:32',0,NULL),('f5fe59af-3d79-43b6-bbbf-45e30aab2cd6',0,NULL,NULL,'2024-12-10 19:57:54',0,NULL);
/*!40000 ALTER TABLE `user_security` ENABLE KEYS */;
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
