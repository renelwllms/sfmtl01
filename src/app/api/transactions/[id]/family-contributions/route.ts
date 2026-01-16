import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for family contribution
const FamilyContributionSchema = z.object({
  contributorName: z.string().min(1, 'Contributor name is required'),
  amountNzdCents: z.number().int().positive('Amount must be positive'),
  relationship: z.string().optional(),
});

// GET /api/transactions/:id/family-contributions - Get all family contributions for a transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify transaction exists
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        familyContributions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      familyContributions: transaction.familyContributions,
    });
  } catch (error) {
    console.error('Error fetching family contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family contributions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions/:id/family-contributions - Add a family contribution
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = FamilyContributionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { contributorName, amountNzdCents, relationship } = validationResult.data;

    // Verify transaction exists
    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Create family contribution
    const contribution = await db.familyContribution.create({
      data: {
        transactionId: id,
        contributorName,
        amountNzdCents,
        relationship,
      },
    });

    return NextResponse.json({ contribution }, { status: 201 });
  } catch (error) {
    console.error('Error creating family contribution:', error);
    return NextResponse.json(
      { error: 'Failed to create family contribution' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/:id/family-contributions - Delete all family contributions for a transaction
// This is used when switching source of funds away from FAMILY_CONTRIBUTIONS
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete all family contributions for this transaction
    await db.familyContribution.deleteMany({
      where: { transactionId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting family contributions:', error);
    return NextResponse.json(
      { error: 'Failed to delete family contributions' },
      { status: 500 }
    );
  }
}
