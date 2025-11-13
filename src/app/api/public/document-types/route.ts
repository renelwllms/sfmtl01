import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/document-types - Get document types (public for agent portal)
export async function GET(request: NextRequest) {
  try {
    const documentTypes = await db.documentType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ documentTypes });
  } catch (error) {
    console.error('GET /api/public/document-types error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
