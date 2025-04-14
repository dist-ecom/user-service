import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// Import types from Prisma client
import { Prisma, User } from '@prisma/client';

// Import enums to maintain compatibility
import { UserRole, AuthProvider } from './entities/user.enum';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password && createUserDto.provider?.toString() === 'LOCAL') {
      const salt = 10;
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    }
    
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        provider: createUserDto.provider as any,
      } as Prisma.UserCreateInput,
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    
    if (updateUserDto.password && updateUserDto.provider?.toString() === 'LOCAL') {
      const salt = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    
    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        provider: updateUserDto.provider as any,
      } as Prisma.UserUpdateInput,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findOrCreateSocialUser(
    email: string,
    name: string,
    provider: string,
    providerId: string,
  ): Promise<User> {
    const user = await this.findByEmail(email);

    if (!user) {
      return this.prisma.user.create({
        data: {
          email,
          name,
          provider: provider as any,
          providerId,
          role: 'USER' as any,
        },
      });
    }

    // Return existing user if provider and providerId match
    if (user.provider === provider && user.providerId === providerId) {
      return user;
    }

    // Update provider info if either provider or providerId don't match
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        provider: provider as any,
        providerId,
      },
    });
  }

  async createAdmin(createAdminDto: CreateAdminDto): Promise<User> {
    // Verify admin secret key
    const validAdminKey = this.configService.get<string>('ADMIN_REGISTRATION_KEY');
    if (!validAdminKey || createAdminDto.adminSecretKey !== validAdminKey) {
      throw new UnauthorizedException('Invalid admin registration key');
    }

    // Check if email domain is allowed for admin registration
    const allowedDomainsStr = this.configService.get<string>('ADMIN_ALLOWED_DOMAINS');
    if (allowedDomainsStr && allowedDomainsStr.trim() !== '') {
      const allowedDomains = allowedDomainsStr.split(',').map(domain => domain.trim());
      const emailDomain = createAdminDto.email.split('@')[1];
      if (!allowedDomains.includes(emailDomain)) {
        throw new UnauthorizedException('Email domain not allowed for admin registration');
      }
    }

    // Check if admin already exists
    const existingAdmin = await this.findByEmail(createAdminDto.email);
    if (existingAdmin) {
      throw new UnauthorizedException('Admin with this email already exists');
    }

    // Hash password
    const salt = 10;
    const hashedPassword = await bcrypt.hash(createAdminDto.password, salt);

    // Create admin user
    return this.prisma.user.create({
      data: {
        email: createAdminDto.email,
        name: createAdminDto.name,
        password: hashedPassword,
        role: 'ADMIN' as any,
        provider: 'LOCAL' as any,
      },
    });
  }
  
  async validatePassword(user: User, password: string): Promise<boolean> {
    if (user.provider !== 'LOCAL') {
      return false;
    }
    return await bcrypt.compare(password, user.password || '');
  }
}
