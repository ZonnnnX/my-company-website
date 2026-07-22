const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const adminEmail = "Thangtan480@gmail.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail.toLowerCase() } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Sliverseven0", 10);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: "ADMIN",
        status: "APPROVED"
      }
    });
    console.log("  Created admin user: Thangtan480@gmail.com / Sliverseven0");
  } else {
    console.log("  Skipped (exists): admin user");
  }

  // Create default access codes
  const codes = [
    { code: "1234", label: "Default test code", maxUses: 0 },
    { code: "ADMIN2024", label: "Admin access code", maxUses: 10 },
    { code: "EMPLOYEE", label: "Employee access code", maxUses: 50 },
  ];

  for (const c of codes) {
    const existing = await prisma.accessCode.findUnique({ where: { code: c.code } });
    if (!existing) {
      await prisma.accessCode.create({ data: c });
      console.log(`  Created access code: ${c.code} (${c.label})`);
    } else {
      console.log(`  Skipped (exists): ${c.code}`);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

