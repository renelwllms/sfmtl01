import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { logActivity } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the file record
    const file = await db.transactionSourceOfFundsFile.findUnique({
      where: { id: fileId },
      include: { transaction: true }
    });

    if (!file || file.transactionId !== id) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file from disk
    const filePath = join(process.cwd(), file.filePath);
    const fileBuffer = await readFile(filePath);

    // Log activity
    await logActivity({
      type: 'TRANSACTION_SOF_VIEWED',
      userId: (session.user as any)?.id,
      userEmail: session.user?.email || undefined,
      description: `Viewed source of funds document for transaction ${file.transaction.txnNumber}`,
      entityType: 'Transaction',
      entityId: file.transactionId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    // Use the stored mimeType from database
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/transactions/[id]/source-of-funds/[fileId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id]/source-of-funds/[fileId] - Delete a source of funds file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the file record
    const file = await db.transactionSourceOfFundsFile.findUnique({
      where: { id: fileId },
      include: { transaction: true }
    });

    if (!file || file.transactionId !== id) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from database (file on disk will remain for audit purposes)
    await db.transactionSourceOfFundsFile.delete({
      where: { id: fileId }
    });

    // Log activity
    await logActivity({
      type: 'TRANSACTION_SOF_VIEWED', // Using viewed as there's no deleted type yet
      userId: (session.user as any)?.id,
      userEmail: session.user?.email || undefined,
      description: `Deleted source of funds document for transaction ${file.transaction.txnNumber}`,
      entityType: 'Transaction',
      entityId: file.transactionId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/transactions/[id]/source-of-funds/[fileId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
