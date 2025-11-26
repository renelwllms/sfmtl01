import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateFee } from '@/lib/fee-calculator';

// POST /api/fees/calculate - Calculate fee for a given amount
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amountNzd } = body;

    if (typeof amountNzd !== 'number' || amountNzd < 0) {
      return NextResponse.json(
        { error: 'amountNzd must be a positive number' },
        { status: 400 }
      );
    }

    const feeNzd = await calculateFee(amountNzd);

    return NextResponse.json({ feeNzd });
  } catch (error) {
    console.error('POST /api/fees/calculate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
