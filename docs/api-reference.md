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
    - [Send Email Verification](#send-email-verification)
    - [Verify Email](#verify-email)
  - [User Management](#user-management)
    - [Create User](#create-user)
    - [Create Admin User](#create-admin-user)
    - [Create Merchant User](#create-merchant-user)
    - [Get All Users](#get-all-users)
    - [Get User by ID](#get-user-by-id)
    - [Update User](#update-user)
    - [Delete User](#delete-user)
    - [Verify User](#verify-user)
    - [Check Verification Status](#check-verification-status)
  - [Data Models](#data-models)
    - [User](#user)
    - [CreateUserDto](#createuserdto)
    - [CreateAdminDto](#createadmindto)
    - [CreateMerchantDto](#createmerchantdto)
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
  "password": "password123",
  "role": "USER",
  "provider": "LOCAL",
  "providerId": "123456789"
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

### Send Email Verification

Send a verification email to the user.

- **URL**: `/auth/verify-email/send`
- **Method**: `POST`
- **Authentication Required**: Yes (JWT)
- **Request Body**:

```json
{
  "email": "user@example.com"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "message": "Verification email sent successfully"
}
```

- **Error Responses**:
  - **Code**: 401 UNAUTHORIZED
  - **Content**:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

  - **Code**: 404 NOT FOUND
  - **Content**:

```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

### Verify Email

Verify a user's email with the verification token.

- **URL**: `/auth/verify-email`
- **Method**: `GET`
- **Authentication Required**: No
- **Query Parameters**:
  - `token`: The verification token sent via email
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "message": "Email verified successfully"
}
```

- **Error Response**:
  - **Code**: 400 BAD REQUEST
  - **Content**:

```json
{
  "statusCode": 400,
  "message": "Invalid verification token"
}
```

## User Management

### Create User

Create a new user.

- **URL**: `/users`
- **Method**: `POST`
- **Authentication Required**: Yes (JWT)
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

- **Success Response**:
  - **Code**: 201 CREATED
  - **Content**:

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

### Create Admin User

Register a new admin user.

- **URL**: `/users/admin`
- **Method**: `POST`
- **Authentication Required**: Yes (JWT)
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

- **Success Response**:
  - **Code**: 201 CREATED
  - **Content**:

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "provider": "local",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - **Code**: 400 BAD REQUEST
  - **Content**:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

  - **Code**: 401 UNAUTHORIZED
  - **Content**:

```json
{
  "statusCode": 401,
  "message": "Invalid admin registration key",
  "error": "Unauthorized"
}
```

### Create Merchant User

Register a new merchant user.

- **URL**: `/users/merchant`
- **Method**: `POST`
- **Authentication Required**: Yes (JWT)
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

- **Success Response**:
  - **Code**: 201 CREATED
  - **Content**:

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "name": "Merchant Store",
  "email": "merchant@example.com",
  "role": "merchant",
  "provider": "local",
  "isVerified": false,
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z",
  "merchantProfile": {
    "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    "storeName": "My Awesome Store",
    "location": "123 Main St, City, Country",
    "storeNumber": "A-123",
    "phoneNumber": "+1-555-123-4567",
    "description": "We sell high-quality products",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
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

### Get All Users

Get a list of all users (admin only).

- **URL**: `/users`
- **Method**: `GET`
- **Authentication Required**: Yes (JWT)
- **Authorization**: Admin role required
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
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  },
  {
    "id": "b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "admin",
    "provider": "local",
    "providerId": null,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
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

Get a specific user by ID.

- **URL**: `/users/{id}`
- **Method**: `GET`
- **Authentication Required**: Yes (JWT)
- **URL Parameters**:
  - `id`: User ID (UUID)
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

- **URL**: `/users/{id}`
- **Method**: `PATCH`
- **Authentication Required**: Yes (JWT)
- **URL Parameters**:
  - `id`: User ID (UUID)
- **Request Body**:

```json
{
  "name": "John Updated",
  "email": "johnupdated@example.com",
  "password": "newpassword123",
  "role": "USER"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "name": "John Updated",
  "email": "johnupdated@example.com",
  "role": "user",
  "provider": "local",
  "providerId": null,
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - **Code**: 400 BAD REQUEST
  - **Content**:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

  - **Code**: 404 NOT FOUND
  - **Content**:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### Delete User

Delete a user (admin only).

- **URL**: `/users/{id}`
- **Method**: `DELETE`
- **Authentication Required**: Yes (JWT)
- **Authorization**: Admin role required
- **URL Parameters**:
  - `id`: User ID (UUID)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "message": "User deleted successfully"
}
```

- **Error Responses**:
  - **Code**: 403 FORBIDDEN
  - **Content**:

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

  - **Code**: 404 NOT FOUND
  - **Content**:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### Verify User

Verify a user (admin only).

- **URL**: `/users/{id}/verify`
- **Method**: `PATCH`
- **Authentication Required**: Yes (JWT)
- **Authorization**: Admin role required
- **URL Parameters**:
  - `id`: User ID (UUID)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "message": "User verified successfully"
}
```

- **Error Responses**:
  - **Code**: 403 FORBIDDEN
  - **Content**:

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

  - **Code**: 404 NOT FOUND
  - **Content**:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### Check Verification Status

Check user verification status.

- **URL**: `/users/verification/status/{id}`
- **Method**: `GET`
- **Authentication Required**: Yes (JWT)
- **URL Parameters**:
  - `id`: User ID (UUID)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "isVerified": true
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

## Data Models

### User

```typescript
{
  id: string; // UUID
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'MERCHANT';
  provider: 'LOCAL' | 'GOOGLE';
  providerId: string | null;
  isVerified: boolean;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  merchantProfile?: {
    id: string;
    storeName: string;
    location: string;
    storeNumber?: string;
    phoneNumber?: string;
    description?: string;
  };
}
```

### CreateUserDto

```typescript
{
  name: string; // Required
  email: string; // Required, must be valid email
  password: string; // Required, min length 6
  role?: 'ADMIN' | 'USER' | 'MERCHANT'; // Optional
  provider?: 'LOCAL' | 'GOOGLE'; // Optional, default is 'LOCAL'
  providerId?: string; // Optional
}
```

### CreateAdminDto

```typescript
{
  name: string; // Required
  email: string; // Required, must be valid email
  password: string; // Required, min length 8, must contain uppercase, lowercase, number and special character
  adminSecretKey: string; // Required
  provider: 'LOCAL' | 'GOOGLE'; // Required, default is 'LOCAL'
}
```

### CreateMerchantDto

```typescript
{
  name: string; // Required
  email: string; // Required, must be valid email
  password: string; // Required, min length 6
  provider: 'LOCAL' | 'GOOGLE'; // Required, default is 'LOCAL'
  providerId?: string; // Optional
  storeName: string; // Required
  location: string; // Required
  storeNumber?: string; // Optional
  phoneNumber?: string; // Optional
  description?: string; // Optional
}
```

### UpdateUserDto

```typescript
{
  name?: string; // Optional
  email?: string; // Optional, must be valid email
  password?: string; // Optional
  role?: 'ADMIN' | 'USER' | 'MERCHANT'; // Optional
}
```

## Swagger Documentation

The API is documented using Swagger. When the application is running, you can access:

- **Swagger UI**: `http://localhost:3000/api`
- **Swagger JSON**: `http://localhost:3000/api-json` 