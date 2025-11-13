import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logTransactionActivity, getRequestInfo } from '@/lib/activity-log';
import { sendEmail, generateTransactionCompletedEmail } from '@/lib/email';

// PATCH /api/transactions/[id]/status - Update transaction status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { statusId } = body;

    // Validate required fields
    if (!statusId) {
      return NextResponse.json(
        { error: 'Status ID is required' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            fullName: true,
            email: true
          }
        },
        status: {
          select: {
            label: true,
            name: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if status exists
    const newStatus = await db.transactionStatus.findUnique({
      where: { id: statusId }
    });

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Status not found' },
        { status: 404 }
      );
    }

    // Update transaction status
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: { statusId },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            fullName: true,
            phone: true
          }
        },
        createdBy: {
          select: {
            email: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            agentCode: true,
            isHeadOffice: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            label: true,
            color: true
          }
        }
      }
    });

    // Log activity
    const { ipAddress, userAgent } = getRequestInfo(request);
    const userId = (session.user as any).id;
    const userEmail = (session.user as any).email;

    const oldStatusLabel = transaction.status?.label || 'No Status';
    const newStatusLabel = newStatus.label;

    await logTransactionActivity(
      'TRANSACTION_VIEWED',
      transaction.id,
      transaction.txnNumber,
      userId,
      userEmail,
      `Transaction ${transaction.txnNumber} status changed from "${oldStatusLabel}" to "${newStatusLabel}"`,
      {
        customerId: transaction.customer.fullName,
        oldStatus: oldStatusLabel,
        newStatus: newStatusLabel,
        ipAddress,
        userAgent
      }
    );

    // Send completion email if status is COMPLETED
    if (newStatus.name === 'COMPLETED' && transaction.customer.email) {
      try {
        const emailHtml = generateTransactionCompletedEmail(updatedTransaction);
        await sendEmail({
          to: transaction.customer.email,
          subject: `Transaction ${transaction.txnNumber} - Completed`,
          html: emailHtml
        });
        console.log(`Completion email sent to ${transaction.customer.email} for transaction ${transaction.txnNumber}`);
      } catch (emailError) {
        // Log email error but don't fail the status update
        console.error('Failed to send completion email:', emailError);
      }
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('PATCH /api/transactions/[id]/status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
