import { prisma } from '../config/db.prisma.js';

let userId: string | undefined;
let categoryId: string | undefined;
let itemId: string | undefined;

try {
  // 1. Create a test user
  const user = await prisma.user.create({
    data: {
      email: `relation-test-${Date.now()}@example.com`,
      passwordHash: 'temporary-test-hash',
      name: 'Relation Test User',
    },
  });
  userId = user.id;

  // 2. Create a test category
  const category = await prisma.category.create({
    data: {
      key: `relation-test-${Date.now()}`,
      name: 'Relation Test Category',
    },
  });
  categoryId = category.id;

  // 3. Create an item with a related owner, category, and photo
  const item = await prisma.item.create({
    data: {
      title: 'Test Baby Stroller',
      description: 'A test stroller for checking Prisma relations.',
      condition: 'good',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      ownerId: user.id,
      categoryId: category.id,
      photos: {
        create: [
          {
            url: 'https://example.com/test-stroller.jpg',
            publicId: `relation-test-${Date.now()}`,
            position: 0,
          },
        ],
      },
    },
  });
  itemId = item.id;

  // 4. Retrieve the item with its related records
  const result = await prisma.item.findUnique({
    where: { id: item.id },
    include: {
      owner: true,
      category: true,
      photos: true,
    },
  });

  if (
    !result ||
    !result.owner ||
    !result.category ||
    result.photos.length === 0
  ) {
    throw new Error('One or more Prisma relations could not be retrieved.');
  }

  console.log('Relation query successful!');
  console.dir(result, { depth: null });
} catch (error) {
  console.error('Relation query failed:', error);
  process.exitCode = 1;
} finally {
  // 5. Clean up test records
  try {
    if (itemId) {
      await prisma.item.delete({ where: { id: itemId } });
    }

    if (categoryId) {
      await prisma.category.delete({ where: { id: categoryId } });
    }

    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }

    console.log('Test records cleaned up.');
  } catch (cleanupError) {
    console.error('Test cleanup failed:', cleanupError);
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}
