const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const newPassword = "pandarakkandy123";

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error(`User "${username}" was not found.`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`Password reset successfully for ${username}.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());