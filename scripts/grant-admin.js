const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function grantAdmin() {
  try {
    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        roles: true
      }
    });

    console.log('\n=== Current Users ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Roles: ${user.roles}`);
      console.log(`   ID: ${user.id}\n`);
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    // If there's only one user, automatically grant admin
    if (users.length === 1) {
      const user = users[0];
      const currentRoles = user.roles.split(',').map(r => r.trim());

      if (!currentRoles.includes('ADMIN')) {
        const newRoles = [...new Set([...currentRoles, 'ADMIN'])].join(',');

        await db.user.update({
          where: { id: user.id },
          data: { roles: newRoles }
        });

        console.log(`✅ ADMIN role granted to ${user.email}`);
        console.log(`   New roles: ${newRoles}\n`);
      } else {
        console.log(`✅ ${user.email} already has ADMIN role\n`);
      }
    } else {
      console.log('Multiple users found. Please specify which user to grant admin:');
      console.log('Run: node scripts/grant-admin.js <email>\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

// Check if email is provided as argument
const email = process.argv[2];

if (email) {
  db.user.findUnique({ where: { email } })
    .then(user => {
      if (!user) {
        console.log(`User with email ${email} not found.`);
        return;
      }

      const currentRoles = user.roles.split(',').map(r => r.trim());

      if (!currentRoles.includes('ADMIN')) {
        const newRoles = [...new Set([...currentRoles, 'ADMIN'])].join(',');

        return db.user.update({
          where: { id: user.id },
          data: { roles: newRoles }
        }).then(() => {
          console.log(`✅ ADMIN role granted to ${email}`);
          console.log(`   New roles: ${newRoles}\n`);
        });
      } else {
        console.log(`✅ ${email} already has ADMIN role\n`);
      }
    })
    .catch(error => console.error('Error:', error))
    .finally(() => db.$disconnect());
} else {
  grantAdmin();
}
