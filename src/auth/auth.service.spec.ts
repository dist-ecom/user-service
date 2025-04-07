import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole, AuthProvider } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.USER,
    provider: AuthProvider.LOCAL,
    providerId: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn().mockImplementation(async () => true),
  } as unknown as User;

  const mockJwtToken = 'mock.jwt.token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn().mockResolvedValue(mockUser),
            findOrCreateSocialUser: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue(mockJwtToken),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user when credentials are valid', async () => {
      (mockUser.validatePassword as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      (mockUser.validatePassword as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return user info and access token', async () => {
      const result = await service.login(mockUser);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
        access_token: mockJwtToken,
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });
  });

  describe('validateOAuthLogin', () => {
    it('should validate Google OAuth login and return user with token', async () => {
      const profile = {
        id: 'google123',
        displayName: 'Google User',
        emails: [{ value: 'google@example.com' }],
      };

      const result = await service.validateOAuthLogin(
        profile,
        AuthProvider.GOOGLE,
      );

      expect(usersService.findOrCreateSocialUser).toHaveBeenCalledWith(
        'google@example.com',
        'Google User',
        AuthProvider.GOOGLE,
        'google123',
      );

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
        access_token: mockJwtToken,
      });
    });

    it('should throw UnauthorizedException when email is missing from profile', async () => {
      const profile = {
        id: 'google123',
        displayName: 'Google User',
        emails: [],
      };

      await expect(
        service.validateOAuthLogin(profile, AuthProvider.GOOGLE),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should use email prefix as name when displayName is missing', async () => {
      const profile = {
        id: 'google123',
        emails: [{ value: 'john.doe@example.com' }],
      };

      await service.validateOAuthLogin(profile, AuthProvider.GOOGLE);

      expect(usersService.findOrCreateSocialUser).toHaveBeenCalledWith(
        'john.doe@example.com',
        'john.doe',
        AuthProvider.GOOGLE,
        'google123',
      );
    });
  });
});
