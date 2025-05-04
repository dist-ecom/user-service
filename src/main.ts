import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  
  // Get application config
  const port = configService.get<number>('PORT') || 3000;
  const serviceName = configService.get<string>('SERVICE_NAME') || 'user-service';
  const serviceDescription = configService.get<string>('SERVICE_DESCRIPTION') || 'User Management and Authentication Service';
  const serviceRegistryUrl = configService.get<string>('SERVICE_REGISTRY_URL');

  // Enable CORS
  app.enableCors();

  // Apply validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('API documentation for the ecommerce platform user service')
    .setVersion('1.0')
    .addTag('users')
    .addTag('auth')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Save Swagger JSON to file
  fs.writeFileSync('./api-docs.json', JSON.stringify(document, null, 2));

  // Start the server
  await app.listen(port);
  
  // Register with service registry if configured
  if (serviceRegistryUrl) {
    try {
      const httpService = app.get(HttpService);
      
      // Get hostname and IP
      const hostname = os.hostname();
      const interfaces = os.networkInterfaces();
      let ipAddress = '';
      
      // Find a suitable IP address (prefer non-internal IPv4)
      Object.keys(interfaces).forEach((interfaceName) => {
        const networkInterface = interfaces[interfaceName];
        if (networkInterface !== undefined) {
          networkInterface.forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
              ipAddress = iface.address;
            }
          });
        }
      });
      
      // If no external IP found, use localhost
      if (!ipAddress) {
        ipAddress = '127.0.0.1';
      }
      
      // Use IP address for local development, hostname for production
      const serviceAddress = process.env.NODE_ENV === 'production' ? hostname : ipAddress;
      
      // Create service ID (same format that worked in our test)
      const serviceId = `${serviceName}-${hostname}-${port}`;
      
      // Simple Consul registration payload that works with Consul API
      const consulRegistration = {
        ID: serviceId,
        Name: serviceName,
        Address: serviceAddress,
        Port: Number(port),
        Check: {
          HTTP: `http://${serviceAddress}:${port}/health`,
          Interval: '15s'
        },
        Tags: ['api', 'user-service', 'nestjs'],
        Meta: {
          Description: serviceDescription,
        },
      };
      
      logger.log(`Registering service with Consul at: ${serviceRegistryUrl}`);
      logger.log(`Using service ID: ${serviceId}`);
      logger.log(`Address: ${serviceAddress}, Port: ${port}`);
      
      try {
        // First verify Consul is reachable
        const statusResponse = await firstValueFrom(
          httpService.get(`${serviceRegistryUrl}/v1/status/leader`)
        );
        logger.log(`Consul status check OK: ${statusResponse.status}`);
        
        // Then register service
        const response = await firstValueFrom(
          httpService.put(`${serviceRegistryUrl}/v1/agent/service/register`, consulRegistration)
        );
        
        logger.log(`Service registered successfully with status: ${response.status}`);
      } catch (regError: any) {
        logger.error(`Consul error: ${regError.message}`);
        if (regError.response) {
          logger.error(`Status: ${regError.response.status}`);
          logger.error(`Data: ${JSON.stringify(regError.response.data || {})}`);
        } else if (regError.request) {
          logger.error('No response from Consul - service may not be running');
        }
        throw regError;
      }
      
      // Setup deregistration on app shutdown
      app.enableShutdownHooks();
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        try {
          logger.log(`Deregistering service with ID: ${serviceId}`);
          await firstValueFrom(
            httpService.put(`${serviceRegistryUrl}/v1/agent/service/deregister/${serviceId}`)
          );
          logger.log('Service deregistered from Consul');
          process.exit(0);
        } catch (error: any) {
          logger.error(`Failed to deregister service: ${error.message}`);
          process.exit(1);
        }
      });
    } catch (error: any) {
      logger.error(`Consul registration failed: ${error.message}`);
    }
  }
  
  logger.log(`Application is running on: http://localhost:${port}`);
}

// Fix floating promise error
void bootstrap();
