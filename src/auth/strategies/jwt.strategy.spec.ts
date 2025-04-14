import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { User, UserRole, AuthProvider } from '@prisma/client';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

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
    hashPassword: async () => {},
    validatePassword: async () => true,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-jwt-secret'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data from payload', async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(null as unknown as User);

      const payload = {
        sub: 'non-existent-id',
        email: 'test@example.com',
        role: UserRole.USER,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
