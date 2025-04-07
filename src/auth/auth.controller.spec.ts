import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole, AuthProvider } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
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
    hashPassword: jest.fn(),
    validatePassword: jest.fn().mockResolvedValue(true),
  } as User;

  const mockAuthResponse = {
    user: {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
    },
    access_token: 'mock.jwt.token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(mockAuthResponse),
            validateOAuthLogin: jest.fn().mockResolvedValue(mockAuthResponse),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should create a user and return auth response', async () => {
      const createUserDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const result = await controller.register(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        provider: AuthProvider.LOCAL,
      });

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should return auth response', async () => {
      const req = { user: mockUser };

      const result = await controller.login(req);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('googleAuth', () => {
    it('should exist but not return anything', () => {
      expect(controller.googleAuth()).toBeUndefined();
    });
  });

  describe('googleAuthCallback', () => {
    it('should return the user from the request', () => {
      const req = { user: mockUser };

      const result = controller.googleAuthCallback(req);

      expect(result).toEqual(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return the user from the request', () => {
      const req = { user: mockUser };

      const result = controller.getProfile(req);

      expect(result).toEqual(mockUser);
    });
  });
});
