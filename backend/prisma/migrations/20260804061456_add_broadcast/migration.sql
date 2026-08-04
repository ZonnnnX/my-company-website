-- CreateTable
CREATE TABLE "Broadcast" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "roles" TEXT NOT NULL DEFAULT '[]',
    "createdById" INTEGER,
    "createdByName" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Broadcast_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
