import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { UserRole, AuthProvider } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(AuthProvider)
  @IsOptional()
  provider?: AuthProvider;

  @IsOptional()
  providerId?: string;
}
