import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// GET /api/agents/[id] - Get single agent
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            transactions: true,
            customers: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error: any) {
    console.error(`GET /api/agents/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/[id] - Update agent
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || !user.roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, location, phone, email, address, notes, status } = body;

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(location !== undefined && { location }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });

    await logActivity({
      type: "AGENT_UPDATED",
      userId: user.id,
      userEmail: user.email,
      description: `Updated agent: ${agent.name} (${agent.agentCode})`,
      entityType: "Agent",
      entityId: agent.id,
    });

    return NextResponse.json(agent);
  } catch (error: any) {
    console.error(`PATCH /api/agents/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete agent (soft delete by setting to INACTIVE)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || !user.roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete by setting status to INACTIVE
    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    });

    await logActivity({
      type: "AGENT_UPDATED",
      userId: user.id,
      userEmail: user.email,
      description: `Deactivated agent: ${agent.name} (${agent.agentCode})`,
      entityType: "Agent",
      entityId: agent.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`DELETE /api/agents/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
