import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity()
export class Merchant {
  @ApiProperty({ description: 'The unique identifier for the merchant profile', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'The name of the store', example: 'My Awesome Store' })
  @Column()
  storeName: string;

  @ApiProperty({ description: 'The location of the store', example: '123 Main St, City, Country' })
  @Column()
  location: string;

  @ApiProperty({ description: 'Store number or identifier', example: 'A-123', required: false })
  @Column({ nullable: true })
  storeNumber: string;

  @ApiProperty({ description: 'Store contact number', example: '+1-555-123-4567', required: false })
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty({ description: 'Store description', example: 'We sell high-quality products', required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'The timestamp when the merchant profile was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The timestamp when the merchant profile was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'The user ID this merchant profile belongs to' })
  @Column()
  userId: string;

  @OneToOne(() => User, user => user.merchantProfile)
  @JoinColumn({ name: 'userId' })
  user: User;
} 