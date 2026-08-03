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

  // Seed default team members
  const teamMembers = [
    { name: "Daniel Nguyễn", position: "Founder & Director", role: "DIRECTOR", description: "Oversees all company operations, strategy, and growth. With years of industry experience, Daniel leads the organization with vision and dedication.", avatarIcon: "&#128100;", roleClass: "role-director", displayOrder: 0 },
    { name: "Công", position: "IT", role: "IT", description: "Responsible for maintaining IT infrastructure, systems administration, and technical support across the organization.", avatarIcon: "&#128187;", roleClass: "role-it", displayOrder: 1 },
    { name: "Tấn Thắng", position: "IT", role: "IT", description: "Handles network operations, system security, and technology solutions to keep our digital environment running smoothly.", avatarIcon: "&#128187;", roleClass: "role-it", displayOrder: 2 },
    { name: "Trọng Việt", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Responsible for executing key projects and operational tasks. Ensures timely delivery and quality output.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 3 },
    { name: "Thanh Trai", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Carries out operational tasks and project execution with precision and efficiency.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 4 },
    { name: "Phước Bình", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Supports project execution and operational workflows. Dedicated to achieving team goals.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 5 },
    { name: "Nguyễn Thái", position: "Accounting", role: "ACCOUNTING", description: "Manages financial records, accounting operations, and financial reporting for the entire organization.", avatarIcon: "&#128203;", roleClass: "role-accounting", displayOrder: 6 }
  ];

  const teamCount = await prisma.teamMember.count();
  if (teamCount === 0) {
    for (const m of teamMembers) {
      await prisma.teamMember.create({ data: m });
    }
    console.log(`  Created ${teamMembers.length} default team members.`);
  } else {
    console.log("  Skipped (exists): default team members");
  }

  // Seed default document items
  const defaultDocs = [
    { name: "Nhóm A", link: "https://drive.google.com/drive/folders/1", category: "Group", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT","ACCOUNTING","LEADER","EMPLOYEE","IMPLEMENTATION"]), displayOrder: 0 },
    { name: "Nhóm B", link: "https://drive.google.com/drive/folders/2", category: "Group", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT","ACCOUNTING","LEADER","EMPLOYEE"]), displayOrder: 1 },
    { name: "Nhóm C", link: "https://drive.google.com/drive/folders/3", category: "Group", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT","ACCOUNTING","LEADER"]), displayOrder: 2 },
    { name: "Quỹ ABC", link: "https://drive.google.com/drive/folders/4", category: "Fund", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT","ACCOUNTING","LEADER"]), displayOrder: 3 },
    { name: "Quỹ XYZ", link: "https://drive.google.com/drive/folders/5", category: "Fund", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT","ACCOUNTING"]), displayOrder: 4 },
    { name: "VPS Server 1", link: "https://drive.google.com/drive/folders/6", category: "VPS", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT","ACCOUNTING"]), displayOrder: 5 },
    { name: "VPS Server 2", link: "https://drive.google.com/drive/folders/7", category: "VPS", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT"]), displayOrder: 6 },
    { name: "Profile Mẫu A", link: "https://drive.google.com/drive/folders/8", category: "Profile", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT","ACCOUNTING","LEADER","EMPLOYEE","IMPLEMENTATION"]), displayOrder: 7 },
    { name: "Profile Mẫu B", link: "https://drive.google.com/drive/folders/9", category: "Profile", visibleRoles: JSON.stringify(["ADMIN","DIRECTOR","IT","ACCOUNTING"]), displayOrder: 8 }
  ];

  const docCount = await prisma.documentItem.count();
  if (docCount === 0) {
    for (const d of defaultDocs) {
      await prisma.documentItem.create({ data: d });
    }
    console.log(`  Created ${defaultDocs.length} default document items.`);
  } else {
    console.log("  Skipped (exists): default document items");
  }

  // Seed default site content (editable website copy)
  const defaultContent = {
    hero: JSON.stringify({
      title: "Trusted solutions for your next milestone.",
      lead: "A private corporate site with secure navigation, clean layout, and quick content sections.",
      feature1Title: "Secure by design",
      feature1Desc: "Server-side authentication with role-based access control.",
      feature2Title: "Modern UI",
      feature2Desc: "Responsive layout, accessible components, and a polished dark theme.",
      feature3Title: "Easy to customize",
      feature3Desc: "Update copy, images, and links without touching the structure."
    }),
    quickFacts: JSON.stringify({
      industry: "[Your industry]",
      hq: "[City, Country]",
      note: "Internal documents and announcements can be linked here."
    }),
    announcements: JSON.stringify([
      { title: "New policy update", text: "[Date] — Replace with your latest update." },
      { title: "Office hours", text: "[Details] — Replace with current schedule." }
    ]),
    about: JSON.stringify({
      mission: "To deliver innovative solutions that empower businesses to achieve their full potential. We believe in building lasting partnerships through trust, transparency, and exceptional service.",
      values: [
        "Integrity — We do the right thing, always",
        "Excellence — We pursue the highest standards",
        "Innovation — We embrace change and new ideas",
        "Collaboration — We succeed together",
        "Customer-first — Our clients are our priority"
      ],
      overview: "Founded with a vision to transform the [your industry] landscape, we have grown into a trusted partner for organizations worldwide. Our team brings decades of combined experience across strategy, technology, and operations."
    }),
    services: JSON.stringify([
      { title: "📈 Consulting", desc: "Strategic planning, market analysis, and business transformation guidance." },
      { title: "⚙ Implementation", desc: "End-to-end deployment of solutions, system integration, and operational setup." },
      { title: "🔧 Support", desc: "Ongoing maintenance, troubleshooting, and continuous improvement." },
      { title: "☁ Managed Services", desc: "Full-service management of your critical operations." },
      { title: "📊 Reporting & Analytics", desc: "Custom dashboards, performance summaries, and actionable insights." },
      { title: "🎓 Training", desc: "Workshops, documentation, and knowledge transfer for smooth adoption." }
    ]),
    contact: JSON.stringify({
      email: "contact@redsv.vn",
      office: "123 Business Avenue, Suite 100\n[City, Country]",
      responseTime: "Typically within 24 hours"
    }),
    footer: JSON.stringify("Company Name. Private site template.")
  };

  for (const key of Object.keys(defaultContent)) {
    const existing = await prisma.siteContent.findUnique({ where: { key } });
    if (!existing) {
      await prisma.siteContent.create({ data: { key, value: defaultContent[key] } });
      console.log(`  Created site content: ${key}`);
    } else {
      console.log(`  Skipped (exists): site content ${key}`);
    }
  }

  // Seed default custom roles
  const defaultRoles = ["ADMIN","DIRECTOR","LEADER","IT","IMPLEMENTATION","ACCOUNTING","EMPLOYEE"];
  for (const r of defaultRoles) {
    const existing = await prisma.customRole.findUnique({ where: { name: r } });
    if (!existing) {
      await prisma.customRole.create({ data: { name: r, permissions: "{}" } });
    }
  }
  console.log(`  Synced ${defaultRoles.length} default roles.`);

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

