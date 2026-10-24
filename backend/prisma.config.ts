import 'dotenv/config'; //loads backend/.env since Prisma 7 doesn't do it for you
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
