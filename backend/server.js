import dotenv from 'dotenv'
import app from './src/app.js'
import config from './src/config/config.ts'

dotenv.config();

const PORT = config.port

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  server.close()
})

