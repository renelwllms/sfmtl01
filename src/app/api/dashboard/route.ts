import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { DateTime } from 'luxon';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = DateTime.now().setZone('Pacific/Auckland');
    const currentMonthStart = now.startOf('month').toJSDate();
    const lastMonthStart = now.minus({ months: 1 }).startOf('month').toJSDate();
    const lastMonthEnd = now.minus({ months: 1 }).endOf('month').toJSDate();
    const yearStart = now.startOf('year').toJSDate();

    // Get all transactions for the year
    const yearTransactions = await db.transaction.findMany({
      where: {
        date: {
          gte: yearStart
        }
      },
      select: {
        date: true,
        totalPaidNzdCents: true,
        feeNzdCents: true,
        currency: true,
        amountNzdCents: true
      }
    });

    // Current month transactions
    const currentMonthTransactions = await db.transaction.findMany({
      where: {
        date: {
          gte: currentMonthStart
        }
      }
    });

    // Last month transactions
    const lastMonthTransactions = await db.transaction.findMany({
      where: {
        date: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    });

    // Calculate totals
    const totalAmountTransferred = yearTransactions.reduce(
      (sum, txn) => sum + txn.amountNzdCents,
      0
    );

    const totalFeesCollected = yearTransactions.reduce(
      (sum, txn) => sum + txn.feeNzdCents,
      0
    );

    const currentMonthTotal = currentMonthTransactions.reduce(
      (sum, txn) => sum + txn.totalPaidNzdCents,
      0
    );

    const lastMonthTotal = lastMonthTransactions.reduce(
      (sum, txn) => sum + txn.totalPaidNzdCents,
      0
    );

    // Monthly breakdown for the year
    const monthlyData = new Map<string, { count: number; amount: number }>();

    yearTransactions.forEach((txn) => {
      const monthKey = DateTime.fromJSDate(txn.date)
        .setZone('Pacific/Auckland')
        .toFormat('yyyy-MM');

      const existing = monthlyData.get(monthKey) || { count: 0, amount: 0 };
      monthlyData.set(monthKey, {
        count: existing.count + 1,
        amount: existing.amount + txn.totalPaidNzdCents
      });
    });

    const monthlyBreakdown = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          month: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
          count: data.count,
          amount: data.amount / 100 // Convert cents to dollars
        };
      });

    // Currency breakdown
    const currencyBreakdown = yearTransactions.reduce((acc, txn) => {
      const currency = txn.currency;
      if (!acc[currency]) {
        acc[currency] = { count: 0, amount: 0 };
      }
      acc[currency].count += 1;
      acc[currency].amount += txn.totalPaidNzdCents;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Top customers
    const topCustomers = await db.transaction.groupBy({
      by: ['customerId'],
      where: {
        date: {
          gte: yearStart
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalPaidNzdCents: true
      },
      orderBy: {
        _sum: {
          totalPaidNzdCents: 'desc'
        }
      },
      take: 5
    });

    // Get customer details for top customers
    const topCustomersWithDetails = await Promise.all(
      topCustomers.map(async (customer) => {
        const details = await db.customer.findUnique({
          where: { id: customer.customerId },
          select: { fullName: true, customerId: true }
        });
        return {
          name: details?.fullName || 'Unknown',
          customerId: details?.customerId || '',
          transactionCount: customer._count.id,
          totalAmount: customer._sum.totalPaidNzdCents || 0
        };
      })
    );

    // Total customers
    const totalCustomers = await db.customer.count();

    // Recent activity (last 7 days)
    const sevenDaysAgo = now.minus({ days: 7 }).toJSDate();
    const recentTransactions = await db.transaction.count({
      where: {
        date: {
          gte: sevenDaysAgo
        }
      }
    });

    return NextResponse.json({
      summary: {
        totalAmountTransferred,
        totalFeesCollected,
        currentMonthTotal,
        lastMonthTotal,
        currentMonthCount: currentMonthTransactions.length,
        lastMonthCount: lastMonthTransactions.length,
        totalTransactions: yearTransactions.length,
        totalCustomers,
        recentTransactions
      },
      monthlyBreakdown,
      currencyBreakdown,
      topCustomers: topCustomersWithDetails
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
