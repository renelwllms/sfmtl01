/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "txnNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryVillage" TEXT,
    "beneficiaryPhone" TEXT,
    "bank" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "senderName" TEXT NOT NULL,
    "senderAddress" TEXT,
    "senderStreetAddress" TEXT,
    "senderSuburb" TEXT,
    "senderCity" TEXT,
    "senderPostcode" TEXT,
    "senderHomePhone" TEXT,
    "senderMobilePhone" TEXT,
    "senderPhone" TEXT NOT NULL,
    "senderEmail" TEXT,
    "occupation" TEXT,
    "purposeOfTransfer" TEXT,
    "employerName" TEXT,
    "employerAddress" TEXT,
    "employerPhone" TEXT,
    "reasonForRemittance" TEXT,
    "relationshipToBeneficiary" TEXT,
    "amountNzdCents" INTEGER NOT NULL,
    "feeNzdCents" INTEGER NOT NULL,
    "rate" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "totalPaidNzdCents" INTEGER NOT NULL,
    "totalForeignReceived" REAL NOT NULL,
    "id1CountryAndType" TEXT,
    "id1Number" TEXT,
    "id1IssueDate" DATETIME,
    "id1ExpiryDate" DATETIME,
    "id2CountryAndType" TEXT,
    "id2Number" TEXT,
    "id2IssueDate" DATETIME,
    "id2ExpiryDate" DATETIME,
    "dob" DATETIME NOT NULL,
    "verifiedWithOriginalId" BOOLEAN NOT NULL,
    "proofOfAddressType" TEXT,
    "sourceOfFunds" TEXT,
    "sourceOfFundsDetails" TEXT,
    "bankAccountDetails" TEXT,
    "proofDocumentsProvided" TEXT,
    "isPtrRequired" BOOLEAN NOT NULL DEFAULT false,
    "isGoAmlExportReady" BOOLEAN NOT NULL DEFAULT false,
    "goAmlExportedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountName", "accountNumber", "amountNzdCents", "bank", "beneficiaryName", "beneficiaryPhone", "beneficiaryVillage", "createdAt", "createdById", "currency", "customerId", "date", "dob", "feeNzdCents", "id", "id1CountryAndType", "id1ExpiryDate", "id1IssueDate", "id1Number", "id2CountryAndType", "id2ExpiryDate", "id2IssueDate", "id2Number", "occupation", "proofOfAddressType", "purposeOfTransfer", "rate", "senderAddress", "senderEmail", "senderName", "senderPhone", "sourceOfFunds", "totalForeignReceived", "totalPaidNzdCents", "txnNumber", "verifiedWithOriginalId") SELECT "accountName", "accountNumber", "amountNzdCents", "bank", "beneficiaryName", "beneficiaryPhone", "beneficiaryVillage", "createdAt", "createdById", "currency", "customerId", "date", "dob", "feeNzdCents", "id", "id1CountryAndType", "id1ExpiryDate", "id1IssueDate", "id1Number", "id2CountryAndType", "id2ExpiryDate", "id2IssueDate", "id2Number", "occupation", "proofOfAddressType", "purposeOfTransfer", "rate", "senderAddress", "senderEmail", "senderName", "senderPhone", "sourceOfFunds", "totalForeignReceived", "totalPaidNzdCents", "txnNumber", "verifiedWithOriginalId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_txnNumber_key" ON "Transaction"("txnNumber");
CREATE INDEX "Transaction_customerId_date_idx" ON "Transaction"("customerId", "date");
CREATE INDEX "Transaction_date_currency_idx" ON "Transaction"("date", "currency");
CREATE INDEX "Transaction_isPtrRequired_idx" ON "Transaction"("isPtrRequired");
CREATE INDEX "Transaction_isGoAmlExportReady_idx" ON "Transaction"("isGoAmlExportReady");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "passwordHash") SELECT "createdAt", "email", "id", "passwordHash" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
