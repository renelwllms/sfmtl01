import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';

// GET /api/transactions/[id]/documents/[documentId] - Get a specific document file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the document record
    const document = await db.transactionDocument.findUnique({
      where: { id: documentId },
      include: { transaction: true }
    });

    if (!document || document.transactionId !== id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Read file from disk
    const filePath = join(process.cwd(), document.filePath);
    const fileBuffer = await readFile(filePath);

    // Return file with proper content type
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `inline; filename="${document.filePath.split('/').pop()}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/transactions/[id]/documents/[documentId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id]/documents/[documentId] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the document record
    const document = await db.transactionDocument.findUnique({
      where: { id: documentId },
      include: { transaction: true }
    });

    if (!document || document.transactionId !== id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete file from disk
    const filePath = join(process.cwd(), document.filePath);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db.transactionDocument.delete({
      where: { id: documentId }
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/transactions/[id]/documents/[documentId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
