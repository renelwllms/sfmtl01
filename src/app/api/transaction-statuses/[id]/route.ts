import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

// PATCH /api/transaction-statuses/[id] - Update a transaction status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, label, color, isDefault, isActive, order } = body;

    // Check if status exists
    const existingStatus = await db.transactionStatus.findUnique({
      where: { id }
    });

    if (!existingStatus) {
      return NextResponse.json(
        { error: 'Transaction status not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset any existing default
    if (isDefault) {
      await db.transactionStatus.updateMany({
        where: {
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    // Update the status
    const status = await db.transactionStatus.update({
      where: { id },
      data: {
        ...(name && { name: name.toUpperCase() }),
        ...(label && { label }),
        ...(color !== undefined && { color }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order })
      }
    });

    // Log activity
    await logActivity({
      type: 'SETTINGS_CHANGED',
      userId: user.id,
      userEmail: user.email,
      description: `Updated transaction status: ${status.label}`,
      metadata: { statusId: status.id, statusName: status.name }
    });

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error updating transaction status:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A status with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update transaction status' },
      { status: 500 }
    );
  }
}

// DELETE /api/transaction-statuses/[id] - Delete a transaction status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if status exists and count transactions using it
    const status = await db.transactionStatus.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    if (!status) {
      return NextResponse.json(
        { error: 'Transaction status not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if transactions are using this status
    if (status._count.transactions > 0) {
      return NextResponse.json(
        { error: `Cannot delete status with ${status._count.transactions} transaction(s). Set it to inactive instead.` },
        { status: 400 }
      );
    }

    // Delete the status
    await db.transactionStatus.delete({
      where: { id }
    });

    // Log activity
    await logActivity({
      type: 'SETTINGS_CHANGED',
      userId: user.id,
      userEmail: user.email,
      description: `Deleted transaction status: ${status.label}`,
      metadata: { statusId: status.id, statusName: status.name }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction status:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction status' },
      { status: 500 }
    );
  }
}
