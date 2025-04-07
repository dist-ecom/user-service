# User Service

A microservice for user management and authentication built with NestJS.

## Description

This service handles user-related operations including:
- User registration and authentication
- JWT-based authentication
- OAuth2 integration (Google)
- User profile management

## Technologies

- NestJS (v11)
- TypeScript
- PostgreSQL
- TypeORM
- Passport.js
- JWT
- Class Validator
- Jest (Testing)

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone url
cd user-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

The service exposes the following main endpoints:

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/profile` - Delete user account

## Project Structure

```
src/
├── auth/           # Authentication related modules
├── users/          # User management modules
├── main.ts         # Application entry point
└── app.module.ts   # Root module
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the UNLICENSED license.
