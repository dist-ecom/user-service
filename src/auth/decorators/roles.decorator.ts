import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
