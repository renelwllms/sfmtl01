import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { DateTime } from 'luxon';

// POST /api/exchange-rates/update - Fetch latest rates from exchangerate-api.com and update DB
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || '';
    if (!hasRole(userRoles, 'ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Get API key from environment
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Exchange rate API key not configured. Please add EXCHANGE_RATE_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    // Fetch latest rates from exchangerate-api.com
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/NZD`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch exchange rates: ${response.statusText}` },
        { status: response.status }
      );
    }

    const apiData = await response.json();

    if (apiData.result !== 'success') {
      return NextResponse.json(
        { error: 'Exchange rate API returned an error' },
        { status: 500 }
      );
    }

    // Extract rates we need (NZD to WST, AUD, USD)
    const NZD_WST = apiData.conversion_rates?.WST;
    const NZD_AUD = apiData.conversion_rates?.AUD;
    const NZD_USD = apiData.conversion_rates?.USD;

    if (!NZD_WST || !NZD_AUD || !NZD_USD) {
      return NextResponse.json(
        { error: 'Required currency rates not found in API response' },
        { status: 500 }
      );
    }

    // Get today's date in Pacific/Auckland timezone
    const dateKey = DateTime.now().setZone('Pacific/Auckland').toFormat('yyyy-MM-dd');

    // Store in database
    const rate = await db.exchangeRate.upsert({
      where: { dateKey },
      update: {
        NZD_WST,
        NZD_AUD,
        NZD_USD,
        source: 'API',
        apiResponse: JSON.stringify(apiData),
        updatedById: userId,
        updatedAt: new Date()
      },
      create: {
        dateKey,
        NZD_WST,
        NZD_AUD,
        NZD_USD,
        source: 'API',
        apiResponse: JSON.stringify(apiData),
        updatedById: userId
      }
    });

    return NextResponse.json({
      success: true,
      rate: {
        dateKey: rate.dateKey,
        NZD_WST: rate.NZD_WST,
        NZD_AUD: rate.NZD_AUD,
        NZD_USD: rate.NZD_USD,
        source: rate.source,
        updatedAt: rate.updatedAt
      },
      apiInfo: {
        lastUpdated: apiData.time_last_update_utc,
        nextUpdate: apiData.time_next_update_utc
      }
    });
  } catch (error) {
    console.error('POST /api/exchange-rates/update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/exchange-rates/update - Check when rates were last updated
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dateKey = DateTime.now().setZone('Pacific/Auckland').toFormat('yyyy-MM-dd');

    const rate = await db.exchangeRate.findUnique({
      where: { dateKey }
    });

    if (!rate) {
      return NextResponse.json({
        hasRates: false,
        message: 'No rates found for today. Click "Update Rates" to fetch from API.'
      });
    }

    return NextResponse.json({
      hasRates: true,
      rate: {
        dateKey: rate.dateKey,
        NZD_WST: rate.NZD_WST,
        NZD_AUD: rate.NZD_AUD,
        NZD_USD: rate.NZD_USD,
        source: rate.source,
        updatedAt: rate.updatedAt
      }
    });
  } catch (error) {
    console.error('GET /api/exchange-rates/update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
