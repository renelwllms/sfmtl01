import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE /api/document-types/[id] - Delete/deactivate document type (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = (session.user as any)?.roles || '';
    if (!hasRole(userRoles, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const documentType = await db.documentType.findUnique({
      where: { id }
    });

    if (!documentType) {
      return NextResponse.json({ error: 'Document type not found' }, { status: 404 });
    }

    // Don't allow deleting default types, just deactivate them
    if (documentType.isDefault) {
      await db.documentType.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({ message: 'Document type deactivated' });
    }

    // For custom types, actually delete them
    await db.documentType.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Document type deleted' });
  } catch (error) {
    console.error('DELETE /api/document-types/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/document-types/[id] - Update document type (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = (session.user as any)?.roles || '';
    if (!hasRole(userRoles, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { label, isActive } = body;

    const documentType = await db.documentType.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ documentType });
  } catch (error) {
    console.error('PATCH /api/document-types/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
