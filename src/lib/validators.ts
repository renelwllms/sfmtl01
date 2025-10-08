import { z } from 'zod';
import { DateTime } from 'luxon';

export const e164 = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone (E.164)');

export const dob18 = z.coerce.date().refine(
  (d) => {
    const now = DateTime.now().setZone('Pacific/Auckland').startOf('day');
    const eighteen = now.minus({ years: 18 });
    return DateTime.fromJSDate(d) <= eighteen;
  },
  'Customer must be 18 or older'
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
  amountNzdCents: z.number().int().nonnegative('Amount must be positive'),
  feeNzdCents: z.number().int().nonnegative('Fee must be positive'),
  rate: z.number().positive('Rate must be positive'),
  currency: z.enum(['WST', 'AUD', 'USD']),
  totalPaidNzdCents: z.number().int().nonnegative('Total paid must be positive'),
  totalForeignReceived: z.number().nonnegative('Total foreign must be positive'),
  dob: dob18,
  verifiedWithOriginalId: z.boolean(),
  proofOfAddressType: z.enum(['BILL', 'BANK_STATEMENT', 'OTHER']).optional(),
  sourceOfFunds: z.string().optional(),
  id1CountryAndType: z.string().optional(),
  id1Number: z.string().optional(),
  id1IssueDate: z.coerce.date().optional(),
  id1ExpiryDate: z.coerce.date().optional(),
  id2CountryAndType: z.string().optional(),
  id2Number: z.string().optional(),
  id2IssueDate: z.coerce.date().optional(),
  id2ExpiryDate: z.coerce.date().optional()
});

export type CustomerInput = z.infer<typeof CustomerSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
