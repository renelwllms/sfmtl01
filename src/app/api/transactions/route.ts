import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { TransactionSchema } from '@/lib/validators';
import { nextTxnNumber } from '@/lib/ids';
import { logTransactionActivity, getRequestInfo } from '@/lib/activity-log';

// GET /api/transactions - List transactions with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const currency = searchParams.get('currency') || '';
    const searchTerm = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (customerId) {
      where.customerId = customerId;
    }

    if (currency) {
      where.currency = currency;
    }

    if (searchTerm) {
      where.OR = [
        { customer: { fullName: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { customerId: { contains: searchTerm, mode: 'insensitive' } } },
        { beneficiaryName: { contains: searchTerm, mode: 'insensitive' } },
        { txnNumber: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'date':
        orderBy = { createdAt: sortOrder };
        break;
      case 'amount':
        orderBy = { amountNzdCents: sortOrder };
        break;
      case 'customer':
        orderBy = { customer: { fullName: sortOrder } };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    // Fetch transactions
    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              customerId: true,
              fullName: true,
              phone: true
            }
          },
          createdBy: {
            select: {
              email: true
            }
          }
        }
      }),
      db.transaction.count({ where })
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    // Validate input
    const validation = TransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

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

    // Generate transaction number
    const txnNumber = await nextTxnNumber();

    // Determine AML flags for international transactions
    const isInternational = data.currency !== 'WST';
    const isPtrRequired = isInternational && data.totalPaidNzdCents >= 100000; // >= NZD 1,000
    const isGoAmlExportReady = isPtrRequired; // Same criteria for now

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
        amountNzdCents: data.amountNzdCents,
        feeNzdCents: data.feeNzdCents,
        rate: data.rate,
        currency: data.currency,
        totalPaidNzdCents: data.totalPaidNzdCents,
        totalForeignReceived: data.totalForeignReceived,
        dob: data.dob,
        verifiedWithOriginalId: data.verifiedWithOriginalId,
        proofOfAddressType: data.proofOfAddressType || null,
        sourceOfFunds: data.sourceOfFunds || null,
        id1CountryAndType: data.id1CountryAndType || null,
        id1Number: data.id1Number || null,
        id1IssueDate: data.id1IssueDate || null,
        id1ExpiryDate: data.id1ExpiryDate || null,
        id2CountryAndType: data.id2CountryAndType || null,
        id2Number: data.id2Number || null,
        id2IssueDate: data.id2IssueDate || null,
        id2ExpiryDate: data.id2ExpiryDate || null,
        isPtrRequired,
        isGoAmlExportReady,
        createdById: userId
      },
      include: {
        customer: {
          select: {
            customerId: true,
            fullName: true
          }
        }
      }
    });

    // Log transaction creation
    const { ipAddress, userAgent } = getRequestInfo(request);
    await logTransactionActivity(
      'TRANSACTION_CREATED',
      transaction.id,
      transaction.txnNumber,
      userId,
      (session.user as any).email,
      `Transaction ${transaction.txnNumber} created for customer ${customer.fullName} - ${data.currency} ${data.totalForeignReceived.toFixed(2)}`,
      {
        customerId: customer.customerId,
        customerName: customer.fullName,
        amount: data.amountNzdCents / 100,
        currency: data.currency,
        beneficiaryName: data.beneficiaryName,
        ipAddress,
        userAgent
      }
    );

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
