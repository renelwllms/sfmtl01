-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomerIdFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerIdFile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
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
    "senderPhone" TEXT NOT NULL,
    "senderEmail" TEXT,
    "occupation" TEXT,
    "purposeOfTransfer" TEXT,
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
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateKey" TEXT NOT NULL,
    "NZD_WST" REAL NOT NULL,
    "NZD_AUD" REAL NOT NULL,
    "NZD_USD" REAL NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Counter" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerId_key" ON "Customer"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txnNumber_key" ON "Transaction"("txnNumber");

-- CreateIndex
CREATE INDEX "Transaction_customerId_date_idx" ON "Transaction"("customerId", "date");

-- CreateIndex
CREATE INDEX "Transaction_date_currency_idx" ON "Transaction"("date", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_dateKey_key" ON "ExchangeRate"("dateKey");
