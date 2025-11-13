import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET /api/public/customers/[id]/ids/[fileId] - View customer ID document (public for agent portal)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;

    // Find the file record
    const file = await db.customerIdFile.findUnique({
      where: { id: fileId },
      include: { customer: true }
    });

    if (!file || file.customerId !== id) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file from disk
    const filePath = join(process.cwd(), file.filePath);

    try {
      const fileBuffer = await readFile(filePath);

      // Use the stored mimeType from database
      const contentType = file.mimeType || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${file.filePath.split('/').pop()}"`,
          'Cache-Control': 'private, max-age=3600'
        },
      });
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: 'Document file not found on disk', path: file.filePath },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('GET /api/public/customers/[id]/ids/[fileId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
