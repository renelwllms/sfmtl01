import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

// GET /api/customers/[id] - Get customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        ids: true,
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = (session.user as any)?.roles || '';
    if (!hasRole(userRoles, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get customer before deleting for activity log
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        transactions: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check if customer has transactions
    if (customer.transactions.length > 0) {
      return NextResponse.json({
        error: `Cannot delete customer with ${customer.transactions.length} transaction(s). Please delete or reassign transactions first.`
      }, { status: 400 });
    }

    // Delete customer ID files first
    await db.customerIdFile.deleteMany({
      where: { customerId }
    });

    // Delete customer
    await db.customer.delete({
      where: { id: customerId }
    });

    // Log activity
    await logActivity({
      type: 'CUSTOMER_UPDATED',
      userId: (session.user as any).id,
      userEmail: session.user.email || '',
      description: `Deleted customer: ${customer.fullName} (${customer.customerId})`,
      entityType: 'Customer',
      entityId: customerId
    });

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
