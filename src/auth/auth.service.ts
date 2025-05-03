import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, AuthProvider } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

interface OAuthUser {
  emails?: { value: string }[];
  displayName?: string;
  id: string;
}

interface ServiceKeys {
  [service: string]: string | undefined;
}

@Injectable()
export class AuthService {
  private serviceKeys: ServiceKeys;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Initialize service-specific keys
    this.serviceKeys = {
      'order-service': this.configService.get<string>('JWT_ORDER_SERVICE_KEY'),
      'product-service': this.configService.get<string>('JWT_PRODUCT_SERVICE_KEY'),
      'payment-service': this.configService.get<string>('JWT_PAYMENT_SERVICE_KEY'),
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await this.usersService.validatePassword(user, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    // Generate the main access token
    const token = await Promise.resolve(this.jwtService.sign(payload));
    
    // Generate service-specific tokens if needed
    const serviceTokens = {};
    
    // Only generate service tokens for services that have configured keys
    Object.keys(this.serviceKeys).forEach(service => {
      if (this.serviceKeys[service]) {
        serviceTokens[service] = this.jwtService.sign(payload, {
          secret: this.serviceKeys[service],
        });
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token: token,
      service_tokens: serviceTokens,
    };
  }

  async validateOAuthLogin(profile: OAuthUser, provider: AuthProvider) {
    const { emails, displayName, id } = profile;

    if (!emails || emails.length === 0) {
      throw new UnauthorizedException('Email is required for authentication');
    }

    const email = emails[0].value;
    const name = displayName || (email ? email.split('@')[0] : 'User');

    const user = await this.usersService.findOrCreateSocialUser(
      email,
      name,
      provider,
      id,
    );

    return await this.login(user);
  }
}
