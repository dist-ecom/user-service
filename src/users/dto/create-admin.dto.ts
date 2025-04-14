import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  MinLength,
  Matches,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '@prisma/client';

export class CreateAdminDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the admin' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'admin@example.com', description: 'The email address of the admin' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'StrongP@ss123', 
    description: 'The password must be at least 8 characters long and contain uppercase, lowercase, number and special character',
    minLength: 8
  })
  @IsNotEmpty()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    }
  )
  password: string;

  @ApiProperty({ 
    example: 'ADMIN_SECRET_KEY', 
    description: 'The admin registration secret key'
  })
  @IsNotEmpty()
  @IsString()
  adminSecretKey: string;

  @ApiProperty({ 
    enum: AuthProvider, 
    example: AuthProvider.LOCAL, 
    description: 'The authentication provider',
    default: AuthProvider.LOCAL
  })
  @IsEnum(AuthProvider)
  provider: AuthProvider = AuthProvider.LOCAL;
} 