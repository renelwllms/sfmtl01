import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { logActivity } from '@/lib/activity-logger';

export const config = {
  api: {
    bodyParser: false
  }
};

// POST /api/transactions/[id]/source-of-funds - Upload source of funds file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if transaction exists
    const transaction = await db.transaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type (images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDFs are allowed.' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'transactions', transaction.txnNumber, 'source-of-funds');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save to database
    const relativePath = `uploads/transactions/${transaction.txnNumber}/source-of-funds/${filename}`;
    const sofFile = await db.transactionSourceOfFundsFile.create({
      data: {
        transactionId: transaction.id,
        filePath: relativePath,
        fileName: file.name,
        mimeType: file.type
      }
    });

    // Log activity
    await logActivity({
      type: 'TRANSACTION_SOF_UPLOADED',
      userId: (session.user as any)?.id,
      userEmail: session.user?.email || undefined,
      description: `Uploaded source of funds document for transaction ${transaction.txnNumber}`,
      entityType: 'Transaction',
      entityId: transaction.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({ file: sofFile }, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions/[id]/source-of-funds error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/transactions/[id]/source-of-funds - Get all source of funds files for a transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if transaction exists
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        sourceOfFundsFiles: true
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ files: transaction.sourceOfFundsFiles }, { status: 200 });
  } catch (error) {
    console.error('GET /api/transactions/[id]/source-of-funds error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
