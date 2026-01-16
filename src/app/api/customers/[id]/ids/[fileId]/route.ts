import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

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
    const file = await db.customerIdFile.findUnique({
      where: { id: fileId },
      include: { customer: true }
    });

    if (!file || file.customerId !== id) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file from disk
    const filePath = join(process.cwd(), file.filePath);
    const fileBuffer = await readFile(filePath);

    // Determine content type
    let contentType = 'application/octet-stream';
    if (file.filePath.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (file.filePath.match(/\.(jpg|jpeg)$/i)) {
      contentType = 'image/jpeg';
    } else if (file.filePath.endsWith('.png')) {
      contentType = 'image/png';
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${file.filePath.split('/').pop()}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/customers/[id]/ids/[fileId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
