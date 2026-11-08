import 'dotenv/config';
import bcrypt from 'bcryptjs';

// Prisma imports
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

import itemData from './seed-data/items.json';

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// User constants
const ADMIN_EMAIL = 'admin@example.com';
const USER1_EMAIL = 'fake_user1@example.com';
const USER2_EMAIL = 'fake_user2@example.com';
const SEED_PASSWORD = 'Password123'
const SALT_ROUNDS = 10
const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);


// Address constants
const ADDRESS_ID_TEMPLATE = '11111111-0000-4000-8000-00000000000x';

// Categories
const CATEGORIES = {
  strollers: 'Strollers',
  'car-seats': 'Car seats',
  cribs: 'Cribs and bedding',
  feeding: 'Feeding',
  toys: 'Toys',
  clothing: 'Clothing',
};

class ClaimStatus {
  rotatingStatuses = ['pending', 'declined', 'no_show'];
  counter = 0;
  constructor() {}

  get status() {
    const status =
      this.rotatingStatuses[this.counter % this.rotatingStatuses.length];
    this.counter += 1;
    return status;
  }
}

const getDate = (): string => new Date().toISOString();

const handleClaim = async (item, claimer, claimCounter) => {
  const { status } = item;
  const claimAttrs = {
    status: 'pending',
    decidedAt: null,
    pickedUpAt: null,
    claimer: {
      connect: { id: claimer.id },
    },
    item: {
      connect: { id: item.id },
    },
  };
  if (status === 'reserved') {
    claimAttrs['status'] = 'approved';
    claimAttrs['decidedAt'] = item.reservedAt || getDate();
  } else if (status === 'picked_up') {
    claimAttrs['status'] = 'picked_up';
    claimAttrs['decidedAt'] = getDate();
    claimAttrs['pickedUpAt'] = getDate();
  } else if (status === 'withdrawn') {
    claimAttrs['status'] = 'cancelled';
    claimAttrs['decidedAt'] = getDate();
  } else {
    claimAttrs['status'] = claimCounter.status;
    if (claimAttrs['status'] !== 'pending') {
      claimAttrs['decidedAt'] = getDate();
    }
  }

  const claims = await prisma.claim.findMany({
    where: {
      item: { id: item.id },
      claimer: { id: claimer.id },
    },
  });

  if (claims.length > 0) {
    return claims[0];
  }

  const claim = await prisma.claim.create({ data: claimAttrs });
  return claim;
};

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: 'Super User',
      role: 'admin',
      passwordHash,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: USER1_EMAIL },
    update: {},
    create: {
      email: USER1_EMAIL,
      name: 'Seed User1',
      role: 'user',
      passwordHash,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: USER2_EMAIL },
    update: {},
    create: {
      email: USER2_EMAIL,
      name: 'Seed User2',
      role: 'user',
      passwordHash,
    },
  });

  const users = [admin, user1, user2];
  const emails = users.map((user) => user.email).join(', ');
  console.log(`🌈 Upserted test user accounts for ${emails}`);

  const addresses = [];
  for (const [index, user] of users.entries()) {
    const id = ADDRESS_ID_TEMPLATE.replace('x', index.toString());
    const address = await prisma.address.upsert({
      where: { id, line1: `${index + 1} Main Street` },
      update: {},
      create: {
        user: {
          connect: { id: user.id },
        },
        line1: `${index + 1} Main Street`,
        line2: index % 2 == 0 ? null : `#${index}`,
        city: 'San Francisco',
        state: 'California',
        postalCode: `9411${index}`,
        isDefault: true,
        id,
      },
    });
    addresses.push(address.line1);
  }
  console.log(`🏠 Upserted addresses: ${addresses.join(', ')}`);

  const userIds = users.map((u) => u.id);
  const usersWithAddresses = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    include: {
      addresses: true,
    },
  });

  let sortOrder = 1;
  const categories = [];
  for (const key in CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { key },
      update: {},
      create: {
        name: CATEGORIES[key],
        key,
        sortOrder,
      },
    });

    categories.push(category);
    sortOrder++;
  }
  console.log(
    `🐱 Upserted categories: ${categories.map((c) => c.key).join(', ')}`,
  );

  const items = [];
  const itemPhotos = [];
  const itemPickupDetails = [];
  const claims = [];

  let ownerCounter = 0;
  const claimCounter = new ClaimStatus();
  for (const [itemIndex, itemDatum] of itemData.entries()) {
    const ownerCanonical = usersWithAddresses[ownerCounter % 3];
    const { photos, category, owner, availability, instructions, ...rest } =
      itemDatum;

    const address = ownerCanonical.addresses[0];

    // overwrite and shape attributes
    const itemCreateAttribs = {
      ...rest,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      category: {
        connect: { key: category },
      },
      owner: {
        connect: { id: ownerCanonical.id },
      },
    };

    const item = await prisma.item.upsert({
      where: { id: itemDatum.id },
      update: {},
      create: itemCreateAttribs,
    });

    items.push(item);

    // photos
    for (const photoData of Object.values(photos)) {
      const photo = await prisma.itemPhoto.upsert({
        where: { id: photoData.id },
        update: {},
        create: {
          ...photoData,
          publicId: `seed/${item.id}/${photoData.position}`,
          item: {
            connect: { id: item.id },
          },
        },
      });
      itemPhotos.push(photo);
    }

    // item pickup details
    const itemPickupDetail = await prisma.itemPickupDetail.upsert({
      where: { itemId: item.id },
      update: {},
      create: {
        item: {
          connect: { id: item.id },
        },
        address: {
          connect: { id: address.id },
        },
        instructions,
        availability,
      },
    });

    itemPickupDetails.push(itemPickupDetail);

    const claim = await handleClaim(
      item,
      usersWithAddresses[(ownerCounter + 1) % 3],
      claimCounter,
    );
    claims.push(claim);

    ownerCounter += 1;
  }
  console.log(`📌 Upserted ${items.length} items`);
  console.log(
    `🔍 Upserted ${itemPickupDetails.length} item pickup details (should match the number of items)`,
  );
  console.log(`📷 Upserted ${itemPhotos.length} photos`);
  console.log(`🏷️ Upserted ${claims.length} claims`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
