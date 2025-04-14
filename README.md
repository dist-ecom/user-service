# User Service

## Overview
The User Service is a key component of the ecommerce platform, providing authentication, user management, and role-based authorization. It's built using NestJS and follows RESTful API principles.

## Features
- User registration and authentication
- OAuth integration with Google
- JWT-based authentication
- Role-based access control
- User management (CRUD operations)
- API documentation with Swagger
- Merchant and Admin user management
- Email verification

## Tech Stack
- NestJS - Progressive Node.js framework
- TypeORM - ORM for database interactions
- PostgreSQL - Database
- Passport.js - Authentication middleware
- JWT - Token-based authentication
- Swagger - API documentation

## Prerequisites
- Node.js (v18+)
- npm or yarn
- PostgreSQL

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd user-service

# Install dependencies
npm install
```

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=user_service

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# App
PORT=3000
NODE_ENV=development
```

## Running the App

```bash
# Development
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

The API is documented using Swagger. Once the application is running, you can access the Swagger UI at:

```
http://localhost:3000/api
```

You can also access the Swagger JSON at:

```
http://localhost:3000/api-json
```

### Authentication Endpoints

#### Register a New User
- **Endpoint**: `POST /auth/register`
- **Description**: Register a new user with email and password
- **Request Body**: 
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "USER",
    "provider": "LOCAL",
    "providerId": "123456789"
  }
  ```
- **Response**: 
  ```json
  {
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "JWT_TOKEN"
  }
  ```

#### Login
- **Endpoint**: `POST /auth/login`
- **Description**: Authenticate a user and get JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "JWT_TOKEN"
  }
  ```

#### Google OAuth
- **Endpoint**: `GET /auth/google`
- **Description**: Initiate Google OAuth flow
- **Callback**: `GET /auth/google/callback`

#### Get User Profile
- **Endpoint**: `GET /auth/profile`
- **Description**: Get the authenticated user's profile
- **Authentication**: JWT Bearer token required

#### Email Verification
- **Endpoint**: `POST /auth/verify-email/send`
- **Description**: Send a verification email to the user
- **Authentication**: JWT Bearer token required
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

- **Endpoint**: `GET /auth/verify-email?token=verification_token`
- **Description**: Verify a user's email with the token

### User Management Endpoints

#### Create User
- **Endpoint**: `POST /users`
- **Description**: Create a new user
- **Authentication**: JWT Bearer token required
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "USER",
    "provider": "LOCAL",
    "providerId": "123456789"
  }
  ```
- **Response**:
  ```json
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "provider": "local",
    "providerId": null,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
  ```

#### Create Admin User
- **Endpoint**: `POST /users/admin`
- **Description**: Register a new admin user
- **Authentication**: JWT Bearer token required
- **Request Body**:
  ```json
  {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "StrongP@ss123",
    "adminSecretKey": "ADMIN_SECRET_KEY",
    "provider": "LOCAL"
  }
  ```

#### Create Merchant User
- **Endpoint**: `POST /users/merchant`
- **Description**: Register a new merchant
- **Authentication**: JWT Bearer token required
- **Request Body**:
  ```json
  {
    "name": "Merchant Store",
    "email": "merchant@example.com",
    "password": "password123",
    "provider": "LOCAL",
    "storeName": "My Awesome Store",
    "location": "123 Main St, City, Country",
    "storeNumber": "A-123",
    "phoneNumber": "+1-555-123-4567",
    "description": "We sell high-quality products"
  }
  ```

#### Get All Users
- **Endpoint**: `GET /users`
- **Description**: Get a list of all users
- **Authentication**: JWT Bearer token required
- **Authorization**: Admin role required

#### Get User by ID
- **Endpoint**: `GET /users/{id}`
- **Description**: Get a specific user by ID
- **Authentication**: JWT Bearer token required
- **Response**:
  ```json
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "provider": "local",
    "providerId": null,
    "isVerified": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "merchantProfile": {
      "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      "storeName": "My Awesome Store",
      "location": "123 Main St, City, Country",
      "storeNumber": "A-123",
      "phoneNumber": "+1-555-123-4567",
      "description": "We sell high-quality products"
    }
  }
  ```

#### Update User
- **Endpoint**: `PATCH /users/{id}`
- **Description**: Update a user's information
- **Authentication**: JWT Bearer token required
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "newpassword123",
    "role": "USER"
  }
  ```

#### Delete User
- **Endpoint**: `DELETE /users/{id}`
- **Description**: Delete a user
- **Authentication**: JWT Bearer token required
- **Authorization**: Admin role required

#### Verify User (Admin Only)
- **Endpoint**: `PATCH /users/{id}/verify`
- **Description**: Verify a user (admin only)
- **Authentication**: JWT Bearer token required
- **Authorization**: Admin role required

#### Check Verification Status
- **Endpoint**: `GET /users/verification/status/{id}`
- **Description**: Check user verification status
- **Authentication**: JWT Bearer token required
- **Response**:
  ```json
  {
    "isVerified": true
  }
  ```

## Database Schema

### User Entity
- id: UUID (Primary Key)
- name: String
- email: String (Unique)
- password: String (Hashed)
- role: Enum (USER, ADMIN, MERCHANT)
- provider: Enum (LOCAL, GOOGLE)
- providerId: String
- isVerified: Boolean
- createdAt: DateTime
- updatedAt: DateTime

### Merchant Profile Entity
- id: UUID (Primary Key)
- userId: UUID (Foreign Key)
- storeName: String
- location: String
- storeNumber: String
- phoneNumber: String
- description: String
- createdAt: DateTime
- updatedAt: DateTime

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Response Formats

### Success Response
```json
{
  "statusCode": 200,
  "data": {...}
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

## Additional Documentation

For more detailed documentation, please refer to the [docs](./docs) directory:
- [API Reference](./docs/api-reference.md)
- [Authentication Flow](./docs/authentication.md) - Contains authentication flow diagrams
- [Database Schema](./docs/database-schema.md) - Includes entity relationship diagrams
- [Deployment Guide](./docs/deployment.md)

## Diagrams

Visual documentation is available in the [docs/diagrams](./docs/diagrams) directory:
- Entity Relationship Diagram (ERD.svg)
- Authentication Sequence Diagrams (auth-seq*.svg)
- Authorization Flow Charts (auth-flowchart*.svg)
- Merchant Verification State Diagram (state-diagram.svg)
