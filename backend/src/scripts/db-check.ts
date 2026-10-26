import { prisma } from '../config/db.prisma.js';

try {
  const result = await prisma.$queryRaw`SELECT 1`;
  console.log('Database connection successful:', result);
} catch (error) {
  console.error(
    'Database connection failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
