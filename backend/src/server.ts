import app from './app.js';
import config from './config/config.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  server.close();
});
