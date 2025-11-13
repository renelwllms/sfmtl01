import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// POST /api/public/customers/[id]/ids - Upload ID document (public for agent portal)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'OTHER';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'customer-ids', id);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = path.join(uploadsDir, fileName);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Store file reference in database
    const idFile = await db.customerIdFile.create({
      data: {
        customerId: id,
        filePath: `/uploads/customer-ids/${id}/${fileName}`,
        mimeType: file.type,
        documentType: documentType as any
      }
    });

    return NextResponse.json(
      {
        file: idFile,
        message: 'ID document uploaded successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/public/customers/[id]/ids error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
