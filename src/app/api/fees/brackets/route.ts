import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/fees/brackets - Get all fee brackets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brackets = await db.feeBracket.findMany({
      orderBy: {
        minAmount: 'asc'
      }
    });

    return NextResponse.json({ brackets });
  } catch (error) {
    console.error('GET /api/fees/brackets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/fees/brackets - Create or update fee brackets (Admin only)
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

    const body = await request.json();
    const { brackets } = body;

    if (!Array.isArray(brackets)) {
      return NextResponse.json(
        { error: 'brackets must be an array' },
        { status: 400 }
      );
    }

    // Validate brackets
    for (const bracket of brackets) {
      if (typeof bracket.minAmount !== 'number' || bracket.minAmount < 0) {
        return NextResponse.json(
          { error: 'minAmount must be a positive number' },
          { status: 400 }
        );
      }
      if (typeof bracket.maxAmount !== 'number' || bracket.maxAmount < bracket.minAmount) {
        return NextResponse.json(
          { error: 'maxAmount must be greater than or equal to minAmount' },
          { status: 400 }
        );
      }
      if (typeof bracket.feeAmount !== 'number' || bracket.feeAmount < 0) {
        return NextResponse.json(
          { error: 'feeAmount must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Delete all existing brackets
    await db.feeBracket.deleteMany({});

    // Create new brackets
    const createdBrackets = await Promise.all(
      brackets.map((bracket: any) =>
        db.feeBracket.create({
          data: {
            minAmount: bracket.minAmount,
            maxAmount: bracket.maxAmount,
            feeAmount: bracket.feeAmount
          }
        })
      )
    );

    return NextResponse.json({
      brackets: createdBrackets,
      message: 'Fee brackets updated successfully'
    });
  } catch (error) {
    console.error('POST /api/fees/brackets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
