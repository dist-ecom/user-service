import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// Import types from Prisma client
import { Prisma, User, UserRole, AuthProvider } from '@prisma/client';
import type { User as UserWithProfile } from '@prisma/client';
import { CreateMerchantDto } from './dto/create-merchant.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password && createUserDto.provider === AuthProvider.LOCAL) {
      const salt = 10;
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    }
    
    // Set verification status based on role
    let isVerified = false;
    if (createUserDto.role === UserRole.ADMIN) {
      isVerified = true; // Admins are automatically verified
    } else if (createUserDto.role === UserRole.MERCHANT) {
      isVerified = false; // Merchants require verification
    } else {
      isVerified = true; // Regular users are auto-verified
    }
    
    return this.prisma.user.create({
      data: {
        ...createUserDto as unknown as Prisma.UserCreateInput,
        isVerified,
      },
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.user.findMany({
      include: { merchantProfile: true },
    });
  }

  async findOne(id: string, includeMerchantProfile: boolean = false): Promise<UserWithProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: includeMerchantProfile ? { merchantProfile: true } : undefined,
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
    
    if (updateUserDto.password && updateUserDto.provider === AuthProvider.LOCAL) {
      const salt = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto as unknown as Prisma.UserUpdateInput,
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
    provider: AuthProvider,
    providerId: string,
  ): Promise<User> {
    const user = await this.findByEmail(email);

    if (!user) {
      return this.prisma.user.create({
        data: {
          email,
          name,
          provider,
          providerId,
          role: UserRole.USER,
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
        provider,
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
        role: UserRole.ADMIN,
        provider: AuthProvider.LOCAL,
        isVerified: true, // Admins are automatically verified
      },
    });
  }

  // New method to create a merchant
  async createMerchant(createMerchantDto: CreateMerchantDto): Promise<any> {
    if (createMerchantDto.password && createMerchantDto.provider === AuthProvider.LOCAL) {
      const salt = 10;
      createMerchantDto.password = await bcrypt.hash(createMerchantDto.password, salt);
    }
    
    const { 
      storeName, 
      location, 
      storeNumber, 
      phoneNumber, 
      description,
      ...userData 
    } = createMerchantDto;
    
    // Create the user and merchant profile in a transaction
    const user = await this.prisma.user.create({
      data: {
        ...userData as any,
        role: UserRole.MERCHANT,
        isVerified: false, // Merchants require verification
      },
    });
      
    // Create the merchant profile
    await this.prisma.merchant.create({
      data: {
        storeName,
        location,
        storeNumber,
        phoneNumber,
        description,
        userId: user.id,
      },
    });
      
    // Return user with the merchant profile
    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: { merchantProfile: true },
    });
  }

  // Method to verify a user
  async verifyUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    
    return this.prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
      },
    });
  }
  
  // Method to check verification status based on role
  async checkVerificationRequirements(userId: string): Promise<boolean> {
    const user = await this.findOne(userId);
    
    if (user.role === UserRole.ADMIN) {
      return true; // Admins don't need verification
    } else if (user.role === UserRole.MERCHANT) {
      return user.isVerified; // Merchants need to be verified
    } else {
      return true; // Regular users don't need verification
    }
  }
  
  async validatePassword(user: User, password: string): Promise<boolean> {
    if (user.provider !== AuthProvider.LOCAL) {
      return false;
    }
    return await bcrypt.compare(password, user.password || '');
  }
}
