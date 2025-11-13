import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/agents/[id]/transactions - Get transactions for a specific agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date'); // YYYY-MM-DD for specific day (legacy support)
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD for range start
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD for range end
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {
      agentId: id === 'head-office' ? null : id
    };

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include the end date
      where.date = {
        gte: start,
        lt: end
      };
    } else if (date) {
      // Legacy single date support
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = {
        gte: targetDate,
        lt: nextDay
      };
    }

    const skip = (page - 1) * limit;

    // Fetch transactions and count
    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
      }),
      db.transaction.count({ where })
    ]);

    // Calculate totals
    const totals = await db.transaction.aggregate({
      where,
      _sum: {
        totalPaidNzdCents: true
      }
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      totals: {
        totalPaidNzd: (totals._sum.totalPaidNzdCents || 0) / 100,
        transactionCount: totalCount
      }
    });
  } catch (error) {
    console.error('GET /api/agents/[id]/transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
