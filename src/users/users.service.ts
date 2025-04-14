import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

// Import types from Prisma client
import { Prisma, User, UserRole, AuthProvider } from '@prisma/client';
import { CreateMerchantDto } from './dto/create-merchant.dto';

// Define a type alias for User with merchantProfile
type UserWithProfile = User & {
  merchantProfile?: unknown;
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password && createUserDto.provider === AuthProvider.LOCAL) {
      const salt = 10;
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    }
    
    // Set verification status based on role
    let isVerified = false;
    let isEmailVerified = false;
    
    if (createUserDto.role === UserRole.ADMIN) {
      // Admins are automatically verified and don't need email verification
      isVerified = true;
      isEmailVerified = true;
    } else {
      // Regular users and merchants require verification
      isVerified = createUserDto.role === UserRole.USER; // Regular users are auto-verified for account
      isEmailVerified = false; // All non-admin users need email verification
    }
    
    // Create the user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto as unknown as Prisma.UserCreateInput,
        isVerified,
        isEmailVerified,
      },
    });
    
    // Send verification email for non-admin users
    if (createUserDto.role !== UserRole.ADMIN) {
      await this.sendVerificationEmail(user.email);
    }
    
    return user;
  }

  async findAll(): Promise<UserWithProfile[]> {
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
        isEmailVerified: true, // Admins don't need email verification
      },
    });
  }

  // Method to verify a user
  async verifyUser(id: string): Promise<User> {
    await this.findOne(id);
    
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

  async sendVerificationEmail(email: string): Promise<void> {
    const userToVerify = await this.findByEmail(email);
    if (!userToVerify) {
      throw new NotFoundException('User not found');
    }

    // Generate token and expiration date (24 hours)
    const token = randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    // Update user with verification token details
    await this.prisma.user.update({
      where: { id: userToVerify.id },
      data: {
        emailVerifyToken: token,
        emailVerifyExpires: tokenExpires,
      },
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(userToVerify.email, userToVerify.name || 'User', token);
  }

  async verifyEmail(token: string): Promise<void> {
    // Find user with this token
    const user = await this.prisma.user.findFirst({
      where: { 
        emailVerifyToken: token,
        emailVerifyExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: null,
        emailVerifyExpires: null,
        isEmailVerified: true,
      },
    });
  }

  // New method to create a merchant
  async createMerchant(createMerchantDto: CreateMerchantDto): Promise<UserWithProfile> {
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
    
    // Create the user
    const createdUser = await this.prisma.user.create({
      data: {
        ...userData as unknown as Prisma.UserCreateInput,
        role: UserRole.MERCHANT,
        isVerified: false, // Merchants require verification
        merchantProfile: {
          create: {
            storeName,
            location,
            storeNumber,
            phoneNumber,
            description,
          }
        }
      }
    });
    
    // Send verification email
    await this.sendVerificationEmail(createdUser.email);
    
    // Return user with the merchant profile
    return this.prisma.user.findUnique({
      where: { id: createdUser.id },
      include: { merchantProfile: true },
    }) as Promise<UserWithProfile>;
  }
}
