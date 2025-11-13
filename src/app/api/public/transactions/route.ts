import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TransactionSchema } from '@/lib/validators';
import { nextTxnNumber } from '@/lib/ids';
import { sendEmail, generateTransactionInProgressEmail } from '@/lib/email';

// POST /api/public/transactions - Create transaction (public for agent portal)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('═══════════════════════════════════════════════');
    console.log('📥 API: Received transaction request');
    console.log('═══════════════════════════════════════════════');

    // Validate input
    const validation = TransactionSchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ API: Validation failed');
      console.log('Validation errors:', JSON.stringify(validation.error.errors, null, 2));
      console.log('Error format:', validation.error.format());
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    console.log('✅ API: Validation passed');
    console.log('═══════════════════════════════════════════════');

    const data = validation.data;

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: data.customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify agent exists if agentId provided
    if (body.agentId) {
      const agent = await db.agent.findUnique({
        where: { id: body.agentId }
      });

      if (!agent || agent.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Invalid or inactive agent' },
          { status: 403 }
        );
      }
    }

    // Extract agentId from request body if provided
    const agentId = body.agentId || null;

    // Generate transaction number
    const txnNumber = await nextTxnNumber();

    // Determine AML flags
    const isInternational = data.currency !== 'WST';
    const isPtrRequired = isInternational && data.totalPaidNzdCents >= 100000; // >= NZD 1,000
    const isGoAmlExportReady = data.totalPaidNzdCents >= 100000; // All transactions >= NZD 1,000

    // Get default "OPEN" status
    const defaultStatus = await db.transactionStatus.findFirst({
      where: { isDefault: true }
    });

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        txnNumber,
        customerId: data.customerId,
        beneficiaryName: data.beneficiaryName,
        beneficiaryVillage: data.beneficiaryVillage || null,
        beneficiaryPhone: data.beneficiaryPhone || null,
        bank: data.bank || null,
        accountNumber: data.accountNumber || null,
        accountName: data.accountName || null,
        senderName: data.senderName,
        senderAddress: data.senderAddress || null,
        senderPhone: data.senderPhone,
        senderEmail: data.senderEmail || null,
        occupation: data.occupation || null,
        purposeOfTransfer: data.purposeOfTransfer || null,
        senderStreetAddress: data.senderStreetAddress || null,
        senderSuburb: data.senderSuburb || null,
        senderCity: data.senderCity || null,
        senderPostcode: data.senderPostcode || null,
        senderHomePhone: data.senderHomePhone || null,
        senderMobilePhone: data.senderMobilePhone || null,
        employerName: data.employerName || null,
        employerAddress: data.employerAddress || null,
        employerPhone: data.employerPhone || null,
        reasonForRemittance: data.reasonForRemittance || null,
        relationshipToBeneficiary: data.relationshipToBeneficiary || null,
        amountNzdCents: data.amountNzdCents,
        feeNzdCents: data.feeNzdCents,
        rate: data.rate,
        currency: data.currency,
        totalPaidNzdCents: data.totalPaidNzdCents,
        totalForeignReceived: data.totalForeignReceived,
        dob: new Date(data.dob),
        verifiedWithOriginalId: data.verifiedWithOriginalId || false,
        proofOfAddressType: data.proofOfAddressType || null,
        sourceOfFunds: data.sourceOfFunds || null,
        sourceOfFundsDetails: data.sourceOfFundsDetails || null,
        bankAccountDetails: data.bankAccountDetails || null,
        proofDocumentsProvided: data.proofDocumentsProvided || null,
        id1CountryAndType: data.id1CountryAndType || null,
        id1Number: data.id1Number || null,
        id1IssueDate: data.id1IssueDate ? new Date(data.id1IssueDate) : null,
        id1ExpiryDate: data.id1ExpiryDate ? new Date(data.id1ExpiryDate) : null,
        id2CountryAndType: data.id2CountryAndType || null,
        id2Number: data.id2Number || null,
        id2IssueDate: data.id2IssueDate ? new Date(data.id2IssueDate) : null,
        id2ExpiryDate: data.id2ExpiryDate ? new Date(data.id2ExpiryDate) : null,
        isPtrRequired,
        isGoAmlExportReady,
        agentId,
        statusId: defaultStatus?.id || null
      },
      include: {
        customer: {
          select: {
            customerId: true,
            fullName: true,
            phone: true,
            email: true
          }
        }
      }
    });

    // Send email notification if customer has email
    if (customer.email) {
      try {
        const emailContent = generateTransactionInProgressEmail({
          customerName: customer.fullName,
          txnNumber: transaction.txnNumber,
          amount: (transaction.amountNzdCents / 100).toFixed(2),
          fee: (transaction.feeNzdCents / 100).toFixed(2),
          total: (transaction.totalPaidNzdCents / 100).toFixed(2),
          currency: transaction.currency,
          foreignAmount: transaction.totalForeignReceived.toFixed(2),
          beneficiaryName: transaction.beneficiaryName
        });

        await sendEmail({
          to: customer.email,
          subject: `Transaction ${transaction.txnNumber} - In Progress`,
          html: emailContent
        });

        console.log(`Email notification sent to ${customer.email} for transaction ${transaction.txnNumber}`);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    return NextResponse.json(
      {
        transaction,
        message: 'Transaction created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/public/transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
