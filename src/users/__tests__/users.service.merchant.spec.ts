import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { AuthProvider, UserRole } from '@prisma/client';
import { CreateMerchantDto } from '../dto/create-merchant.dto';

// Mock the PrismaService
const mockPrismaService = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  merchant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

// Mock the MailService
const mockMailService = {
  sendVerificationEmail: jest.fn().mockImplementation(() => Promise.resolve()),
};

// Mock the ConfigService
const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    const config = {
      'ADMIN_REGISTRATION_KEY': 'test-admin-key',
      'ADMIN_ALLOWED_DOMAINS': 'example.com',
      'JWT_SECRET': 'test-secret',
    };
    return config[key];
  }),
};

describe('UsersService - Merchant Features', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);

    // Clear mock function calls before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMerchant', () => {
    it('should create a merchant user with merchant profile', async () => {
      // Setup merchant data
      const merchantDto: CreateMerchantDto = {
        name: 'Test Merchant',
        email: 'merchant@example.com',
        password: 'password123',
        provider: AuthProvider.LOCAL,
        storeName: 'Test Store',
        location: 'Test Location',
        storeNumber: 'TEST-123',
        phoneNumber: '+1-555-123-4567',
        description: 'Test store description',
      };

      // Setup mock user with merchant profile
      const mockUserWithProfile = {
        id: 'user-id',
        name: merchantDto.name,
        email: merchantDto.email,
        password: 'hashed_password',
        role: UserRole.MERCHANT,
        provider: AuthProvider.LOCAL,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        merchantProfile: {
          id: 'merchant-id',
          userId: 'user-id',
          storeName: merchantDto.storeName,
          location: merchantDto.location,
          storeNumber: merchantDto.storeNumber,
          phoneNumber: merchantDto.phoneNumber,
          description: merchantDto.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      };
      
      // Mock the create with nested merchant profile
      mockPrismaService.user.create.mockResolvedValue(mockUserWithProfile);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithProfile);

      // Call the service method
      const result = await service.createMerchant(merchantDto);

      // Check that user creation was called with correct data including merchant profile
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: merchantDto.name,
            email: merchantDto.email,
            role: UserRole.MERCHANT,
            isVerified: false,
            merchantProfile: {
              create: {
                storeName: merchantDto.storeName,
                location: merchantDto.location,
                storeNumber: merchantDto.storeNumber,
                phoneNumber: merchantDto.phoneNumber,
                description: merchantDto.description,
              }
            }
          })
        })
      );

      // Merchant profile is now created in a nested way, so this should not be called
      expect(mockPrismaService.merchant.create).not.toHaveBeenCalled();

      // Check that verification email was sent
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );

      // Check the result
      expect(result).toEqual(mockUserWithProfile);
    });

    it('should hash the password when creating merchant', async () => {
      // Setup merchant data with password
      const merchantDto: CreateMerchantDto = {
        name: 'Test Merchant',
        email: 'merchant@example.com',
        password: 'password123',
        provider: AuthProvider.LOCAL,
        storeName: 'Test Store',
        location: 'Test Location',
      };

      // Setup mock user with merchant profile
      const mockUserWithProfile = {
        id: 'user-id',
        name: merchantDto.name,
        email: merchantDto.email,
        password: 'hashed_password', // This will be a bcrypt hash in reality
        role: UserRole.MERCHANT,
        provider: AuthProvider.LOCAL,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        merchantProfile: {
          id: 'merchant-id',
          userId: 'user-id',
          storeName: merchantDto.storeName,
          location: merchantDto.location,
        }
      };

      // Mock the user creation and retrieval
      mockPrismaService.user.create.mockResolvedValue(mockUserWithProfile);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithProfile);

      // Call the service method
      await service.createMerchant(merchantDto);

      // Check that user creation included a hashed password (not the original)
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: expect.not.stringMatching('password123'),
          })
        })
      );
    });
  });

  describe('verifyUser', () => {
    it('should set isVerified flag to true', async () => {
      // Setup mock user
      const mockUser = {
        id: 'user-id',
        name: 'Test Merchant',
        email: 'merchant@example.com',
        role: UserRole.MERCHANT,
        isVerified: false,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      
      // Setup mock updated user
      const mockUpdatedUser = {
        ...mockUser,
        isVerified: true,
      };
      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      // Call the service method
      const result = await service.verifyUser('user-id');

      // Check that user was looked up
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });

      // Check that update was called correctly
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { isVerified: true },
      });

      // Check the result
      expect(result.isVerified).toBe(true);
    });
  });

  describe('checkVerificationRequirements', () => {
    it('should return true for admin users without checking verification status', async () => {
      // Setup mock admin user
      const mockAdminUser = {
        id: 'admin-id',
        role: UserRole.ADMIN,
        isVerified: false, // Even if not verified, admins bypass verification
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);

      // Call the service method
      const result = await service.checkVerificationRequirements('admin-id');

      // Admin should be allowed without verification check
      expect(result).toBe(true);
    });

    it('should check isVerified flag for merchant users', async () => {
      // Setup mock merchant user that is not verified
      const mockMerchantUser = {
        id: 'merchant-id',
        role: UserRole.MERCHANT,
        isVerified: false,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockMerchantUser);

      // Call the service method
      const result = await service.checkVerificationRequirements('merchant-id');

      // Merchant should not be verified
      expect(result).toBe(false);

      // Setup mock merchant user that is verified
      const mockVerifiedMerchant = {
        ...mockMerchantUser,
        isVerified: true,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockVerifiedMerchant);

      // Call the service method again
      const updatedResult = await service.checkVerificationRequirements('merchant-id');

      // Verified merchant should be allowed
      expect(updatedResult).toBe(true);
    });

    it('should return true for regular users (automatically verified)', async () => {
      // Setup mock regular user
      const mockRegularUser = {
        id: 'user-id',
        role: UserRole.USER,
        isVerified: true, // Regular users are auto-verified
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockRegularUser);

      // Call the service method
      const result = await service.checkVerificationRequirements('user-id');

      // Regular user should be verified
      expect(result).toBe(true);
    });
  });
}); 