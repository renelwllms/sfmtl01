import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/fees/settings - Get fee settings (public for agent portal)
export async function GET(request: NextRequest) {
  try {
    // Get or create default settings
    let settings = await db.feeSettings.findFirst();

    if (!settings) {
      settings = await db.feeSettings.create({
        data: {
          defaultFeeNzd: 5.0,
          feeType: 'FIXED',
          feePercentage: 0.0,
          minimumFeeNzd: 0.0
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/public/fees/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
