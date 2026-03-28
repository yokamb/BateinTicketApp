import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'dummy',
        endsWith: '@example.com'
      }
    }
  });

  // Sort numerically based on "dummy<num>@"
  users.sort((a: User, b: User) => {
    const numA = parseInt(a.email?.replace(/[^\d]/g, '') || '0');
    const numB = parseInt(b.email?.replace(/[^\d]/g, '') || '0');
    return numA - numB;
  });

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    let newPlan = 'FREE';
    if (i >= 5 && i < 10) newPlan = 'PRO';
    else if (i >= 10 && i < 15) newPlan = 'MAX';
    else if (i >= 15) newPlan = 'FREE';

    await prisma.user.update({
      where: { id: user.id },
      data: { plan: newPlan }
    });
  }

  const updatedUsers = await prisma.user.findMany({
    where: {
      email: { startsWith: 'dummy', endsWith: '@example.com' }
    }
  });

  updatedUsers.sort((a: User, b: User) => {
    const numA = parseInt(a.email?.replace(/[^\d]/g, '') || '0');
    const numB = parseInt(b.email?.replace(/[^\d]/g, '') || '0');
    return numA - numB;
  });

  console.log("Here are the 20 dummy users:");
  updatedUsers.forEach((u, idx) => {
    const num = idx + 1;
    console.log(`${num.toString().padStart(2, '0')}. ${u.name?.padEnd(15)} | ${u.email?.padEnd(20)} | Plan: ${u.plan}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
