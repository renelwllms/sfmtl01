import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/customers/[id] - Get customer details (public for agent portal)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        ids: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('GET /api/public/customers/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
