import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, AuthProvider } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const mergedUser = this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(mergedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.delete(user.id);
  }

  async findOrCreateSocialUser(
    email: string,
    name: string,
    provider: AuthProvider,
    providerId: string,
  ): Promise<User> {
    const user = await this.findByEmail(email);

    if (!user) {
      const newUser = this.usersRepository.create({
        email,
        name,
        provider,
        providerId,
        role: UserRole.USER,
      });
      return this.usersRepository.save(newUser);
    }

    // Return existing user if provider and providerId match
    if (user.provider === provider && user.providerId === providerId) {
      return user;
    }

    // Update provider info if either provider or providerId don't match
    user.provider = provider;
    user.providerId = providerId;
    return this.usersRepository.save(user);
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

    // Create admin user
    const admin = this.usersRepository.create({
      ...createAdminDto,
      role: UserRole.ADMIN,
    });

    return this.usersRepository.save(admin);
  }
}
