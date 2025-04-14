import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '@prisma/client';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Define the request interface with Prisma User type
interface RequestWithUser {
  user: User;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registration successful',
    schema: {
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' }
          }
        },
        access_token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() createUserDto: CreateUserDto) {
    // Ensure provider is set to local for manual registrations
    createUserDto.provider = 'LOCAL';
    const user = await this.usersService.create(createUserDto);
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' }
      },
      required: ['email', 'password']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' }
          }
        },
        access_token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login flow' })
  @ApiResponse({ status: 302, description: 'Redirect to Google authentication' })
  googleAuth() {
    // This route initiates the Google OAuth flow
    // The actual implementation is handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint() // This endpoint is not meant to be called directly via the Swagger UI
  googleAuthCallback(@Request() req: RequestWithUser) {
    // This route handles the Google OAuth callback
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the authenticated user profile'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Post('verify-email/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a verification email to the user' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Verification email sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendVerificationEmail(@Body('email') email: string) {
    await this.usersService.sendVerificationEmail(email);
    return { message: 'Verification email sent successfully' };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email with token' })
  @ApiQuery({ name: 'token', type: 'string', required: true })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Query('token') token: string) {
    await this.usersService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }
}
