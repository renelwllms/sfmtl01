import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

// GET /api/eod/[id] - Get a specific EOD record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const eodRecord = await db.eodReconciliation.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            agentCode: true,
            location: true,
            isHeadOffice: true
          }
        }
      }
    });

    if (!eodRecord) {
      return NextResponse.json(
        { error: 'EOD record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(eodRecord);
  } catch (error) {
    console.error('Error fetching EOD record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch EOD record' },
      { status: 500 }
    );
  }
}

// PATCH /api/eod/[id] - Update EOD record (cash received, notes, status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    const { id } = await params;
    const body = await request.json();
    const { cashReceivedCents, notes, status } = body;

    // Check if EOD record exists
    const existingEod = await db.eodReconciliation.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            name: true,
            agentCode: true
          }
        }
      }
    });

    if (!existingEod) {
      return NextResponse.json(
        { error: 'EOD record not found' },
        { status: 404 }
      );
    }

    // Calculate difference if cash received is provided
    let differenceCents = existingEod.differenceCents;
    if (cashReceivedCents !== undefined) {
      differenceCents = cashReceivedCents - existingEod.systemTotalCents;
    }

    // Determine status based on difference if completing
    let finalStatus = status || existingEod.status;
    if (status === 'COMPLETED' && cashReceivedCents !== undefined) {
      if (differenceCents === 0) {
        finalStatus = 'COMPLETED';
      } else {
        finalStatus = 'DISCREPANCY';
      }
    }

    // Update the EOD record
    const updateData: any = {};
    if (cashReceivedCents !== undefined) {
      updateData.cashReceivedCents = cashReceivedCents;
      updateData.differenceCents = differenceCents;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (status !== undefined) {
      updateData.status = finalStatus;
      if (finalStatus === 'COMPLETED' || finalStatus === 'DISCREPANCY') {
        updateData.completedBy = user?.id;
        updateData.completedByEmail = user?.email;
        updateData.completedAt = new Date();
      }
    }

    const eodRecord = await db.eodReconciliation.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            agentCode: true,
            location: true,
            isHeadOffice: true
          }
        }
      }
    });

    // Log activity
    const agentName = eodRecord.agent?.name || 'Head Office';
    const dateStr = eodRecord.date.toLocaleDateString();

    let description = '';
    if (status === 'COMPLETED' || status === 'DISCREPANCY') {
      const statusText = status === 'DISCREPANCY' ? 'with discrepancy' : 'successfully';
      description = `Completed EOD reconciliation ${statusText} for ${agentName} on ${dateStr}`;
    } else {
      description = `Updated EOD reconciliation for ${agentName} on ${dateStr}`;
    }

    if (user) {
      await logActivity({
        type: 'SETTINGS_CHANGED',
        userId: user.id,
        userEmail: user.email,
        description,
        metadata: { eodId: eodRecord.id, agentId: eodRecord.agentId }
      });
    }

    return NextResponse.json(eodRecord);
  } catch (error) {
    console.error('Error updating EOD record:', error);
    return NextResponse.json(
      { error: 'Failed to update EOD record' },
      { status: 500 }
    );
  }
}

// DELETE /api/eod/[id] - Delete an EOD record (admin only)
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

    // Check if EOD record exists
    const eodRecord = await db.eodReconciliation.findUnique({
      where: { id },
      include: {
        agent: {
          select: { name: true }
        }
      }
    });

    if (!eodRecord) {
      return NextResponse.json(
        { error: 'EOD record not found' },
        { status: 404 }
      );
    }

    // Delete the EOD record
    await db.eodReconciliation.delete({
      where: { id }
    });

    // Log activity
    const agentName = eodRecord.agent?.name || 'Head Office';
    const dateStr = eodRecord.date.toLocaleDateString();

    await logActivity({
      type: 'SETTINGS_CHANGED',
      userId: user.id,
      userEmail: user.email,
      description: `Deleted EOD reconciliation for ${agentName} on ${dateStr}`,
      metadata: { eodId: eodRecord.id, agentId: eodRecord.agentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting EOD record:', error);
    return NextResponse.json(
      { error: 'Failed to delete EOD record' },
      { status: 500 }
    );
  }
}
