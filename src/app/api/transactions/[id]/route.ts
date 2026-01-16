import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logTransactionActivity, getRequestInfo } from '@/lib/activity-log';

// GET /api/transactions/[id] - Get single transaction with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            fullName: true,
            email: true,
            phone: true,
            dob: true,
            address: true
          }
        },
        documents: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        familyContributions: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            agentCode: true,
            isHeadOffice: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            label: true,
            color: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('GET /api/transactions/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/[id] - Update beneficiary name
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { beneficiaryName } = body;

    if (!beneficiaryName || typeof beneficiaryName !== 'string' || beneficiaryName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Beneficiary name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Get current transaction for logging
    const currentTransaction = await db.transaction.findUnique({
      where: { id }
    });

    if (!currentTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Update transaction
    const transaction = await db.transaction.update({
      where: { id },
      data: {
        beneficiaryName: beneficiaryName.trim()
      },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            fullName: true,
            email: true,
            phone: true,
            dob: true,
            address: true
          }
        },
        documents: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        familyContributions: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            agentCode: true,
            isHeadOffice: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            label: true,
            color: true
          }
        }
      }
    });

    // Log the activity
    const userId = (session.user as any).id;
    const { ipAddress, userAgent } = getRequestInfo(request);
    await logTransactionActivity(
      'TRANSACTION_VIEWED',
      transaction.id,
      transaction.txnNumber,
      userId,
      (session.user as any).email,
      `Beneficiary name updated from "${currentTransaction.beneficiaryName}" to "${beneficiaryName.trim()}"`,
      {
        oldBeneficiaryName: currentTransaction.beneficiaryName,
        newBeneficiaryName: beneficiaryName.trim(),
        ipAddress,
        userAgent
      }
    );

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('PATCH /api/transactions/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
