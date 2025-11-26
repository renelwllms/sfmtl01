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
  mobilePhone: e164,
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  // Enhanced AML fields (optional, for >= NZ$1,000 transactions)
  streetAddress: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  homePhone: z.string().optional(),
  occupation: z.string().optional(),
  employerName: z.string().optional(),
  employerAddress: z.string().optional(),
  employerPhone: z.string().optional()
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
  id1CountryAndType: z.string().optional().nullable(),
  id1Number: z.string().optional().nullable(),
  id1IssueDate: z.coerce.date().optional().nullable(),
  id1ExpiryDate: z.coerce.date().optional().nullable(),
  id2CountryAndType: z.string().optional().nullable(),
  id2Number: z.string().optional().nullable(),
  id2IssueDate: z.coerce.date().optional().nullable(),
  id2ExpiryDate: z.coerce.date().optional().nullable()
}).refine(
  (data) => {
    // If transaction is >= NZ$1,000 (100,000 cents), enhanced AML fields are required
    const requiresEnhancedAML = data.amountNzdCents >= 100000;

    if (requiresEnhancedAML) {
      const missingFields: string[] = [];

      if (!data.senderStreetAddress) missingFields.push('Street Address');
      if (!data.senderSuburb) missingFields.push('Suburb');
      if (!data.senderCity) missingFields.push('City');
      if (!data.senderPostcode) missingFields.push('Postcode');
      if (!data.senderHomePhone) missingFields.push('Home Phone');
      if (!data.senderMobilePhone) missingFields.push('Mobile Phone');
      if (!data.employerName) missingFields.push('Employer Name');
      if (!data.employerAddress) missingFields.push('Employer Address');
      if (!data.employerPhone) missingFields.push('Employer Phone');
      if (!data.reasonForRemittance) missingFields.push('Reason for Remittance');
      if (!data.relationshipToBeneficiary) missingFields.push('Relationship to Beneficiary');
      if (!data.sourceOfFunds) missingFields.push('Source of Funds');
      if (!data.bankAccountDetails) missingFields.push('Bank Account Details');
      if (!data.proofOfAddressType) missingFields.push('Proof of Address Type');
      if (!data.proofDocumentsProvided) missingFields.push('ID & Proof Documents Provided');

      if (missingFields.length > 0) {
        // Store missing fields in a custom error that can be accessed
        return false;
      }
      return true;
    }
    return true;
  },
  (data) => {
    const requiresEnhancedAML = data.amountNzdCents >= 100000;

    if (requiresEnhancedAML) {
      const missingFields: string[] = [];

      if (!data.senderStreetAddress) missingFields.push('Street Address');
      if (!data.senderSuburb) missingFields.push('Suburb');
      if (!data.senderCity) missingFields.push('City');
      if (!data.senderPostcode) missingFields.push('Postcode');
      if (!data.senderHomePhone) missingFields.push('Home Phone');
      if (!data.senderMobilePhone) missingFields.push('Mobile Phone');
      if (!data.employerName) missingFields.push('Employer Name');
      if (!data.employerAddress) missingFields.push('Employer Address');
      if (!data.employerPhone) missingFields.push('Employer Phone');
      if (!data.reasonForRemittance) missingFields.push('Reason for Remittance');
      if (!data.relationshipToBeneficiary) missingFields.push('Relationship to Beneficiary');
      if (!data.occupation) missingFields.push('Occupation');
      if (!data.sourceOfFunds) missingFields.push('Source of Funds');
      if (!data.bankAccountDetails) missingFields.push('Bank Account Details');
      if (!data.proofOfAddressType) missingFields.push('Proof of Address Type');
      if (!data.proofDocumentsProvided) missingFields.push('ID & Proof Documents Provided');

      if (missingFields.length > 0) {
        return {
          message: `For transactions >= NZ$1,000, the following required fields are missing: ${missingFields.join(', ')}`,
          path: ['amountNzdCents']
        };
      }
    }

    // Validation passed - return true (not an error object!)
    return true;
  }
);

export type CustomerInput = z.infer<typeof CustomerSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
