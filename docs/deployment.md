# Deployment Guide

This guide provides instructions for deploying the User Service to various environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [AWS Deployment](#aws-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Database Migration](#database-migration)
- [Monitoring and Logging](#monitoring-and-logging)

## Prerequisites

Before deploying the User Service, ensure you have:

- Node.js 18+ for manual deployments
- Docker and Docker Compose for containerized deployments
- Access to a PostgreSQL database
- Required environment variables configured

## Environment Configuration

The User Service requires the following environment variables:

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
GOOGLE_CALLBACK_URL=http://your-domain.com/auth/google/callback

# App
PORT=3000
NODE_ENV=production
```

For production, use a secure, randomly generated string for `JWT_SECRET`.

## Docker Deployment

### Building the Docker Image

A Dockerfile is provided in the root of the project. To build the image:

```bash
docker build -t user-service:latest .
```

### Running with Docker Compose

A sample `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  app:
    image: user-service:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_HOST=db
      - DATABASE_PORT=5432
      - DATABASE_USERNAME=postgres
      - DATABASE_PASSWORD=password
      - DATABASE_NAME=user_service
      - JWT_SECRET=your_jwt_secret_key
      - JWT_EXPIRATION=1d
      - GOOGLE_CLIENT_ID=your_google_client_id
      - GOOGLE_CLIENT_SECRET=your_google_client_secret
      - GOOGLE_CALLBACK_URL=http://your-domain.com/auth/google/callback
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=user_service
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:

```bash
docker-compose up -d
```

## Kubernetes Deployment

### Kubernetes Manifests

#### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_HOST
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: database-host
        - name: DATABASE_PORT
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: database-port
        - name: DATABASE_USERNAME
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: database-username
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: database-password
        - name: DATABASE_NAME
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: database-name
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: jwt-secret
        - name: JWT_EXPIRATION
          value: "1d"
        - name: GOOGLE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: google-client-id
        - name: GOOGLE_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: google-client-secret
        - name: GOOGLE_CALLBACK_URL
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: google-callback-url
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
```

#### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Secrets

Create a Kubernetes secret for sensitive information:

```bash
kubectl create secret generic user-service-secrets \
  --from-literal=database-host=your-db-host \
  --from-literal=database-port=5432 \
  --from-literal=database-username=postgres \
  --from-literal=database-password=password \
  --from-literal=database-name=user_service \
  --from-literal=jwt-secret=your_jwt_secret_key \
  --from-literal=google-client-id=your_google_client_id \
  --from-literal=google-client-secret=your_google_client_secret \
  --from-literal=google-callback-url=http://your-domain.com/auth/google/callback
```

Apply the manifests:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

## AWS Deployment

### AWS Elastic Beanstalk

1. Install the EB CLI:
   ```bash
   pip install awsebcli
   ```

2. Initialize EB application:
   ```bash
   eb init
   ```

3. Create an environment:
   ```bash
   eb create production
   ```

4. Set environment variables:
   ```bash
   eb setenv NODE_ENV=production PORT=3000 DATABASE_HOST=your-db-host ...
   ```

5. Deploy:
   ```bash
   eb deploy
   ```

### AWS ECS with Fargate

1. Create an ECR repository and push your Docker image
2. Create a task definition with appropriate environment variables
3. Create an ECS cluster with Fargate
4. Create a service using the task definition
5. Set up an Application Load Balancer to route traffic

## CI/CD Pipeline

### GitHub Actions Example

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint:ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: your-registry/user-service:latest
          
      - name: Deploy to production
        # Add your deployment steps here
        run: |
          # Example: Deploy to Kubernetes
          # kubectl apply -f deployment.yaml
```

## Database Migration

Before deploying a new version, ensure database migrations are handled correctly:

1. Generate migrations for any entity changes:
   ```bash
   npm run typeorm migration:generate -- -n MigrationName
   ```

2. Include migrations in your deployment process:
   ```bash
   npm run typeorm migration:run
   ```

3. In a containerized environment, you might want to run migrations as part of the container startup script.

## Monitoring and Logging

### Health Check Endpoint

The User Service provides a health check endpoint at `/health` that returns the status of the service and its dependencies.

### Logging

Configure logging to output to stdout/stderr in production for container compatibility. The logs can then be collected by your container orchestration platform.

### Prometheus Metrics

For monitoring, you can integrate Prometheus metrics using the `@nestjs/prometheus` package:

```bash
npm install @nestjs/prometheus prom-client
```

Then configure the PrometheusModule in your application.

### Tracing

For distributed tracing, consider integrating OpenTelemetry:

```bash
npm install @opentelemetry/node @opentelemetry/tracing
```

## Production Checklist

Before deploying to production, ensure:

- [ ] Environment variables are securely set
- [ ] `synchronize: false` is set in TypeORM config
- [ ] Database migrations are prepared
- [ ] JWT secret is securely generated and stored
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Health check endpoints are available
- [ ] Logging is properly configured
- [ ] Error handling is implemented
- [ ] Security headers are set
- [ ] SSL/TLS is configured
- [ ] Database backups are configured 