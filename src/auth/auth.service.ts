import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, AuthProvider } from '../users/entities/user.entity';

interface OAuthUser {
  emails?: { value: string }[];
  displayName?: string;
  id: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const token = await Promise.resolve(this.jwtService.sign(payload));

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token: token,
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
