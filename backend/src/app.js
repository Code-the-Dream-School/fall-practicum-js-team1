const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const helloRoutes = require('./routes/hello.routes');

const port = process.env.PORT || 3000

const app = express();

// Security & best‑practice middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
app.use('/api/hello', helloRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}...`)
})

process.on('SIGTERM', async () => {
  server.close()
})

module.exports = { app, server }
