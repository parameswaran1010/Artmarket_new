import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@gmail.com";
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin",
      password: hashedPassword,
      role: "admin",
      status: "ACTIVE",
    },
    create: {
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      status: "ACTIVE",
    },
  });

  console.log(`Successfully seeded admin user: ${admin.email} (Role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
