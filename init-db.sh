#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432 -U postgres; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Connect to the database and create extensions or initial tables if needed
psql -v ON_ERROR_STOP=1 -h localhost -U postgres -d user_service <<-EOSQL
  -- Create extensions if needed
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

echo "Database initialization completed successfully!" 