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

### Authentication

#### Register a New User
- **Endpoint**: POST /auth/register
- **Description**: Register a new user with email and password
- **Request Body**: 
  - name: User's full name
  - email: User's email address
  - password: Password (min 6 characters)

#### Login
- **Endpoint**: POST /auth/login
- **Description**: Authenticate a user and get JWT token
- **Request Body**:
  - email: User's email address
  - password: Password

#### Google OAuth
- **Endpoint**: GET /auth/google
- **Description**: Initiate Google OAuth flow
- **Callback**: GET /auth/google/callback

#### Get User Profile
- **Endpoint**: GET /auth/profile
- **Description**: Get the authenticated user's profile
- **Authentication**: JWT Bearer token required

### User Management

#### Create User
- **Endpoint**: POST /users
- **Description**: Create a new user
- **Authentication**: JWT Bearer token required
- **Authorization**: Any authenticated user
- **Request Body**: CreateUserDto

#### Get All Users
- **Endpoint**: GET /users
- **Description**: Get a list of all users
- **Authentication**: JWT Bearer token required
- **Authorization**: Admin role required

#### Get User by ID
- **Endpoint**: GET /users/:id
- **Description**: Get a specific user by ID
- **Authentication**: JWT Bearer token required

#### Update User
- **Endpoint**: PATCH /users/:id
- **Description**: Update a user's information
- **Authentication**: JWT Bearer token required
- **Request Body**: UpdateUserDto

#### Delete User
- **Endpoint**: DELETE /users/:id
- **Description**: Delete a user
- **Authentication**: JWT Bearer token required
- **Authorization**: Admin role required

## Database Schema

### User Entity
- id: UUID (Primary Key)
- name: String
- email: String (Unique)
- password: String (Hashed)
- role: Enum (USER, ADMIN)
- provider: Enum (LOCAL, GOOGLE)
- providerId: String
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
- [Authentication Flow](./docs/authentication.md)
- [Database Schema](./docs/database-schema.md)
- [Deployment Guide](./docs/deployment.md)
