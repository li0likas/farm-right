import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
const serveStatic = require('serve-static');
const path = require('path');


async function bootstrap() {
  

  const server = express();
  server.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const config = new DocumentBuilder()
    .setTitle('Farm API')
    .setDescription('The farm API description')
    .setVersion('1.0')
    .addTag('farm')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }))
  await app.listen(3333);

  process.on('SIGINT', async () => {
    console.log('\nShutting down server gracefully...');
    await app.close();
    console.log('Server has been gracefully shut down');
    process.exit(0);
  });
}
bootstrap();