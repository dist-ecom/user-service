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

describe('Email Verification (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let mailService: MailService;
  let userToken: string;
  let verificationToken: string;

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
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'verify-test@example.com',
            'merchant-verify@example.com',
          ],
        },
      },
    });

    // Create a test user
    const testUser = await usersService.create({
      name: 'Verification Test User',
      email: 'verify-test@example.com',
      password: 'password123',
      provider: AuthProvider.LOCAL,
      role: UserRole.USER,
    });

    // Generate a token for authentication
    userToken = jwtService.sign({
      email: testUser.email,
      sub: testUser.id,
      role: testUser.role,
    });

    // Get the verification token from the database
    const user = await prismaService.user.findUnique({
      where: { email: 'verify-test@example.com' },
    });
    
    verificationToken = user.emailVerifyToken;
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'verify-test@example.com',
            'merchant-verify@example.com',
          ],
        },
      },
    });
    await app.close();
  });

  describe('Email Verification', () => {
    it('/auth/verify-email/send (POST) - should send verification email', async () => {
      // Verification email is sent during user creation, so we can test the resend functionality
      await request(app.getHttpServer())
        .post('/auth/verify-email/send')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'verify-test@example.com' })
        .expect(200);

      // Check that the mail service was called
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('/auth/verify-email (GET) - should verify email with valid token', async () => {
      // Ensure verification token exists
      expect(verificationToken).toBeDefined();

      await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${verificationToken}`)
        .expect(200);

      // Check database to verify the user is now verified
      const updatedUser = await prismaService.user.findUnique({
        where: { email: 'verify-test@example.com' },
      });

      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerifyToken).toBeNull();
    });

    it('/auth/verify-email (GET) - should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify-email?token=invalid-token')
        .expect(400);
    });
  });

  describe('Merchant Email Verification', () => {
    let merchantId: string;
    let merchantToken: string;

    beforeAll(async () => {
      // Create a merchant user
      const createMerchantDto = {
        name: 'Merchant Test',
        email: 'merchant-verify@example.com',
        password: 'password123',
        provider: AuthProvider.LOCAL,
        storeName: 'Test Store',
        location: 'Test Location',
      };

      const merchant = await usersService.createMerchant(createMerchantDto);
      merchantId = merchant.id;

      // Generate a token for merchant authentication
      merchantToken = jwtService.sign({
        email: merchant.email,
        sub: merchant.id,
        role: merchant.role,
      });
    });

    it('should create merchant with isVerified=false and isEmailVerified=false', async () => {
      const merchant = await prismaService.user.findUnique({
        where: { id: merchantId },
        include: { merchantProfile: true },
      });

      expect(merchant.role).toBe(UserRole.MERCHANT);
      expect(merchant.isVerified).toBe(false);
      expect(merchant.isEmailVerified).toBe(false);
      expect(merchant.merchantProfile).toBeDefined();
    });

    it('should verify merchant email with token', async () => {
      // Get verification token for merchant
      const merchant = await prismaService.user.findUnique({
        where: { id: merchantId },
      });
      
      const merchantVerificationToken = merchant.emailVerifyToken;

      await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${merchantVerificationToken}`)
        .expect(200);

      // Check that email is verified but merchant account is still not verified
      const updatedMerchant = await prismaService.user.findUnique({
        where: { id: merchantId },
      });

      expect(updatedMerchant.isEmailVerified).toBe(true);
      expect(updatedMerchant.isVerified).toBe(false); // Merchant still needs admin approval
    });
  });
}); 