import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, AuthProvider } from '@prisma/client';
import { Merchant } from './merchant.entity';

@Entity()
export class User {
  @ApiProperty({ description: 'The unique identifier for the user', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'The name of the user', example: 'John Doe' })
  @Column({ nullable: true })
  name: string;

  @ApiProperty({ description: 'The email address of the user', example: 'john@example.com' })
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @ApiProperty({ description: 'The role of the user', enum: UserRole, example: UserRole.USER })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ description: 'The authentication provider', enum: AuthProvider, example: AuthProvider.LOCAL })
  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @ApiProperty({ description: 'The ID from the provider if using OAuth', example: '123456789', required: false })
  @Column({ nullable: true })
  providerId: string;

  @ApiProperty({ description: 'Whether the user is verified', example: false })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Whether the email is verified', example: false })
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Email verification token', required: false })
  @Column({ nullable: true, unique: true })
  emailVerifyToken: string;

  @ApiProperty({ description: 'Email verification token expiry date', required: false })
  @Column({ nullable: true })
  emailVerifyExpires: Date;

  @ApiProperty({ description: 'The timestamp when the user was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The timestamp when the user was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Merchant profile for this user if they are a merchant', required: false })
  @OneToOne(() => Merchant, merchant => merchant.user, { nullable: true })
  merchantProfile: Merchant;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password && this.provider === AuthProvider.LOCAL) {
      const salt = 10;
      this.password = await (
        bcrypt.hash as (
          data: string,
          saltOrRounds: string | number,
        ) => Promise<string>
      )(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (this.provider !== AuthProvider.LOCAL) {
      return false;
    }
    return await (
      bcrypt.compare as (data: string, encrypted: string) => Promise<boolean>
    )(password, this.password);
  }
}
