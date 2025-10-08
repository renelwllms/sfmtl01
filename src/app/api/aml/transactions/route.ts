import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/aml/transactions - Get AML transactions (PTR or goAML export)
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
    const type = searchParams.get('type'); // 'ptr' or 'goaml'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause based on type
    const where: any = {};

    if (type === 'ptr') {
      // PTR Required: All international transactions >= NZD 1,000
      where.isPtrRequired = true;
    } else if (type === 'goaml') {
      // goAML Export: International transactions >= NZD 1,000 that haven't been exported yet
      where.isGoAmlExportReady = true;
      where.goAmlExportedAt = null;
    } else {
      return NextResponse.json({ error: 'Invalid type parameter. Use "ptr" or "goaml"' }, { status: 400 });
    }

    // Fetch transactions with customer data
    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              customerId: true,
              firstName: true,
              lastName: true,
              fullName: true,
              phone: true,
              email: true,
              address: true,
              dob: true
            }
          },
          createdBy: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.transaction.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching AML transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/aml/transactions/export - Mark transactions as exported to goAML
export async function POST(request: NextRequest) {
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

    const { transactionIds } = await request.json();

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: 'Transaction IDs array is required' }, { status: 400 });
    }

    // Mark transactions as exported
    await db.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        isGoAmlExportReady: true,
        goAmlExportedAt: null
      },
      data: {
        goAmlExportedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${transactionIds.length} transaction(s) marked as exported to goAML`
    });
  } catch (error) {
    console.error('Error marking transactions as exported:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
