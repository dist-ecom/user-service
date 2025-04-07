import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import {
  User,
  UserRole,
  AuthProvider,
} from '../src/users/entities/user.entity';
import { UsersService } from '../src/users/users.service';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let jwtService: JwtService;
  let testUser: User;
  let adminUser: User;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'user_service_test',
            entities: [User],
            synchronize: true,
            dropSchema: true,
          }),
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET') || 'test-secret',
            signOptions: {
              expiresIn: '1h',
            },
          }),
        }),
        AuthModule,
        UsersModule,
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    usersService = moduleFixture.get<UsersService>(UsersService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test users
    testUser = await usersService.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      provider: AuthProvider.LOCAL,
      role: UserRole.USER,
    });

    adminUser = await usersService.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      provider: AuthProvider.LOCAL,
      role: UserRole.ADMIN,
    });

    // Generate tokens
    userToken = jwtService.sign({
      email: testUser.email,
      sub: testUser.id,
      role: testUser.role,
    });

    adminToken = jwtService.sign({
      email: adminUser.email,
      sub: adminUser.id,
      role: adminUser.role,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('/auth/register (POST) - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('new@example.com');
      expect(response.body.user.role).toBe(UserRole.USER);
    });

    it('/auth/login (POST) - should login and return a token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('/auth/login (POST) - should reject invalid credentials', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('/auth/profile (GET) - should return user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
    });

    it('/auth/profile (GET) - should reject unauthenticated requests', async () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });
  });

  describe('Users', () => {
    it('/users (GET) - admin should get all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('/users (GET) - regular user should be forbidden', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('/users/:id (GET) - should get user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body.email).toBe(testUser.email);
    });

    it('/users/:id (PATCH) - should update user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Test User' })
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body.name).toBe('Updated Test User');
    });

    it('/users/:id (DELETE) - admin can delete users', async () => {
      // Create a temporary user to delete
      const tempUser = await usersService.create({
        name: 'Temp User',
        email: 'temp@example.com',
        password: 'password123',
        provider: AuthProvider.LOCAL,
        role: UserRole.USER,
      });

      return request(app.getHttpServer())
        .delete(`/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('/users/:id (DELETE) - regular user cannot delete users', async () => {
      return request(app.getHttpServer())
        .delete(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
