import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DateTime } from 'luxon';

// GET /api/public/exchange-rates - Get latest exchange rates (public for agent portal)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateKey = searchParams.get('date') || DateTime.now().setZone('Pacific/Auckland').toFormat('yyyy-MM-dd');

    const rate = await db.exchangeRate.findUnique({
      where: { dateKey }
    });

    // Get profit margin settings
    const settings = await db.exchangeRateSettings.findFirst();
    const profitMarginPercent = settings?.profitMarginPercent || 0;

    if (!rate) {
      // Return default rates if none found
      const defaultRates = {
        NZD_WST: 2.1,
        NZD_AUD: 0.93,
        NZD_USD: 0.61
      };

      // Apply profit margin to default rates
      const multiplier = 1 + (profitMarginPercent / 100);
      return NextResponse.json({
        rates: {
          dateKey,
          NZD_WST: defaultRates.NZD_WST * multiplier,
          NZD_AUD: defaultRates.NZD_AUD * multiplier,
          NZD_USD: defaultRates.NZD_USD * multiplier,
          baseNZD_WST: defaultRates.NZD_WST,
          baseNZD_AUD: defaultRates.NZD_AUD,
          baseNZD_USD: defaultRates.NZD_USD,
          profitMarginPercent
        },
        isDefault: true
      });
    }

    // Apply profit margin to actual rates
    const multiplier = 1 + (profitMarginPercent / 100);
    return NextResponse.json({
      rates: {
        ...rate,
        baseNZD_WST: rate.NZD_WST,
        baseNZD_AUD: rate.NZD_AUD,
        baseNZD_USD: rate.NZD_USD,
        NZD_WST: rate.NZD_WST * multiplier,
        NZD_AUD: rate.NZD_AUD * multiplier,
        NZD_USD: rate.NZD_USD * multiplier,
        profitMarginPercent
      },
      isDefault: false
    });
  } catch (error) {
    console.error('GET /api/public/exchange-rates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
