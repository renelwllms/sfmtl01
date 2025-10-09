-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'AML', 'AGENT');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('WST', 'AUD', 'USD');

-- CreateEnum
CREATE TYPE "ProofOfAddress" AS ENUM ('BILL', 'BANK_STATEMENT', 'IRD_LETTER', 'GOVT_LETTER', 'POWER_BILL', 'WATER_BILL', 'COUNCIL_RATES', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceOfFunds" AS ENUM ('SALARY_WAGES', 'SAVINGS', 'LOAN_FUNDS', 'SALE_OF_PROPERTY', 'SELF_EMPLOYED', 'FAMILY_CONTRIBUTIONS', 'FUNDRAISING_RAFFLE', 'OTHER');

-- CreateEnum
CREATE TYPE "IdDocumentType" AS ENUM ('DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'BANK_CARD', 'BIRTH_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_VIEWED', 'CUSTOMER_ID_UPLOADED', 'CUSTOMER_ID_VIEWED', 'TRANSACTION_CREATED', 'TRANSACTION_VIEWED', 'EXCHANGE_RATE_UPDATED', 'SETTINGS_CHANGED', 'REPORT_GENERATED', 'SEARCH_PERFORMED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerIdFile" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentType" "IdDocumentType" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerIdFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "txnNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "rate" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "totalPaidNzdCents" INTEGER NOT NULL,
    "totalForeignReceived" DOUBLE PRECISION NOT NULL,
    "id1CountryAndType" TEXT,
    "id1Number" TEXT,
    "id1IssueDate" TIMESTAMP(3),
    "id1ExpiryDate" TIMESTAMP(3),
    "id2CountryAndType" TEXT,
    "id2Number" TEXT,
    "id2IssueDate" TIMESTAMP(3),
    "id2ExpiryDate" TIMESTAMP(3),
    "dob" TIMESTAMP(3) NOT NULL,
    "verifiedWithOriginalId" BOOLEAN NOT NULL,
    "proofOfAddressType" "ProofOfAddress",
    "sourceOfFunds" "SourceOfFunds",
    "sourceOfFundsDetails" TEXT,
    "bankAccountDetails" TEXT,
    "proofDocumentsProvided" TEXT,
    "isPtrRequired" BOOLEAN NOT NULL DEFAULT false,
    "isGoAmlExportReady" BOOLEAN NOT NULL DEFAULT false,
    "goAmlExportedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "NZD_WST" DOUBLE PRECISION NOT NULL,
    "NZD_AUD" DOUBLE PRECISION NOT NULL,
    "NZD_USD" DOUBLE PRECISION NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "description" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "senderEmail" TEXT,
    "senderName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Transaction_isPtrRequired_idx" ON "Transaction"("isPtrRequired");

-- CreateIndex
CREATE INDEX "Transaction_isGoAmlExportReady_idx" ON "Transaction"("isGoAmlExportReady");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_dateKey_key" ON "ExchangeRate"("dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_name_key" ON "DocumentType"("name");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_type_createdAt_idx" ON "ActivityLog"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "CustomerIdFile" ADD CONSTRAINT "CustomerIdFile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
