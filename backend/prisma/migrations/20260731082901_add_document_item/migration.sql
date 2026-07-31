-- CreateTable
CREATE TABLE "DocumentItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Group',
    "visibleRoles" TEXT NOT NULL DEFAULT '["ADMIN","DIRECTOR","IT","ACCOUNTING"]',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
