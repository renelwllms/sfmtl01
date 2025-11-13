import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { DateTime } from 'luxon';

// GET /api/reports/monthly?month=YYYY-MM&format=json|csv
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const format = searchParams.get('format') || 'json';

    if (!monthParam) {
      return NextResponse.json(
        { error: 'month parameter is required (YYYY-MM)' },
        { status: 400 }
      );
    }

    // Parse month in Pacific/Auckland timezone
    const month = DateTime.fromFormat(monthParam, 'yyyy-MM', { zone: 'Pacific/Auckland' });
    if (!month.isValid) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    const startOfMonth = month.startOf('month').toJSDate();
    const endOfMonth = month.endOf('month').toJSDate();

    // Fetch transactions for the month
    const transactions = await db.transaction.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
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
      month: monthParam,
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
          'Content-Disposition': `attachment; filename="monthly-report-${monthParam}.csv"`
        }
      });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('GET /api/reports/monthly error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
