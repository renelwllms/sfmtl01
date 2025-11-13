import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/exchange-rates/settings - Get exchange rate settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create default settings
    let settings = await db.exchangeRateSettings.findFirst();

    if (!settings) {
      settings = await db.exchangeRateSettings.create({
        data: {
          autoUpdateEnabled: false,
          updateFrequencyHours: 24,
          profitMarginPercent: 0.0
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/exchange-rates/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/exchange-rates/settings - Update exchange rate settings
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
    const body = await request.json();

    const { autoUpdateEnabled, updateFrequencyHours, profitMarginPercent } = body;

    // Validation
    if (typeof autoUpdateEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'autoUpdateEnabled must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof updateFrequencyHours !== 'number' || updateFrequencyHours < 1 || updateFrequencyHours > 168) {
      return NextResponse.json(
        { error: 'updateFrequencyHours must be between 1 and 168 (1 week)' },
        { status: 400 }
      );
    }

    if (typeof profitMarginPercent !== 'number' || profitMarginPercent < 0 || profitMarginPercent > 100) {
      return NextResponse.json(
        { error: 'profitMarginPercent must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Calculate next update time if auto-update is enabled
    const nextAutoUpdateAt = autoUpdateEnabled
      ? new Date(Date.now() + updateFrequencyHours * 60 * 60 * 1000)
      : null;

    // Update or create settings
    const existingSettings = await db.exchangeRateSettings.findFirst();

    let settings;
    if (existingSettings) {
      settings = await db.exchangeRateSettings.update({
        where: { id: existingSettings.id },
        data: {
          autoUpdateEnabled,
          updateFrequencyHours,
          profitMarginPercent,
          nextAutoUpdateAt,
          updatedById: userId,
          updatedAt: new Date()
        }
      });
    } else {
      settings = await db.exchangeRateSettings.create({
        data: {
          autoUpdateEnabled,
          updateFrequencyHours,
          profitMarginPercent,
          nextAutoUpdateAt,
          updatedById: userId
        }
      });
    }

    return NextResponse.json({
      settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('POST /api/exchange-rates/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
