import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import helloRoutes from './routes/hello.routes.js';

const app = express();

// Security & best‑practice middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Routes
app.use('/api/hello', helloRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

export default app;
