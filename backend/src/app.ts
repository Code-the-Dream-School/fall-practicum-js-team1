import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import healthRoutes from './routes/health.routes.js';
import helloRoutes from './routes/hello.routes.js';
import userRoutes from './routes/user.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import categoryRoutes from './routes/category.routes.js';
import addressRoutes from './routes/address.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security & best-practice middleware
app.use(helmet());
// The browser only sends the login cookie to an origin we name.
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/hello', helloRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/addresses', addressRoutes);

// Root route
app.get('/', (_req, res) => {
  res.send('Backend API is running');
});

// Keep these last, in this order
app.use(notFound);
app.use(errorHandler);

export default app;
