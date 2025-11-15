import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(cookieParser())

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Permitir frontend local
    credentials: true, // Permitir cookies si es necesario
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
