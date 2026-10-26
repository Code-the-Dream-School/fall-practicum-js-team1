import 'dotenv/config'; //loads backend/.env since Prisma 7 doesn't do it for you
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
