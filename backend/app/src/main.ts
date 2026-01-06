import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Servidor corriendo en: http://localhost:${port}`);
  console.log(`📚 API Base: http://localhost:${port}/api/v1`);
  console.log(`\n🔐 Autenticación:`);
  console.log(`   POST /api/v1/auth/register`);
  console.log(`   POST /api/v1/auth/login`);
  console.log(`   GET  /api/v1/auth/profile 🔒`);
  console.log(`\n📄 Records:`);
  console.log(`   GET    /api/v1/records`);
  console.log(`   POST   /api/v1/records 🔒`);
  console.log(`   GET    /api/v1/records/:id`);
  console.log(`   PATCH  /api/v1/records/:id 🔒`);
  console.log(`   DELETE /api/v1/records/:id 🔒`);
  console.log(`\n📊 Stats:`);
  console.log(`   GET /api/v1/records/stats/summary`);
  console.log(`\n📑 PDF:`);
  console.log(`   GET  /api/v1/pdf/debug`);
  console.log(`   POST /api/v1/pdf/process 🔒`);
}
bootstrap();
