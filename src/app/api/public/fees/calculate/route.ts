import { NextRequest, NextResponse } from 'next/server';
import { calculateFee } from '@/lib/fee-calculator';

export async function POST(request: NextRequest) {
  try {
    const { amountNzd } = await request.json();

    if (!amountNzd || isNaN(parseFloat(amountNzd))) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountNzd);
    const feeNzd = await calculateFee(amount);

    return NextResponse.json({ feeNzd });
  } catch (error) {
    console.error('Fee calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate fee' },
      { status: 500 }
    );
  }
}
