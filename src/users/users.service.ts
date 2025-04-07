import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, AuthProvider } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
}
