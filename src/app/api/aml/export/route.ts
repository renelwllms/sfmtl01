import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatNZDate } from '@/lib/date-utils';

// GET /api/aml/export - Export selected transactions to CSV for goAML
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has ADMIN or AML role
    const userRoles = (session.user as any)?.roles || '';
    if (!hasRole(userRoles, 'ADMIN') && !hasRole(userRoles, 'AML')) {
      return NextResponse.json({ error: 'Forbidden - Admin or AML role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'Transaction IDs required' }, { status: 400 });
    }

    const transactionIds = idsParam.split(',');

    // Fetch transactions with full details
    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        isGoAmlExportReady: true
      },
      include: {
        customer: true,
        createdBy: {
          select: {
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions found' }, { status: 404 });
    }

    // Generate CSV content for goAML/PTR reporting
    const csvHeaders = [
      'Transaction Number',
      'Transaction Date',
      'Transaction Type',
      'Currency',
      'Amount NZD',
      'Fee NZD',
      'Total Paid NZD',
      'Exchange Rate',
      'Foreign Amount Received',
      // Sender (Customer) Details
      'Sender Full Name',
      'Sender First Name',
      'Sender Last Name',
      'Sender DOB',
      'Sender Phone',
      'Sender Email',
      'Sender Address',
      'Sender Street Address',
      'Sender Suburb',
      'Sender City',
      'Sender Postcode',
      'Sender Home Phone',
      'Sender Mobile Phone',
      'Sender Occupation',
      // Beneficiary Details
      'Beneficiary Name',
      'Beneficiary Village',
      'Beneficiary Phone',
      'Beneficiary Bank',
      'Beneficiary Account Number',
      'Beneficiary Account Name',
      // Transaction Purpose/Source
      'Purpose of Transfer',
      'Reason for Remittance',
      'Relationship to Beneficiary',
      'Source of Funds',
      'Source of Funds Details',
      // Employment Details
      'Employer Name',
      'Employer Address',
      'Employer Phone',
      // ID Verification
      'Verified with Original ID',
      'Proof of Address Type',
      'ID1 Country and Type',
      'ID1 Number',
      'ID1 Issue Date',
      'ID1 Expiry Date',
      'ID2 Country and Type',
      'ID2 Number',
      'ID2 Issue Date',
      'ID2 Expiry Date',
      'Bank Account Details',
      'Proof Documents Provided',
      // AML Flags
      'PTR Required',
      'Created By',
      'Created At'
    ];

    const csvRows = transactions.map(txn => {
      return [
        txn.txnNumber,
        formatNZDate(txn.createdAt.toISOString()),
        'International Funds Transfer',
        txn.currency,
        (txn.amountNzdCents / 100).toFixed(2),
        (txn.feeNzdCents / 100).toFixed(2),
        (txn.totalPaidNzdCents / 100).toFixed(2),
        txn.rate.toString(),
        txn.totalForeignReceived.toFixed(2),
        // Sender
        txn.customer.fullName,
        txn.customer.firstName,
        txn.customer.lastName,
        formatNZDate(txn.customer.dob),
        txn.customer.phone,
        txn.customer.email || '',
        txn.customer.address || '',
        txn.senderStreetAddress || '',
        txn.senderSuburb || '',
        txn.senderCity || '',
        txn.senderPostcode || '',
        txn.senderHomePhone || '',
        txn.senderMobilePhone || '',
        txn.occupation || '',
        // Beneficiary
        txn.beneficiaryName,
        txn.beneficiaryVillage || '',
        txn.beneficiaryPhone || '',
        txn.bank || '',
        txn.accountNumber || '',
        txn.accountName || '',
        // Purpose
        txn.purposeOfTransfer || '',
        txn.reasonForRemittance || '',
        txn.relationshipToBeneficiary || '',
        txn.sourceOfFunds || '',
        txn.sourceOfFundsDetails || '',
        // Employment
        txn.employerName || '',
        txn.employerAddress || '',
        txn.employerPhone || '',
        // ID Verification
        txn.verifiedWithOriginalId ? 'Yes' : 'No',
        txn.proofOfAddressType || '',
        txn.id1CountryAndType || '',
        txn.id1Number || '',
        txn.id1IssueDate || '',
        txn.id1ExpiryDate || '',
        txn.id2CountryAndType || '',
        txn.id2Number || '',
        txn.id2IssueDate || '',
        txn.id2ExpiryDate || '',
        txn.bankAccountDetails || '',
        txn.proofDocumentsProvided || '',
        // AML
        txn.isPtrRequired ? 'Yes' : 'No',
        txn.createdBy?.email || '',
        new Date(txn.createdAt).toISOString()
      ].map(field => {
        // Escape CSV fields that contain commas, quotes, or newlines
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',');
    });

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `goAML-Export-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting goAML transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
