import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

// GET /api/transaction-statuses - List all transaction statuses
export async function GET() {
  try {
    const statuses = await db.transactionStatus.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching transaction statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction statuses' },
      { status: 500 }
    );
  }
}

// POST /api/transaction-statuses - Create a new transaction status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user || !user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, label, color, isDefault, isActive, order } = body;

    // Validate required fields
    if (!name || !label) {
      return NextResponse.json(
        { error: 'Name and label are required' },
        { status: 400 }
      );
    }

    // If this is set as default, unset any existing default
    if (isDefault) {
      await db.transactionStatus.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create the new status
    const status = await db.transactionStatus.create({
      data: {
        name: name.toUpperCase(),
        label,
        color: color || null,
        isDefault: isDefault || false,
        isActive: isActive !== false, // Default to true
        order: order || 0
      }
    });

    // Log activity
    await logActivity({
      type: 'SETTINGS_CHANGED',
      userId: user.id,
      userEmail: user.email,
      description: `Created transaction status: ${label}`,
      metadata: { statusId: status.id, statusName: status.name }
    });

    return NextResponse.json(status, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction status:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A status with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create transaction status' },
      { status: 500 }
    );
  }
}
