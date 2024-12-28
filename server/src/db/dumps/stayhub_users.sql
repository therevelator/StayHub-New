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
  `role` varchar(10) DEFAULT 'user',
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
INSERT INTO `users` VALUES ('01d7b0d6-08a9-430e-99de-a796a19f305d','ionut@test.com','$2a$10$OK0yb9X9vf0Y99pkbWsu4eEgAloLZns2KLGb8E44tuROv2WM7OM1W','Ionut','Test','1234567890','2024-12-12 20:00:23','2024-12-12 20:00:23',NULL,'active',0,'user'),('482ce028-281c-432b-9343-e20db1f14efc','ionut1@user.com','$2a$10$X7yNvjoEEqt7pdvgcAUE6OoxsHcOlIRSWPN/0wqKNtNq5M4E.68Ma','ion','onu','1234567890','2024-12-12 20:08:47','2024-12-12 20:08:47',NULL,'active',0,'user'),('4aadba24-54bc-427e-adf0-056db08c2a1b','ionut4@user.com','$2a$10$W.NlQYex9QtFHCSOmVaUkeDciT202V44cn6FfXGFT5xhdcYP8Bb.u','ion','onu','1234567890','2024-12-12 20:11:22','2024-12-12 20:11:22',NULL,'active',0,'user'),('9964492f-40d0-4011-a65e-e4dbada354a1','ionutnapostu@gmail.com','$2a$10$LDe.diCaBx.bHAdVmrkUVOdunHVbiW.8XyDhUhX2SPdihED7dgGom','Ionut','Apostu','1858153486','2024-12-07 19:31:36','2024-12-10 19:20:41','2024-12-10 19:20:41','active',0,'user'),('a116a205-65a6-4796-91e4-697a30965087','admin@example.com','$2a$10$2pteRghM5.uuYuNRJd4dreLFDjEFXEjmb2TDg6H09tLdzgMbHMv8y','Ionut','Apostu','9858153486','2024-12-10 19:57:34','2024-12-10 19:57:34',NULL,'active',0,'user'),('a527cb72-180c-483b-89b4-7b5f5c14076d','123@123.com','$2a$10$IvZpdp72CKHQeT5BbfpFMuIJjul.qRj5mFyntzMBm2TJZkXChi74C','ionut','apostu','1818181818','2024-12-15 19:28:44','2024-12-15 19:28:44',NULL,'active',0,'user'),('b530663c-b46c-4ed5-ae2a-1a3f3de55eb6','ionut3@user.com','$2a$10$qsyf6ibqPpqkcRJHhW8sfecbuvFZJK2L5cx14zNLYPZKJloOKtlaW','ion','onu','1234567890','2024-12-12 20:11:07','2024-12-12 20:11:07',NULL,'active',0,'user'),('ba0b32ca-b730-11ef-b45f-3a2a2436a493','admin@admin.com','$2b$10$5QZX.H1ymxD7kRiEJWYPaOsWxvXuBUJQIhG9r.L1iC2N.oZDRxEtG','Admin','User',NULL,'2024-12-10 19:55:37','2024-12-10 19:55:37',NULL,'active',0,'admin'),('c5320fdc-5aa9-490f-b37b-1f154c2c4b0d','ionut@user.com','$2a$10$ETbBedtNytunfdnWG/oBvOL7oJ.GTVVRPQv0mUM8asN2rWZQgbiNW','ion','onu','1234567890','2024-12-12 20:05:38','2024-12-12 20:05:38',NULL,'active',0,'user'),('c9967d0a-3773-46a9-84fc-94362014a0ff','ionut2@user.com','$2a$10$SchjcEQ6VBsPeJwky/HnP.FExJ8fMw8y4rIWizp/NEdyFUZAZCLgm','ion','onu','1234567890','2024-12-12 20:10:32','2024-12-12 20:10:32',NULL,'active',0,'user'),('f5fe59af-3d79-43b6-bbbf-45e30aab2cd6','admin@123.com','$2a$10$uVPUcC9.StkQHXcmhEp/v.BdAIUxIU5570PMekl/kizjx3DRCQMQa','Ionut','Apostu','9858153486','2024-12-10 19:57:54','2024-12-10 20:02:08','2024-12-10 20:02:08','active',0,'admin');
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

-- Dump completed on 2024-12-28 13:18:43
