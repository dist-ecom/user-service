import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';
import { AuthProvider, UserRole } from '@prisma/client';
import { MailService } from '../src/mail/mail.service';

// Mock the mail service to avoid sending actual emails during tests
jest.mock('../src/mail/mail.service');

describe('Merchant Features (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let mailService: MailService;
  let adminToken: string;
  let userToken: string;
  let merchantToken: string;
  let merchantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
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
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    mailService = moduleFixture.get<MailService>(MailService);

    // Mock the sendVerificationEmail method
    jest.spyOn(mailService, 'sendVerificationEmail').mockImplementation(() => Promise.resolve());

    // Clean up the database before tests
    await prismaService.merchant.deleteMany({
      where: {
        user: {
          email: {
            in: [
              'merchant-test@example.com',
              'merchant-update@example.com',
            ],
          },
        },
      },
    });
    
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'admin-test@example.com',
            'user-test@example.com',
            'merchant-test@example.com',
            'merchant-update@example.com',
          ],
        },
      },
    });

    // Create test users
    // 1. Admin user
    const adminUser = await usersService.createAdmin({
      name: 'Admin Test',
      email: 'admin-test@example.com',
      password: 'password123',
      adminSecretKey: process.env.ADMIN_REGISTRATION_KEY || 'test-admin-key',
    });

    // 2. Regular user
    const regularUser = await usersService.create({
      name: 'User Test',
      email: 'user-test@example.com',
      password: 'password123',
      provider: AuthProvider.LOCAL,
      role: UserRole.USER,
    });

    // Generate tokens
    adminToken = jwtService.sign({
      email: adminUser.email,
      sub: adminUser.id,
      role: adminUser.role,
    });

    userToken = jwtService.sign({
      email: regularUser.email,
      sub: regularUser.id,
      role: regularUser.role,
    });
  });

  afterAll(async () => {
    await prismaService.merchant.deleteMany({
      where: {
        user: {
          email: {
            in: [
              'merchant-test@example.com',
              'merchant-update@example.com',
            ],
          },
        },
      },
    });
    
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'admin-test@example.com',
            'user-test@example.com',
            'merchant-test@example.com',
            'merchant-update@example.com',
          ],
        },
      },
    });
    
    await app.close();
  });

  describe('Merchant Registration and Management', () => {
    it('should register a new merchant', async () => {
      const merchantData = {
        name: 'Merchant Test',
        email: 'merchant-test@example.com',
        password: 'password123',
        storeName: 'Test Store',
        location: '123 Test St, Testville',
        storeNumber: 'TEST-1234',
        phoneNumber: '+1-555-123-4567',
        description: 'Test store for e2e tests',
      };

      const response = await request(app.getHttpServer())
        .post('/users/merchants')
        .send(merchantData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(merchantData.email);
      expect(response.body.user.role).toBe(UserRole.MERCHANT);
      expect(response.body.user.isVerified).toBe(false);
      expect(response.body.user.isEmailVerified).toBe(false);
      expect(response.body.user.merchantProfile).toHaveProperty('id');
      expect(response.body.user.merchantProfile.storeName).toBe(merchantData.storeName);
      
      // Save the merchant ID for later tests
      merchantId = response.body.user.id;
      
      // Generate a merchant token for authenticated tests
      merchantToken = jwtService.sign({
        email: response.body.user.email,
        sub: response.body.user.id,
        role: response.body.user.role,
      });
    });

    it('should get merchant profile by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/merchants/${merchantId}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', merchantId);
      expect(response.body.role).toBe(UserRole.MERCHANT);
      expect(response.body).toHaveProperty('merchantProfile');
      expect(response.body.merchantProfile.storeName).toBe('Test Store');
    });

    it('should allow admin to verify a merchant', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/merchants/${merchantId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', merchantId);
      expect(response.body.isVerified).toBe(true);
      
      // Check the database was updated
      const merchant = await prismaService.user.findUnique({
        where: { id: merchantId },
      });
      
      expect(merchant.isVerified).toBe(true);
    });

    it('should not allow regular user to verify a merchant', async () => {
      await request(app.getHttpServer())
        .patch(`/users/merchants/${merchantId}/verify`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should update merchant profile', async () => {
      const updateData = {
        storeName: 'Updated Test Store',
        description: 'Updated store description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/merchants/${merchantId}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.merchantProfile.storeName).toBe(updateData.storeName);
      expect(response.body.merchantProfile.description).toBe(updateData.description);
    });

    it('should list all merchants (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(m => m.email === 'merchant-test@example.com')).toBe(true);
    });

    it('should not allow regular users to list all merchants', async () => {
      await request(app.getHttpServer())
        .get('/users/merchants')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
}); 