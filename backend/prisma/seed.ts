/**
 * Database seed script
 * Creates initial admin user for testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create initial admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
      },
    });

    console.log('Created admin user:', {
      email: admin.email,
      role: admin.role,
      password: adminPassword,
    });
  } else {
    console.log('Admin user already exists');
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
