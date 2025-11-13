import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/customers/search - Public customer search for agent portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');
    const agentCode = searchParams.get('agentCode'); // Optional: to verify agent exists

    if (!search || search.length < 3) {
      return NextResponse.json(
        { error: 'Search term must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Optional: Verify agent exists and is active
    if (agentCode) {
      const agent = await db.agent.findUnique({
        where: { agentCode }
      });

      if (!agent || agent.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Invalid or inactive agent' },
          { status: 403 }
        );
      }
    }

    // Search customers
    const customers = await db.customer.findMany({
      where: {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { customerId: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerId: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phone: true,
        email: true,
        address: true,
        dob: true
      }
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('GET /api/public/customers/search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
