import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { DateTime } from 'luxon';

// GET /api/reports/daily?date=YYYY-MM-DD&format=json|csv
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const format = searchParams.get('format') || 'json';

    if (!dateParam) {
      return NextResponse.json(
        { error: 'date parameter is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Parse date in Pacific/Auckland timezone
    const date = DateTime.fromISO(dateParam, { zone: 'Pacific/Auckland' });
    if (!date.isValid) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const startOfDay = date.startOf('day').toJSDate();
    const endOfDay = date.endOf('day').toJSDate();

    // Fetch transactions for the day
    const transactions = await db.transaction.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        customer: {
          select: {
            customerId: true,
            fullName: true,
            phone: true
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
      date: dateParam,
      summary,
      transactions
    };

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        ['Transaction Number', 'Date', 'Customer ID', 'Customer Name', 'Beneficiary', 'Currency', 'Amount NZD', 'Fee NZD', 'Total Paid NZD', 'Rate', 'Foreign Amount'].join(',')
      ];

      transactions.forEach(txn => {
        csvRows.push([
          txn.txnNumber,
          txn.date.toISOString(),
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
          'Content-Disposition': `attachment; filename="daily-report-${dateParam}.csv"`
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
