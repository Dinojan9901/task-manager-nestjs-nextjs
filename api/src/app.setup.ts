import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * App-wide settings, shared by main.ts and the e2e tests,
 * so the tests run against exactly the same configuration.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that have no decorator in the DTO
      forbidNonWhitelisted: true, // ...and return 400 if any were sent
      transform: true, // turn the JSON body into a DTO class instance
    }),
  );

  // Allow the Next.js frontend (another origin) to call this API.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  });
}
