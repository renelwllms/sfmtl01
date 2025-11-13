import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentCode: string }> }
) {
  try {
    const { agentCode } = await params;

    const agent = await db.agent.findUnique({
      where: { agentCode }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('GET /api/agents/by-code/[agentCode] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
