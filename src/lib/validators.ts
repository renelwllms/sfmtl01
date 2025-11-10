import { z } from 'zod';
import { DateTime } from 'luxon';

export const e164 = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Phone number must be in E.164 format (e.g., +6421234567). Start with + followed by country code and number.');

export const dob18 = z.coerce.date().refine(
  (d) => {
    const now = DateTime.now().setZone('Pacific/Auckland').startOf('day');
    const eighteen = now.minus({ years: 18 });
    return DateTime.fromJSDate(d) <= eighteen;
  },
  'Customer must be at least 18 years old. Please check the date of birth.'
);

export const CustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: dob18,
  phone: e164,
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional()
});

export const TransactionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  beneficiaryName: z.string().min(1, 'Beneficiary name is required'),
  beneficiaryVillage: z.string().optional(),
  beneficiaryPhone: z.string().optional(),
  bank: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  senderName: z.string().min(1, 'Sender name is required'),
  senderAddress: z.string().optional(),
  senderPhone: e164,
  senderEmail: z.string().email().optional().or(z.literal('')),
  occupation: z.string().optional(),
  purposeOfTransfer: z.string().optional(),
  // Enhanced sender details for >= NZ$1,000
  senderStreetAddress: z.string().optional(),
  senderSuburb: z.string().optional(),
  senderCity: z.string().optional(),
  senderPostcode: z.string().optional(),
  senderHomePhone: z.string().optional(),
  senderMobilePhone: z.string().optional(),
  // Employment Details for >= NZ$1,000
  employerName: z.string().optional(),
  employerAddress: z.string().optional(),
  employerPhone: z.string().optional(),
  // Remittance details for >= NZ$1,000
  reasonForRemittance: z.string().optional(),
  relationshipToBeneficiary: z.string().optional(),
  // Money
  amountNzdCents: z.number().int().nonnegative('Amount must be positive'),
  feeNzdCents: z.number().int().nonnegative('Fee must be positive'),
  rate: z.number().positive('Rate must be positive'),
  currency: z.enum(['WST', 'AUD', 'USD']),
  totalPaidNzdCents: z.number().int().nonnegative('Total paid must be positive'),
  totalForeignReceived: z.number().nonnegative('Total foreign must be positive'),
  dob: dob18,
  verifiedWithOriginalId: z.boolean(),
  proofOfAddressType: z.enum(['BILL', 'BANK_STATEMENT', 'IRD_LETTER', 'GOVT_LETTER', 'POWER_BILL', 'WATER_BILL', 'COUNCIL_RATES', 'OTHER']).optional(),
  sourceOfFunds: z.enum(['SALARY_WAGES', 'SAVINGS', 'LOAN_FUNDS', 'SALE_OF_PROPERTY', 'SELF_EMPLOYED', 'FAMILY_CONTRIBUTIONS', 'FUNDRAISING_RAFFLE', 'OTHER']).optional(),
  sourceOfFundsDetails: z.string().optional(),
  bankAccountDetails: z.string().optional(),
  proofDocumentsProvided: z.string().optional(),
  id1CountryAndType: z.string().optional(),
  id1Number: z.string().optional(),
  id1IssueDate: z.coerce.date().optional(),
  id1ExpiryDate: z.coerce.date().optional(),
  id2CountryAndType: z.string().optional(),
  id2Number: z.string().optional(),
  id2IssueDate: z.coerce.date().optional(),
  id2ExpiryDate: z.coerce.date().optional()
}).refine(
  (data) => {
    // If transaction is >= NZ$1,000 (100,000 cents), enhanced AML fields are required
    const requiresEnhancedAML = data.amountNzdCents >= 100000;

    if (requiresEnhancedAML) {
      return !!(
        data.senderStreetAddress &&
        data.senderSuburb &&
        data.senderCity &&
        data.senderPostcode &&
        data.senderHomePhone &&
        data.senderMobilePhone &&
        data.employerName &&
        data.employerAddress &&
        data.employerPhone &&
        data.reasonForRemittance &&
        data.relationshipToBeneficiary &&
        data.sourceOfFunds &&
        data.bankAccountDetails &&
        data.proofOfAddressType &&
        data.proofDocumentsProvided
      );
    }
    return true;
  },
  {
    message: 'Enhanced AML fields are required for transactions >= NZ$1,000',
    path: ['amountNzdCents']
  }
);

export type CustomerInput = z.infer<typeof CustomerSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
