import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Define the enum values as string literals
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email address of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'The password for the user account',
    required: false,
    minLength: 6
  })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: UserRole.USER, 
    description: 'The role assigned to the user',
    required: false
  })
  @IsEnum(UserRole)
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ 
    enum: AuthProvider, 
    example: AuthProvider.LOCAL, 
    description: 'The authentication provider (local or OAuth service)',
    required: false
  })
  @IsEnum(AuthProvider)
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({ 
    example: '123456789', 
    description: 'The ID from the OAuth provider if applicable',
    required: false 
  })
  @IsOptional()
  providerId?: string;
}
