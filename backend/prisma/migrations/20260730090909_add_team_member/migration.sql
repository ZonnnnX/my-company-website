-- CreateTable
CREATE TABLE "TeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "description" TEXT NOT NULL DEFAULT '',
    "avatarIcon" TEXT NOT NULL DEFAULT '&#128100;',
    "roleClass" TEXT NOT NULL DEFAULT 'role-placeholder',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamMember_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
