# StayHub - Modern Accommodation Booking Platform

A scalable and modern web application for booking accommodations worldwide, built with React, Node.js, and MySQL.

## System Requirements

- Node.js v14 or higher
- MySQL 8.0 or higher
- npm or yarn
- Docker (optional, for containerized database)

## Tech Stack

### Frontend
- React 18
- Material-UI
- React Router
- Vite
- Axios for API calls

### Backend
- Node.js
- Express
- MySQL (primary database)
- JWT for authentication

## Quick Start

### 1. Database Setup

#### Using Docker (Recommended)
```bash
# Pull MySQL image
docker pull mysql:8.0

# Create a Docker volume for persistent data
docker volume create stayhub_mysqldata

# Start MySQL container
docker run --name stayhub-mysql \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=stayhub \
  -v stayhub_mysqldata:/var/lib/mysql \
  -p 3306:3306 \
  -d mysql:8.0
```

#### Manual MySQL Setup
1. Install MySQL 8.0
2. Create a new database:
```sql
CREATE DATABASE stayhub;
```
3. Run the schema.sql file from server/src/db/schema.sql

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file and update with your credentials
cp .env.example .env

# Seed the database with demo properties
npm run seed

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Environment Variables

### Backend (.env)
```
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stayhub
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5001/api
```

## API Documentation

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- Body: 
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- Response: JWT token

#### Login
- **POST** `/api/auth/login`
- Body:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- Response: JWT token

### Property Endpoints

#### Search Properties
- **GET** `/api/properties/search`
- Query Parameters:
  - `latitude`: number (required)
  - `longitude`: number (required)
  - `radius`: number (in kilometers, default: 5)
  - `minPrice`: number (optional)
  - `maxPrice`: number (optional)
  - `guests`: number (optional)
- Response: Array of properties within radius

#### Get Property Details
- **GET** `/api/properties/:id`
- Response: Detailed property information including amenities, images, and rules

#### Create Property Listing
- **POST** `/api/properties`
- Authentication: Required
- Body:
  ```json
  {
    "name": "Property Name",
    "description": "Property description",
    "latitude": 53.3498,
    "longitude": -6.2603,
    "street": "123 Main St",
    "city": "Dublin",
    "country": "Ireland",
    "postal_code": "D01 ABC1",
    "price": 150.00,
    "guests": 4,
    "bedrooms": 2,
    "beds": 2,
    "bathrooms": 1,
    "property_type": "apartment",
    "check_in_time": "15:00",
    "check_out_time": "11:00",
    "cancellation_policy": "flexible",
    "amenities": ["WiFi", "Kitchen"],
    "rules": ["No smoking", "No parties"]
  }
  ```

### Booking Endpoints

#### Create Booking
- **POST** `/api/bookings`
- Authentication: Required
- Body:
  ```json
  {
    "property_id": 1,
    "check_in_date": "2024-01-01",
    "check_out_date": "2024-01-05"
  }
  ```

#### Get User Bookings
- **GET** `/api/bookings`
- Authentication: Required
- Response: Array of user's bookings

#### Cancel Booking
- **PUT** `/api/bookings/:id/cancel`
- Authentication: Required

## Database Schema

The application uses MySQL as its primary database. The complete schema can be found in server/src/db/schema.sql. Key tables include:

- `users`: User accounts and authentication
- `properties`: Property listings and details
- `property_amenities`: Property amenities
- `property_images`: Property images from Unsplash
- `property_rules`: Property rules and restrictions
- `bookings`: Booking records
- `reviews`: Property reviews and ratings

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Rate limiting on authentication endpoints
- CORS protection
- SQL injection prevention through parameterized queries
- XSS protection

## Development

### Running Tests

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## Deployment

### Production Considerations

1. Database
   - Set up master-slave replication
   - Configure regular backups
   - Use connection pooling
   - Set up monitoring

2. Application
   - Use PM2 for process management
   - Set up Nginx as reverse proxy
   - Configure SSL certificates
   - Set up monitoring and logging

3. Security
   - Enable rate limiting
   - Set up WAF
   - Regular security audits
   - Implement CSRF protection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
