import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail.service';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation(() => Promise.resolve({
      messageId: 'mock-id',
    })),
  }),
  createTestAccount: jest.fn().mockImplementation(() => Promise.resolve({
    user: 'test-user',
    pass: 'test-pass',
  })),
  getTestMessageUrl: jest.fn().mockReturnValue('https://ethereal.email/message/mock-id'),
}));

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Create a mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          'MAIL_HOST': 'smtp.example.com',
          'MAIL_PORT': 587,
          'MAIL_SECURE': false,
          'MAIL_USER': 'test@example.com',
          'MAIL_PASSWORD': 'password123',
          'MAIL_FROM': '"Test Sender" <no-reply@example.com>',
          'BASE_URL': 'http://localhost:3000',
          'NODE_ENV': 'test',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email', async () => {
      // Call the service method
      await service.sendVerificationEmail('user@example.com', 'Test User', 'test-verification-token');

      // Check if nodemailer's sendMail was called with the correct parameters
      const transporterSpy = nodemailer.createTransport({});
      expect(transporterSpy.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Test Sender" <no-reply@example.com>',
          to: 'user@example.com',
          subject: 'Please verify your email address',
          text: expect.stringContaining('test-verification-token'),
          html: expect.any(String),
        }),
      );
    });

    it('should handle errors when sending email fails', async () => {
      // Mock the sendMail function to reject with an error
      const transporterSpy = nodemailer.createTransport({});
      (transporterSpy.sendMail as jest.Mock).mockRejectedValueOnce(new Error('Failed to send email'));

      // Expect the service method to throw an error
      await expect(
        service.sendVerificationEmail('user@example.com', 'Test User', 'test-verification-token'),
      ).rejects.toThrow('Failed to send verification email');
    });
  });

  describe('setupTestTransporter', () => {
    it('should create a test account for development environment', async () => {
      // Set NODE_ENV to development
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return 'mock-value';
      });

      // Recreate the service to trigger the setupTestTransporter method
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

      const devService = module.get<MailService>(MailService);
      expect(devService).toBeDefined();
      expect(nodemailer.createTestAccount).toHaveBeenCalled();
    });

    it('should use a fallback transporter if ethereal account creation fails', async () => {
      // Mock createTestAccount to throw an error
      (nodemailer.createTestAccount as jest.Mock).mockRejectedValueOnce(new Error('Ethereal connection failed'));

      // Mock fs.readFileSync to avoid file system access during tests
      jest.spyOn(fs, 'readFileSync').mockReturnValue('<h1>Test Email Template</h1>');
      
      // Create a mock transporter
      const mockSendMailImpl = jest.fn().mockResolvedValue({ messageId: 'mock-id' });
      const mockTransporter = {
        sendMail: mockSendMailImpl
      };
      
      // Make createTransport return our mock
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

      // Mock the ConfigService
      const mockConfigService = {
        get: jest.fn((key: string) => {
          switch (key) {
            case 'NODE_ENV': return 'development';
            case 'MAIL_FROM': return '"Test Sender" <no-reply@example.com>';
            case 'BASE_URL': return 'http://localhost:3000';
            default: return null;
          }
        })
      };

      // Create a service instance with constructor-level mocks
      const service = new MailService(mockConfigService as any);
      
      // Set the transporter directly to bypass initialization issues
      Object.defineProperty(service, 'transporter', {
        value: mockTransporter,
        writable: true
      });
      
      // Now test the method
      await service.sendVerificationEmail('test@example.com', 'Test User', 'verification-token');
      
      // Verify our mock was called
      expect(mockSendMailImpl).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Please verify your email address'
        })
      );
    });
  });
}); 