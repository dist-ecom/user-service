import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '@prisma/client';

export class CreateMerchantDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the merchant' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'merchant@example.com', description: 'The email address of the merchant' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'The password for the merchant account',
    minLength: 6
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    enum: AuthProvider, 
    example: AuthProvider.LOCAL, 
    description: 'The authentication provider (local or OAuth service)',
    required: false
  })
  @IsOptional()
  provider?: AuthProvider;

  @ApiProperty({ 
    example: '123456789', 
    description: 'The ID from the OAuth provider if applicable',
    required: false 
  })
  @IsOptional()
  providerId?: string;
  
  // Merchant profile data
  @ApiProperty({ example: 'My Awesome Store', description: 'The name of the store' })
  @IsNotEmpty()
  @IsString()
  storeName: string;
  
  @ApiProperty({ example: '123 Main St, City, Country', description: 'The location of the store' })
  @IsNotEmpty()
  @IsString()
  location: string;
  
  @ApiProperty({ example: 'A-123', description: 'Store number or identifier', required: false })
  @IsOptional()
  @IsString()
  storeNumber?: string;
  
  @ApiProperty({ example: '+1-555-123-4567', description: 'Store contact number', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
  
  @ApiProperty({ example: 'We sell high-quality products', description: 'Store description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
} 