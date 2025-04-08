import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole, AuthProvider } from './entities/user.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAdminDto } from './dto/create-admin.dto';

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

const mockAdmin = {
  ...mockUser,
  role: UserRole.ADMIN,
  email: 'admin@yourdomain.com',
} as User;

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            create: jest.fn().mockReturnValue(mockUser),
            save: jest.fn().mockResolvedValue(mockUser),
            delete: jest.fn().mockResolvedValue(undefined),
            merge: jest
              .fn()
              .mockImplementation((entity, dto) => ({ ...entity, ...dto })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'ADMIN_REGISTRATION_KEY':
                  return 'test-admin-key';
                case 'ADMIN_ALLOWED_DOMAINS':
                  return 'yourdomain.com,admin.domain.com';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const result = await service.findOne(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const result = await service.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const result = await service.create(createUserDto);
      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = {
        name: 'Updated Name',
      };

      const updatedUser = {
        ...mockUser,
        ...updateDto,
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
      } as User;

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'merge').mockReturnValueOnce(updatedUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(updatedUser);

      const result = await service.update(mockUser.id, updateDto);

      expect(result).toEqual(updatedUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(repository.merge).toHaveBeenCalledWith(mockUser, updateDto);
      expect(repository.save).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      await service.remove(mockUser.id);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(repository.delete).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOrCreateSocialUser', () => {
    it('should return existing user if found by email', async () => {
      const googleUser = {
        ...mockUser,
        provider: AuthProvider.GOOGLE,
        providerId: 'google123',
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
      } as User;
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(googleUser);
      jest.spyOn(repository, 'save').mockClear();

      const result = await service.findOrCreateSocialUser(
        mockUser.email,
        'Google User',
        AuthProvider.GOOGLE,
        'google123',
      );

      expect(result).toEqual(googleUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should create new user if not found by email', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      const result = await service.findOrCreateSocialUser(
        'new@example.com',
        'New Google User',
        AuthProvider.GOOGLE,
        'google456',
      );

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'New Google User',
        provider: AuthProvider.GOOGLE,
        providerId: 'google456',
        role: UserRole.USER,
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should update provider info if user exists with different provider', async () => {
      const localUser = {
        ...mockUser,
        provider: AuthProvider.LOCAL,
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
      } as User;
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(localUser);

      const result = await service.findOrCreateSocialUser(
        mockUser.email,
        mockUser.name,
        AuthProvider.GOOGLE,
        'google123',
      );

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('createAdmin', () => {
    const createAdminDto: CreateAdminDto = {
      name: 'Admin User',
      email: 'admin@yourdomain.com',
      password: 'StrongP@ss123',
      adminSecretKey: 'test-admin-key',
      provider: AuthProvider.LOCAL,
    };

    it('should create a new admin user with valid credentials', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(repository, 'create').mockReturnValueOnce(mockAdmin);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockAdmin);

      const result = await service.createAdmin(createAdminDto);

      expect(result).toEqual(mockAdmin);
      expect(result.role).toBe(UserRole.ADMIN);
      expect(repository.create).toHaveBeenCalledWith({
        ...createAdminDto,
        role: UserRole.ADMIN,
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with invalid admin key', async () => {
      const invalidDto = {
        ...createAdminDto,
        adminSecretKey: 'wrong-key',
      };

      await expect(service.createAdmin(invalidDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with disallowed email domain', async () => {
      const invalidDomainDto = {
        ...createAdminDto,
        email: 'admin@disallowed.com',
      };

      await expect(service.createAdmin(invalidDomainDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if admin email already exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockAdmin);

      await expect(service.createAdmin(createAdminDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should handle empty allowed domains list', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'ADMIN_ALLOWED_DOMAINS') return '';
        if (key === 'ADMIN_REGISTRATION_KEY') return 'test-admin-key';
        return null;
      });

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(repository, 'create').mockReturnValueOnce(mockAdmin);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockAdmin);

      const result = await service.createAdmin(createAdminDto);

      expect(result).toEqual(mockAdmin);
      expect(result.role).toBe(UserRole.ADMIN);
      expect(repository.create).toHaveBeenCalledWith({
        ...createAdminDto,
        role: UserRole.ADMIN,
      });
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
