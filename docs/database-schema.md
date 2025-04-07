# Database Schema

This document provides details about the database structure used in the User Service.

## Entity Relationship Diagram

```
┌────────────────────┐
│       User         │
├────────────────────┤
│ id: UUID (PK)      │
│ name: String       │
│ email: String      │
│ password: String   │
│ role: Enum         │
│ provider: Enum     │
│ providerId: String │
│ createdAt: Date    │
│ updatedAt: Date    │
└────────────────────┘
```

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
| role        | ENUM      | NOT NULL         | User role (admin, user)                |
| provider    | ENUM      | NOT NULL         | Auth provider (local, google)          |
| providerId  | VARCHAR   | NULLABLE         | ID from OAuth provider                 |
| createdAt   | TIMESTAMP | NOT NULL         | Record creation timestamp              |
| updatedAt   | TIMESTAMP | NOT NULL         | Record update timestamp                |

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
  USER = 'user'
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