# Database Schema

This document provides details about the database structure used in the User Service.

## Entity Relationship Diagram

![Entity Relationship Diagram](diagrams/ERD.svg)

## Database Tables

### User Table

The User table stores all user data, including both locally registered users and those who authenticated via OAuth providers.

#### Columns

| Column      | Type      | Constraints      | Description                            |
|-------------|-----------|------------------|----------------------------------------|
| id          | UUID      | PK, NOT NULL     | Unique identifier for the user         |
| name        | VARCHAR   | NOT NULL         | User's full name                       |
| email       | VARCHAR   | UNIQUE, NOT NULL | User's email address                   |
| password    | VARCHAR   | NULLABLE         | Hashed password (null for OAuth users) |
| role        | ENUM      | NOT NULL         | User role (ADMIN, USER, MERCHANT)      |
| provider    | ENUM      | NOT NULL         | Auth provider (LOCAL, GOOGLE)          |
| providerId  | VARCHAR   | NULLABLE         | ID from OAuth provider                 |
| isVerified  | BOOLEAN   | NOT NULL         | Whether the user is verified           |
| createdAt   | TIMESTAMP | NOT NULL         | Record creation timestamp              |
| updatedAt   | TIMESTAMP | NOT NULL         | Record update timestamp                |

#### Indexes

| Name           | Columns | Type   | Description                  |
|----------------|---------|--------|------------------------------|
| PK_user        | id      | PRIMARY| Primary key                  |
| IDX_user_email | email   | UNIQUE | Unique index on email        |

### MerchantProfile Table

The MerchantProfile table stores additional information for users with the MERCHANT role.

#### Columns

| Column      | Type      | Constraints      | Description                            |
|-------------|-----------|------------------|----------------------------------------|
| id          | UUID      | PK, NOT NULL     | Unique identifier for the profile      |
| userId      | UUID      | FK, NOT NULL     | Reference to User table                |
| storeName   | VARCHAR   | NOT NULL         | Name of the merchant's store           |
| location    | VARCHAR   | NOT NULL         | Physical location of the store         |
| storeNumber | VARCHAR   | NULLABLE         | Store identifier number                |
| phoneNumber | VARCHAR   | NULLABLE         | Contact phone number                   |
| description | VARCHAR   | NULLABLE         | Store description                      |
| createdAt   | TIMESTAMP | NOT NULL         | Record creation timestamp              |
| updatedAt   | TIMESTAMP | NOT NULL         | Record update timestamp                |

#### Indexes

| Name                  | Columns | Type   | Description                       |
|-----------------------|---------|--------|-----------------------------------|
| PK_merchant_profile   | id      | PRIMARY| Primary key                       |
| FK_merchant_user      | userId  | FOREIGN| Foreign key to User table         |
| UQ_merchant_user      | userId  | UNIQUE | One-to-one relationship with User |

## TypeORM Configuration

The User Service uses TypeORM for database access. Below is the entity definition for the User model:

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
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

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => MerchantProfile, (profile) => profile.user, {
    cascade: true,
    eager: true
  })
  merchantProfile: MerchantProfile;

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

The entity definition for the MerchantProfile model:

```typescript
@Entity()
export class MerchantProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeName: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  storeNumber: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.merchantProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;
}
```

## Database Migrations Diagram

![Database Migrations Flow](diagrams/auth-flowchart-2.svg)

## Enums

### UserRole

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MERCHANT = 'MERCHANT'
}
```

### AuthProvider

```typescript
export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE'
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

The User Service has the following entity relationships:

- One-to-one relationship between User and MerchantProfile (for merchant users)

As the application grows, potential additional relationships could include:

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
  entities: [User, MerchantProfile],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
})
```

> **Warning**: The `synchronize: true` option automatically syncs entity definitions with the database schema. This is useful during development but should be disabled in production to prevent accidental data loss.

## Prisma Schema

If using Prisma instead of TypeORM, here's the equivalent schema:

```prisma
enum UserRole {
  ADMIN
  USER
  MERCHANT
}

enum AuthProvider {
  LOCAL
  GOOGLE
}

model User {
  id              String           @id @default(uuid())
  name            String
  email           String           @unique
  password        String?
  role            UserRole         @default(USER)
  provider        AuthProvider     @default(LOCAL)
  providerId      String?
  isVerified      Boolean          @default(false)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  merchantProfile MerchantProfile?
}

model MerchantProfile {
  id          String   @id @default(uuid())
  storeName   String
  location    String
  storeNumber String?
  phoneNumber String?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  userId      String   @unique
}
```
