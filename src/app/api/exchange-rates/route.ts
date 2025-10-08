import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { DateTime } from 'luxon';

// GET /api/exchange-rates - Get latest or specific date rates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateKey = searchParams.get('date') || DateTime.now().setZone('Pacific/Auckland').toFormat('yyyy-MM-dd');

    const rate = await db.exchangeRate.findUnique({
      where: { dateKey }
    });

    if (!rate) {
      // Return default rates if none found
      return NextResponse.json({
        rates: {
          dateKey,
          NZD_WST: 2.1,
          NZD_AUD: 0.93,
          NZD_USD: 0.61
        },
        isDefault: true
      });
    }

    return NextResponse.json({ rates: rate, isDefault: false });
  } catch (error) {
    console.error('GET /api/exchange-rates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/exchange-rates - Set rates for a date (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const { dateKey, NZD_WST, NZD_AUD, NZD_USD } = body;

    // Validate inputs
    if (!dateKey || !NZD_WST || !NZD_AUD || !NZD_USD) {
      return NextResponse.json(
        { error: 'dateKey, NZD_WST, NZD_AUD, and NZD_USD are required' },
        { status: 400 }
      );
    }

    if (typeof NZD_WST !== 'number' || typeof NZD_AUD !== 'number' || typeof NZD_USD !== 'number') {
      return NextResponse.json(
        { error: 'Exchange rates must be numbers' },
        { status: 400 }
      );
    }

    if (NZD_WST <= 0 || NZD_AUD <= 0 || NZD_USD <= 0) {
      return NextResponse.json(
        { error: 'Exchange rates must be positive' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateKey)) {
      return NextResponse.json(
        { error: 'dateKey must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Upsert rate
    const rate = await db.exchangeRate.upsert({
      where: { dateKey },
      update: {
        NZD_WST,
        NZD_AUD,
        NZD_USD,
        updatedById: userId,
        updatedAt: new Date()
      },
      create: {
        dateKey,
        NZD_WST,
        NZD_AUD,
        NZD_USD,
        updatedById: userId
      }
    });

    return NextResponse.json({ rate });
  } catch (error) {
    console.error('POST /api/exchange-rates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
