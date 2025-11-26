import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-log';

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

// PATCH /api/customers/[id] - Update customer details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get existing customer
    const existing = await db.customer.findUnique({
      where: { id: customerId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate new fullName if first/last name changed
    const fullName = body.firstName && body.lastName
      ? `${body.firstName} ${body.lastName}`
      : existing.fullName;

    // Update customer - if mobilePhone changed, update the phone field too
    const updateData: any = {
      ...(body.firstName && { firstName: body.firstName }),
      ...(body.lastName && { lastName: body.lastName }),
      fullName,
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.address !== undefined && { address: body.address || null }),
      ...(body.streetAddress !== undefined && { streetAddress: body.streetAddress || null }),
      ...(body.suburb !== undefined && { suburb: body.suburb || null }),
      ...(body.city !== undefined && { city: body.city || null }),
      ...(body.postcode !== undefined && { postcode: body.postcode || null }),
      ...(body.homePhone !== undefined && { homePhone: body.homePhone || null }),
      ...(body.mobilePhone !== undefined && {
        mobilePhone: body.mobilePhone || null,
        phone: body.mobilePhone || existing.phone // Keep phone field in sync
      }),
      ...(body.occupation !== undefined && { occupation: body.occupation || null }),
      ...(body.employerName !== undefined && { employerName: body.employerName || null }),
      ...(body.employerAddress !== undefined && { employerAddress: body.employerAddress || null }),
      ...(body.employerPhone !== undefined && { employerPhone: body.employerPhone || null })
    };

    const customer = await db.customer.update({
      where: { id: customerId },
      data: updateData,
      include: {
        ids: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    // Log activity
    await logActivity({
      type: 'CUSTOMER_UPDATED',
      userId: (session.user as any).id,
      userEmail: session.user.email || '',
      description: `Updated customer: ${customer.fullName} (${customer.customerId})`,
      entityType: 'Customer',
      entityId: customerId
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('PATCH /api/customers/[id] error:', error);
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
