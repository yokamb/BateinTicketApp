import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Spawning 20 dummy users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  for (let i = 1; i <= 20; i++) {
    await prisma.user.create({
      data: {
        name: `Dummy User ${i}`,
        email: `dummy${i}@example.com`,
        passwordHash,
        role: i % 5 === 0 ? 'ADMIN' : 'CUSTOMER',
        plan: 'FREE',
      }
    });
  }
  console.log('Successfully spawned 20 users.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
