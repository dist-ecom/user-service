import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // In production, use actual SMTP config from environment variables
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST'),
        port: this.configService.get<number>('MAIL_PORT'),
        secure: this.configService.get<boolean>('MAIL_SECURE', false),
        auth: {
          user: this.configService.get<string>('MAIL_USER'),
          pass: this.configService.get<string>('MAIL_PASSWORD'),
        },
      });
    } else {
      // For development - create a test account using Ethereal
      void this.setupTestTransporter();
    }
  }

  private async setupTestTransporter(): Promise<void> {
    try {
      // Create a test account at ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      
      // Create a transporter using the test account
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      this.logger.log('Test email account created with Ethereal');
    } catch (error) {
      this.logger.error('Failed to create test email account', error.stack);
      
      // Fallback to a mock transporter
      this.transporter = {
        sendMail: (mailOptions: nodemailer.SendMailOptions) => {
          return new Promise((resolve) => {
            this.logger.debug('Email would be sent in production:');
            this.logger.debug(`To: ${mailOptions.to}`);
            this.logger.debug(`Subject: ${mailOptions.subject}`);
            this.logger.debug(`Text: ${mailOptions.text}`);
            this.logger.debug(`HTML: ${mailOptions.html}`);
            resolve({ messageId: 'mock-id' });
          });
        },
      } as unknown as nodemailer.Transporter;
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    try {
      // Load the template
      const templatePath = path.join(process.cwd(), 'src/mail/templates/email-verification.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = Handlebars.compile(templateSource);
      const html = template({ name: name || 'User', verificationUrl });

      // Send the email
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', '"No Reply" <noreply@example.com>'),
        to: email,
        subject: 'Please verify your email address',
        text: `Hello ${name || 'User'}, please verify your email by clicking this link: ${verificationUrl}`,
        html,
      });

      this.logger.log(`Verification email sent to ${email}`);
      
      // If using ethereal, log the preview URL
      if (process.env.NODE_ENV !== 'production' && info.messageId) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.debug(`Preview URL: ${previewUrl}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error.stack);
      throw new Error('Failed to send verification email');
    }
  }
} 