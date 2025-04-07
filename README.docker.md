# Docker Setup for User Service

This document explains how to run the User Service using Docker.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git (to clone the repository)

## Running the Database Only

If you want to run just the PostgreSQL database:

```bash
# Start the PostgreSQL container
docker-compose up -d postgres

# Check if the container is running
docker-compose ps
```

The PostgreSQL database will be available at:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: postgres
- Database: user_service

## Running the Complete Stack

To run both the database and the user service:

```bash
# Build and start all services
docker-compose up -d

# Check if the containers are running
docker-compose ps
```

The User Service API will be available at http://localhost:3000

## Environment Variables

The following environment variables are used in the docker-compose.yml file:

- DATABASE_HOST: The hostname of the PostgreSQL server (default: postgres)
- DATABASE_PORT: The port of the PostgreSQL server (default: 5432)
- DATABASE_USERNAME: The username for PostgreSQL (default: postgres)
- DATABASE_PASSWORD: The password for PostgreSQL (default: postgres)
- DATABASE_NAME: The name of the database (default: user_service)
- JWT_SECRET: Secret key for JWT tokens
- JWT_EXPIRATION_TIME: Expiration time for JWT tokens (in seconds)
- GOOGLE_CLIENT_ID: Google OAuth client ID
- GOOGLE_CLIENT_SECRET: Google OAuth client secret
- GOOGLE_CALLBACK_URL: Google OAuth callback URL

## Stopping the Services

To stop all services:

```bash
docker-compose down
```

To stop all services and remove volumes (this will delete all data):

```bash
docker-compose down -v
```

## Viewing Logs

To view logs from all services:

```bash
docker-compose logs
```

To view logs from a specific service:

```bash
docker-compose logs postgres
docker-compose logs user-service
```

## Database Management

To access the PostgreSQL database directly:

```bash
docker-compose exec postgres psql -U postgres -d user_service
``` 