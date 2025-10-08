import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/document-types - Get all document types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentTypes = await db.documentType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ documentTypes });
  } catch (error) {
    console.error('GET /api/document-types error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/document-types - Create new document type (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = (session.user as any)?.roles || '';
    if (!hasRole(userRoles, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, label } = body;

    if (!name || !label) {
      return NextResponse.json(
        { error: 'Name and label are required' },
        { status: 400 }
      );
    }

    // Generate name from label if not provided
    const documentName = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    // Check if already exists
    const existing = await db.documentType.findUnique({
      where: { name: documentName }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Document type with this name already exists' },
        { status: 409 }
      );
    }

    // Get max order
    const maxOrder = await db.documentType.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const documentType = await db.documentType.create({
      data: {
        name: documentName,
        label,
        isDefault: false,
        isActive: true,
        order: (maxOrder?.order || 0) + 1
      }
    });

    return NextResponse.json({ documentType }, { status: 201 });
  } catch (error) {
    console.error('POST /api/document-types error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
