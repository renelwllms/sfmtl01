import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE /api/transactions/:id/family-contributions/:contributionId - Delete a specific family contribution
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contributionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, contributionId } = await params;

    // Verify contribution exists and belongs to this transaction
    const contribution = await db.familyContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    if (contribution.transactionId !== id) {
      return NextResponse.json(
        { error: 'Contribution does not belong to this transaction' },
        { status: 400 }
      );
    }

    // Delete the contribution
    await db.familyContribution.delete({
      where: { id: contributionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting family contribution:', error);
    return NextResponse.json(
      { error: 'Failed to delete family contribution' },
      { status: 500 }
    );
  }
}
