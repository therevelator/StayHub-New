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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-28 13:18:43
