import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/fees/settings - Get fee settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error('GET /api/fees/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/fees/settings - Update fee settings (Admin only)
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

    const { defaultFeeNzd, feeType, feePercentage, minimumFeeNzd, maximumFeeNzd } = body;

    // Validation
    if (typeof defaultFeeNzd !== 'number' || defaultFeeNzd < 0) {
      return NextResponse.json(
        { error: 'defaultFeeNzd must be a positive number' },
        { status: 400 }
      );
    }

    if (feeType !== 'FIXED' && feeType !== 'PERCENTAGE' && feeType !== 'BRACKET') {
      return NextResponse.json(
        { error: 'feeType must be either FIXED, PERCENTAGE, or BRACKET' },
        { status: 400 }
      );
    }

    if (typeof feePercentage !== 'number' || feePercentage < 0 || feePercentage > 100) {
      return NextResponse.json(
        { error: 'feePercentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (typeof minimumFeeNzd !== 'number' || minimumFeeNzd < 0) {
      return NextResponse.json(
        { error: 'minimumFeeNzd must be a positive number' },
        { status: 400 }
      );
    }

    if (maximumFeeNzd !== null && (typeof maximumFeeNzd !== 'number' || maximumFeeNzd < 0)) {
      return NextResponse.json(
        { error: 'maximumFeeNzd must be a positive number or null' },
        { status: 400 }
      );
    }

    // Update or create settings
    const existingSettings = await db.feeSettings.findFirst();

    let settings;
    if (existingSettings) {
      settings = await db.feeSettings.update({
        where: { id: existingSettings.id },
        data: {
          defaultFeeNzd,
          feeType,
          feePercentage,
          minimumFeeNzd,
          maximumFeeNzd,
          updatedById: userId,
          updatedAt: new Date()
        }
      });
    } else {
      settings = await db.feeSettings.create({
        data: {
          defaultFeeNzd,
          feeType,
          feePercentage,
          minimumFeeNzd,
          maximumFeeNzd,
          updatedById: userId
        }
      });
    }

    return NextResponse.json({
      settings,
      message: 'Fee settings updated successfully'
    });
  } catch (error) {
    console.error('POST /api/fees/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
