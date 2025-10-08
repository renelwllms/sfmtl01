-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerIdFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'OTHER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerIdFile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CustomerIdFile" ("createdAt", "customerId", "filePath", "id", "mimeType") SELECT "createdAt", "customerId", "filePath", "id", "mimeType" FROM "CustomerIdFile";
DROP TABLE "CustomerIdFile";
ALTER TABLE "new_CustomerIdFile" RENAME TO "CustomerIdFile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
