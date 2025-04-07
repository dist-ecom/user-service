# Testing the User Service

This document explains how to run tests for the User Service.

## Prerequisites

- Node.js and npm installed (for local testing)
- Docker and Docker Compose installed (for containerized testing)

## Running Tests Locally

### Unit Tests

Unit tests verify individual components of the application in isolation.

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode (for development)
npm run test:watch

# Run unit tests with coverage report
npm run test:cov
```

### End-to-End Tests

E2E tests verify the entire application by simulating real user scenarios.

Prerequisites:
- PostgreSQL database running on localhost:5432
- Database named 'user_service_test' created

```bash
# Run end-to-end tests
npm run test:e2e
```

## Running Tests in Docker

Docker provides an isolated environment for testing with all dependencies included.

```bash
# Start the test environment
docker-compose -f docker-compose.test.yml up --build

# For running tests and immediately removing containers
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Run only unit tests
docker-compose -f docker-compose.test.yml run --rm user-service-test npm test

# Run only e2e tests
docker-compose -f docker-compose.test.yml run --rm user-service-test npm run test:e2e
```

## Test Coverage

The coverage report will show the percentage of code covered by tests. You can view a detailed HTML report in the `coverage` directory after running:

```bash
npm run test:cov
```

## Testing Strategies

The User Service implements several testing strategies:

1. **Unit Testing**: Testing individual components (services, controllers) in isolation
2. **Integration Testing**: Testing the interaction between components
3. **End-to-End Testing**: Testing the entire application flow

### What We Test

- **User Authentication**: Registration, login, OAuth2 flow
- **Authorization**: Role-based access control
- **User Management**: CRUD operations on user entities
- **Error Handling**: Proper error responses for invalid input or unauthorized access

## Continuous Integration

Tests are automatically run in the CI pipeline on each commit. The pipeline will fail if any test fails or if the test coverage falls below the required threshold. 