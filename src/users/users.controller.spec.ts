import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole, AuthProvider } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.USER,
    provider: AuthProvider.LOCAL,
    providerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue({
              ...mockUser,
              name: 'Updated Name',
            }),
            remove: jest.fn().mockResolvedValue(undefined),
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

      const result = await controller.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateUserDto,
      );

      expect(service.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updateUserDto,
      );
      expect(result).toEqual({
        ...mockUser,
        name: 'Updated Name',
      });
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
});
