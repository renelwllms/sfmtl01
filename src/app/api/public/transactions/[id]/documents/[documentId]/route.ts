import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET /api/public/transactions/[id]/documents/[documentId] - Get a specific document file (public for agent portal)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params;

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
    console.error('GET /api/public/transactions/[id]/documents/[documentId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
