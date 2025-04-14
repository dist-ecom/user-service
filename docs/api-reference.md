# API Reference

This document provides detailed information about all the APIs exposed by the User Service.

## Table of Contents
- [API Reference](#api-reference)
  - [Table of Contents](#table-of-contents)
  - [Base URL](#base-url)
  - [Authentication Header](#authentication-header)
  - [Authentication](#authentication)
    - [Register](#register)
    - [Login](#login)
    - [Google OAuth](#google-oauth)
      - [Google OAuth Callback](#google-oauth-callback)
    - [Get Profile](#get-profile)
    - [Register new user](#register-new-user)
    - [Send Email Verification](#send-email-verification)
    - [Verify Email](#verify-email)
  - [User Management](#user-management)
    - [Create User](#create-user)
    - [Get All Users](#get-all-users)
    - [Get User by ID](#get-user-by-id)
    - [Update User](#update-user)
    - [Delete User](#delete-user)
  - [Merchants](#merchants)
    - [Register new merchant](#register-new-merchant)
    - [Get merchant profile](#get-merchant-profile)
    - [Verify merchant (Admin only)](#verify-merchant-admin-only)
  - [Data Models](#data-models)
    - [User](#user)
    - [CreateUserDto](#createuserdto)
    - [UpdateUserDto](#updateuserdto)
  - [Swagger Documentation](#swagger-documentation)

## Base URL

```
http://localhost:3000
```

## Authentication Header

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Authentication

### Register

Register a new user with email and password.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Authentication Required**: No
- **Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

- **Success Response**:
  - **Code**: 201 CREATED
  - **Content**:

```json
{
  "user": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Error Response**:
  - **Code**: 400 BAD REQUEST
  - **Content**:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### Login

Authenticate a user and get a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Authentication Required**: No
- **Request Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "user": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Error Response**:
  - **Code**: 401 UNAUTHORIZED
  - **Content**:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Google OAuth

Initiate Google OAuth flow for authentication.

- **URL**: `/auth/google`
- **Method**: `GET`
- **Authentication Required**: No
- **Description**: Redirects the user to Google's authentication page.

#### Google OAuth Callback

- **URL**: `/auth/google/callback`
- **Method**: `GET`
- **Authentication Required**: No
- **Description**: Callback URL for Google OAuth. After successful authentication, returns JWT token.

### Get Profile

Get the authenticated user's profile.

- **URL**: `/auth/profile`
- **Method**: `GET`
- **Authentication Required**: Yes (JWT)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "provider": "local",
  "providerId": null,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

- **Error Response**:
  - **Code**: 401 UNAUTHORIZED
  - **Content**:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Register new user

```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "role": "USER"  // Optional, defaults to USER
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isEmailVerified": false
  },
  "access_token": "jwt_token"
}
```

### Send Email Verification

```
POST /auth/verify-email/send
```

**Authorization:** Bearer Token required

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent successfully"
}
```

### Verify Email

```
GET /auth/verify-email?token=verification_token
```

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

## User Management

### Create User

Create a new user (requires authentication).

- **URL**: `/users`
- **Method**: `POST`
- **Authentication Required**: Yes (JWT)
- **Request Body**:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "user"
}
```

- **Success Response**:
  - **Code**: 201 CREATED
  - **Content**:

```json
{
  "id": "b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "user",
  "provider": "local",
  "providerId": null,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Get All Users

Get a list of all users (admin only).

- **URL**: `/users`
- **Method**: `GET`
- **Authentication Required**: Yes (JWT)
- **Authorization Required**: Admin role
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
[
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "provider": "local",
    "providerId": null,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "id": "b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "user",
    "provider": "local",
    "providerId": null,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

- **Error Response**:
  - **Code**: 403 FORBIDDEN
  - **Content**:

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### Get User by ID

Get a user by their ID.

- **URL**: `/users/:id`
- **Method**: `GET`
- **Authentication Required**: Yes (JWT)
- **URL Parameters**: `id=[uuid]`
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "provider": "local",
  "providerId": null,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

- **Error Response**:
  - **Code**: 404 NOT FOUND
  - **Content**:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### Update User

Update a user's information.

- **URL**: `/users/:id`
- **Method**: `PATCH`
- **Authentication Required**: Yes (JWT)
- **URL Parameters**: `id=[uuid]`
- **Request Body**:

```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "role": "user",
  "provider": "local",
  "providerId": null,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Delete User

Delete a user (admin only).

- **URL**: `/users/:id`
- **Method**: `DELETE`
- **Authentication Required**: Yes (JWT)
- **Authorization Required**: Admin role
- **URL Parameters**: `id=[uuid]`
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "statusCode": 200,
  "message": "User successfully deleted"
}
```

- **Error Response**:
  - **Code**: 403 FORBIDDEN
  - **Content**:

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

## Merchants

### Register new merchant

```
POST /users/merchants
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "merchant@example.com",
  "password": "password123",
  "storeName": "John's Store",
  "location": "123 Main St, Anytown, USA",
  "storeNumber": "ST-12345",  // Optional
  "phoneNumber": "+1-555-123-4567",  // Optional
  "description": "Specialty goods store"  // Optional
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "merchant@example.com",
    "name": "John Smith",
    "role": "MERCHANT",
    "isVerified": false,
    "isEmailVerified": false,
    "merchantProfile": {
      "id": "uuid",
      "storeName": "John's Store",
      "location": "123 Main St, Anytown, USA",
      "storeNumber": "ST-12345",
      "phoneNumber": "+1-555-123-4567",
      "description": "Specialty goods store"
    }
  },
  "access_token": "jwt_token"
}
```

### Get merchant profile

```
GET /users/merchants/:id
```

**Authorization:** Bearer Token required

**Response:**
```json
{
  "id": "uuid",
  "email": "merchant@example.com",
  "name": "John Smith",
  "role": "MERCHANT",
  "isVerified": true,
  "isEmailVerified": true,
  "merchantProfile": {
    "id": "uuid",
    "storeName": "John's Store",
    "location": "123 Main St, Anytown, USA",
    "storeNumber": "ST-12345",
    "phoneNumber": "+1-555-123-4567",
    "description": "Specialty goods store"
  }
}
```

### Verify merchant (Admin only)

```
PATCH /users/merchants/:id/verify
```

**Authorization:** Bearer Token required (Admin role)

**Response:**
```json
{
  "id": "uuid",
  "email": "merchant@example.com",
  "name": "John Smith",
  "role": "MERCHANT",
  "isVerified": true,
  "isEmailVerified": true
}
```

## Data Models

### User

```typescript
{
  id: string;            // UUID
  name: string;          // Full name
  email: string;         // Email address (unique)
  password: string;      // Hashed password (not returned in responses)
  role: string;          // 'user' or 'admin'
  provider: string;      // 'local' or 'google'
  providerId: string;    // ID from OAuth provider (if applicable)
  createdAt: Date;       // Creation timestamp
  updatedAt: Date;       // Last update timestamp
}
```

### CreateUserDto

```typescript
{
  name: string;          // Required
  email: string;         // Required, must be valid email
  password: string;      // Optional for OAuth users, min length 6
  role: string;          // Optional, defaults to 'user'
  provider: string;      // Optional, defaults to 'local'
  providerId: string;    // Optional
}
```

### UpdateUserDto

```typescript
{
  name?: string;         // Optional
  email?: string;        // Optional, must be valid email
  password?: string;     // Optional
  role?: string;         // Optional
}
```

## Swagger Documentation

For an interactive API documentation, you can use the Swagger UI at:

```
http://localhost:3000/api
```

The Swagger UI allows you to:
- Explore all available endpoints
- See required parameters and schemas
- Test endpoints directly from the browser
- Authenticate using JWT tokens 