import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { DateTime } from 'luxon';

// GET /api/reports/daily?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=json|csv
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Parse dates in Pacific/Auckland timezone
    const startDate = DateTime.fromISO(startDateParam, { zone: 'Pacific/Auckland' });
    const endDate = DateTime.fromISO(endDateParam, { zone: 'Pacific/Auckland' });

    if (!startDate.isValid || !endDate.isValid) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const startOfPeriod = startDate.startOf('day').toJSDate();
    const endOfPeriod = endDate.endOf('day').toJSDate();

    // Fetch transactions for the period
    const transactions = await db.transaction.findMany({
      where: {
        date: {
          gte: startOfPeriod,
          lte: endOfPeriod
        }
      },
      include: {
        customer: {
          select: {
            customerId: true,
            fullName: true,
            phone: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            agentCode: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by currency and calculate totals
    const summary: any = {
      WST: { count: 0, totalNzdCents: 0, totalFees: 0, totalPaid: 0, totalForeign: 0 },
      AUD: { count: 0, totalNzdCents: 0, totalFees: 0, totalPaid: 0, totalForeign: 0 },
      USD: { count: 0, totalNzdCents: 0, totalFees: 0, totalPaid: 0, totalForeign: 0 }
    };

    transactions.forEach(txn => {
      summary[txn.currency].count++;
      summary[txn.currency].totalNzdCents += txn.amountNzdCents;
      summary[txn.currency].totalFees += txn.feeNzdCents;
      summary[txn.currency].totalPaid += txn.totalPaidNzdCents;
      summary[txn.currency].totalForeign += txn.totalForeignReceived;
    });

    const report = {
      startDate: startDateParam,
      endDate: endDateParam,
      summary,
      transactions
    };

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        ['Transaction Number', 'Date', 'Source', 'Customer ID', 'Customer Name', 'Beneficiary', 'Currency', 'Amount NZD', 'Fee NZD', 'Total Paid NZD', 'Rate', 'Foreign Amount'].join(',')
      ];

      transactions.forEach(txn => {
        const source = txn.agent ? `${txn.agent.name} (${txn.agent.agentCode})` : 'Head Office';
        csvRows.push([
          txn.txnNumber,
          txn.date.toISOString(),
          source,
          txn.customer.customerId,
          txn.customer.fullName,
          txn.beneficiaryName,
          txn.currency,
          (txn.amountNzdCents / 100).toFixed(2),
          (txn.feeNzdCents / 100).toFixed(2),
          (txn.totalPaidNzdCents / 100).toFixed(2),
          txn.rate.toFixed(4),
          txn.totalForeignReceived.toFixed(2)
        ].join(','));
      });

      const csv = csvRows.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${startDateParam}-to-${endDateParam}.csv"`
        }
      });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('GET /api/reports/daily error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
