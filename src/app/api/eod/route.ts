import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

// GET /api/eod - List EOD reconciliations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');
    const date = searchParams.get('date'); // YYYY-MM-DD
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};

    if (agentId) {
      where.agentId = agentId === 'head-office' ? null : agentId;
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = {
        gte: targetDate,
        lt: nextDay
      };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        where.date.lt = endDateObj;
      }
    }

    // Get total count
    const total = await db.eodReconciliation.count({ where });

    // Get paginated results
    const eodRecords = await db.eodReconciliation.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            agentCode: true,
            location: true,
            isHeadOffice: true
          }
        }
      }
    });

    return NextResponse.json({
      eodRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching EOD records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch EOD records' },
      { status: 500 }
    );
  }
}

// POST /api/eod - Create/Initialize an EOD reconciliation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    const body = await request.json();
    const { agentId, date } = body;

    // Validate required fields
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const eodDate = new Date(date);
    const nextDay = new Date(eodDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Calculate system totals for this agent and date
    const where: any = {
      date: {
        gte: eodDate,
        lt: nextDay
      }
    };

    if (agentId) {
      where.agentId = agentId;
    } else {
      // Head office - null agentId
      where.agentId = null;
    }

    const transactions = await db.transaction.findMany({
      where,
      select: {
        totalPaidNzdCents: true
      }
    });

    const systemTotalCents = transactions.reduce(
      (sum, txn) => sum + txn.totalPaidNzdCents,
      0
    );
    const systemTransactionCount = transactions.length;

    // Check if EOD already exists for this agent and date
    const existing = await db.eodReconciliation.findUnique({
      where: {
        date_agentId: {
          date: eodDate,
          agentId: agentId || null
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'EOD reconciliation already exists for this date and agent' },
        { status: 409 }
      );
    }

    // Create EOD record
    const eodRecord = await db.eodReconciliation.create({
      data: {
        date: eodDate,
        agentId: agentId || null,
        systemTotalCents,
        systemTransactionCount,
        cashReceivedCents: 0, // To be filled by user
        differenceCents: 0, // Will be calculated when cash is entered
        status: 'PENDING'
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            agentCode: true,
            location: true,
            isHeadOffice: true
          }
        }
      }
    });

    // Log activity
    if (user) {
      await logActivity({
        type: 'SETTINGS_CHANGED',
        userId: user.id,
        userEmail: user.email,
        description: `Initialized EOD reconciliation for ${agentId ? eodRecord.agent?.name : 'Head Office'} on ${eodDate.toLocaleDateString()}`,
        metadata: { eodId: eodRecord.id, agentId: agentId }
      });
    }

    return NextResponse.json(eodRecord, { status: 201 });
  } catch (error: any) {
    console.error('Error creating EOD record:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'EOD reconciliation already exists for this date and agent' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create EOD record' },
      { status: 500 }
    );
  }
}
