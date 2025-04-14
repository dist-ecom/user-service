# Database Schema

This document provides details about the database structure used in the User Service.

## Entity Relationship Diagram

| Column      | Type     | Description        |
|-------------|----------|--------------------|
| id          | UUID (PK)| Primary key        |
| name        | String   | User's name        |
| email       | String   | User's email       |
| password    | String   | Hashed password    |
| role        | Enum     | User role          |
| provider    | Enum     | Auth provider type |
| providerId  | String   | Provider user ID   |
| createdAt   | Date     | Account creation   |
| updatedAt   | Date     | Last update        |


## Database Tables

### User Table

The User table stores all user data, including both locally registered users and those who authenticated via OAuth providers.

#### Columns

| Column      | Type      | Constraints      | Description                            |
|-------------|-----------|------------------|----------------------------------------|
| id          | UUID      | PK, NOT NULL     | Unique identifier for the user         |
| name        | VARCHAR   | NULLABLE         | User's full name                       |
| email       | VARCHAR   | UNIQUE, NOT NULL | User's email address                   |
| password    | VARCHAR   | NULLABLE         | Hashed password (null for OAuth users) |
| role        | ENUM      | NOT NULL         | User role (admin, user, merchant)       |
| provider    | ENUM      | NOT NULL         | Auth provider (local, google)          |
| providerId  | VARCHAR   | NULLABLE         | ID from OAuth provider                 |
| createdAt   | TIMESTAMP | NOT NULL         | Record creation timestamp              |
| updatedAt   | TIMESTAMP | NOT NULL         | Record update timestamp                |
| isVerified  | BOOLEAN   | NOT NULL         | Whether the user's account is verified  |
| isEmailVerified | BOOLEAN | NOT NULL         | Whether the user's email is verified    |
| emailVerifyToken | VARCHAR | NULLABLE         | Token for email verification            |
| emailVerifyExpires | TIMESTAMP | NULLABLE         | Expiration time for email verification |

#### Indexes

| Name           | Columns | Type   | Description                  |
|----------------|---------|--------|------------------------------|
| PK_user        | id      | PRIMARY| Primary key                  |
| IDX_user_email | email   | UNIQUE | Unique index on email        |

## TypeORM Configuration

The User Service uses TypeORM for database access. Below is the entity definition for the User model:

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Column({ nullable: true })
  providerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password && this.provider === AuthProvider.LOCAL) {
      const salt = 10;
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (this.provider !== AuthProvider.LOCAL) {
      return false;
    }
    return await bcrypt.compare(password, this.password);
  }
}
```

## Enums

### UserRole

```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MERCHANT = 'merchant'
}
```

### AuthProvider

```typescript
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google'
}
```

## Database Migrations

The User Service uses TypeORM migrations to manage database schema changes. Migrations are located in the `src/migrations` directory and are run automatically during application deployment.

To generate a new migration after entity changes:

```bash
npm run typeorm migration:generate -- -n MigrationName
```

To run migrations manually:

```bash
npm run typeorm migration:run
```

## Data Relations

Currently, the User Service has a standalone User entity with no relationships to other entities. As the application grows, potential relationships could include:

- One-to-many relationship with user sessions
- One-to-many relationship with user preferences
- Many-to-many relationship with user roles (for more complex authorization)

## Database Connection

The database connection is configured in the `TypeOrmModule` within the application:

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
})
```

> **Warning**: The `synchronize: true` option automatically syncs entity definitions with the database schema. This is useful during development but should be disabled in production to prevent accidental data loss.

## Merchant Model

| Field | Type | Description |
| ----- | ---- | ----------- |
| id | String (UUID) | Primary key |
| storeName | String | Name of the merchant's store |
| location | String | Physical location of the store |
| storeNumber | String (optional) | Store identifier number |
| phoneNumber | String (optional) | Contact phone number |
| description | String (optional) | Store description |
| createdAt | DateTime | When the merchant profile was created |
| updatedAt | DateTime | When the merchant profile was last updated |
| userId | String | Foreign key to User model (one-to-one relationship) |

### Relationships

- One-to-one relationship with User model (a merchant has one user account, a user can have at most one merchant profile)

## User Model

| Field | Type | Description |
| ----- | ---- | ----------- |
| id | String (UUID) | Primary key |
| name | String (optional) | User's name |
| email | String | User's email address (unique) |
| password | String (optional) | Hashed password (null for OAuth users) |
| role | UserRole | User's role (ADMIN, USER, MERCHANT) |
| provider | AuthProvider | Authentication provider (LOCAL, GOOGLE) |
| providerId | String (optional) | ID from external provider (for OAuth) |
| isVerified | Boolean | Whether the user's account is verified (default: false) |
| isEmailVerified | Boolean | Whether the user's email is verified (default: false) |
| emailVerifyToken | String (optional) | Token for email verification (unique) |
| emailVerifyExpires | DateTime (optional) | Expiration time for email verification token |
| createdAt | DateTime | When the user was created |
| updatedAt | DateTime | When the user was last updated |

## UserRole Enum

- `ADMIN`: Administrator with full system access
- `USER`: Regular user with standard permissions
- `MERCHANT`: Store owner with merchant-specific permissions

## AuthProvider Enum

- `LOCAL`: User registered with email and password
- `GOOGLE`: User authenticated via Google OAuth
