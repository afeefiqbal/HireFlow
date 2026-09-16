import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiRouter } from './routes/api.routes';

export const createApp = (): Express => {
  const app = express();

  // Security & standard middleware
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: true, // Allow frontend dev server and production domains
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Authentication & Security Middleware
  // In development, permits local requests seamlessly. In production, checks for valid bearer token.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requiredToken = process.env.API_ACCESS_TOKEN;
    const authHeader = req.headers.authorization;

    // Permit preflight, health, and local dev requests
    if (
      req.method === 'OPTIONS' ||
      req.path === '/health' ||
      process.env.NODE_ENV === 'development' ||
      !requiredToken
    ) {
      return next();
    }

    if (authHeader && authHeader === `Bearer ${requiredToken}`) {
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Private AI Job Agent access requires a valid authentication token.',
    });
  });

  // Mount API Routes
  app.use('/api', apiRouter);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Application Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  return app;
};
