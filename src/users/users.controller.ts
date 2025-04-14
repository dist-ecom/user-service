import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.enum';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateMerchantDto } from './dto/create-merchant.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'The user has been successfully created.',
    schema: {
      properties: {
        id: { type: 'string', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', example: 'user' },
        provider: { type: 'string', example: 'local' },
        providerId: { type: 'string', example: null },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('admin')
  @ApiOperation({ summary: 'Register a new admin user' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({ 
    status: 201, 
    description: 'The admin has been successfully created.',
    schema: {
      properties: {
        id: { type: 'string', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        name: { type: 'string', example: 'Admin User' },
        email: { type: 'string', example: 'admin@example.com' },
        role: { type: 'string', example: 'admin' },
        provider: { type: 'string', example: 'local' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid admin registration key.' })
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.usersService.createAdmin(createAdminDto);
  }

  @Post('merchant')
  @ApiOperation({ summary: 'Register a new merchant' })
  @ApiBody({ type: CreateMerchantDto })
  @ApiResponse({ 
    status: 201, 
    description: 'The merchant has been successfully created.',
    schema: {
      properties: {
        id: { type: 'string', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        name: { type: 'string', example: 'Merchant Store' },
        email: { type: 'string', example: 'merchant@example.com' },
        role: { type: 'string', example: 'merchant' },
        provider: { type: 'string', example: 'local' },
        isVerified: { type: 'boolean', example: false },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
        merchantProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' },
            storeName: { type: 'string', example: 'My Awesome Store' },
            location: { type: 'string', example: '123 Main St, City, Country' },
            storeNumber: { type: 'string', example: 'A-123' },
            phoneNumber: { type: 'string', example: '+1-555-123-4567' },
            description: { type: 'string', example: 'We sell high-quality products' },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  createMerchant(@Body() createMerchantDto: CreateMerchantDto) {
    return this.usersService.createMerchant(createMerchantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns an array of all users.',
    schema: {
      type: 'array',
      items: {
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          provider: { type: 'string' },
          providerId: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the user with the specified ID.',
    schema: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        provider: { type: 'string' },
        providerId: { type: 'string' },
        isVerified: { type: 'boolean' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        merchantProfile: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string' },
            storeName: { type: 'string' },
            location: { type: 'string' },
            storeNumber: { type: 'string', nullable: true },
            phoneNumber: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id, true);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'The user has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiResponse({ status: 200, description: 'The user has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify a user (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID to verify', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiResponse({ status: 200, description: 'The user has been successfully verified.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  verifyUser(@Param('id') id: string) {
    return this.usersService.verifyUser(id);
  }

  @Get('verification/status/:id')
  @ApiOperation({ summary: 'Check user verification status' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns whether the user meets verification requirements',
    schema: {
      properties: {
        isVerified: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  checkVerificationStatus(@Param('id') id: string) {
    return this.usersService.checkVerificationRequirements(id)
      .then(isVerified => ({ isVerified }));
  }
}
