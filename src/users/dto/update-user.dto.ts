import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'John Doe', description: 'The updated name of the user', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'john@example.com', description: 'The updated email address of the user', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'newpassword123', description: 'The updated password for the user account', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: UserRole.USER, 
    description: 'The updated role for the user', 
    required: false 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
