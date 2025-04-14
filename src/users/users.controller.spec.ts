import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { User, UserRole, AuthProvider } from '@prisma/client';

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
} as User;

const mockAdmin = {
  ...mockUser,
  role: UserRole.ADMIN,
  email: 'admin@yourdomain.com',
} as User;

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            create: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            remove: jest.fn().mockResolvedValue(undefined),
            createAdmin: jest.fn().mockResolvedValue(mockAdmin),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const result = await controller.findOne(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = { name: 'Updated Name' };
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
      } as User;

      jest.spyOn(service, 'update').mockResolvedValueOnce(updatedUser);

      const result = await controller.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateUserDto,
      );

      expect(service.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const result = await controller.remove(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(service.remove).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).toBeUndefined();
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

    it('should create a new admin user', async () => {
      const result = await controller.createAdmin(createAdminDto);

      expect(result).toEqual(mockAdmin);
      expect(service.createAdmin).toHaveBeenCalledWith(createAdminDto);
    });

    it('should handle service errors appropriately', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'createAdmin').mockRejectedValueOnce(error);

      await expect(controller.createAdmin(createAdminDto)).rejects.toThrow(error);
    });
  });
});
