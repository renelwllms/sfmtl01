import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// GET /api/agents - List all agents
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const includeStats = searchParams.get("includeStats") === "true";

    const where = status ? { status } : {};

    const agents = await prisma.agent.findMany({
      where,
      include: includeStats
        ? {
            _count: {
              select: {
                transactions: true,
                customers: true,
              },
            },
          }
        : undefined,
      orderBy: [{ isHeadOffice: "desc" }, { agentCode: "asc" }],
    });

    return NextResponse.json(agents);
  } catch (error: any) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create new agent
export async function POST(req: NextRequest) {
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
    const { name, location, phone, email, address, notes, isHeadOffice } =
      body;

    if (!name) {
      return NextResponse.json(
        { error: "Agent name is required" },
        { status: 400 }
      );
    }

    // Generate next agent code
    const counter = await prisma.counter.upsert({
      where: { name: "agent" },
      update: { value: { increment: 1 } },
      create: { name: "agent", value: 1 },
    });

    const agentCode = `AGT-${String(counter.value).padStart(3, "0")}`;

    const agent = await prisma.agent.create({
      data: {
        agentCode,
        name,
        location,
        phone,
        email,
        address,
        notes,
        isHeadOffice: isHeadOffice || false,
        createdById: user.id,
      },
    });

    await logActivity({
      type: "AGENT_CREATED",
      userId: user.id,
      userEmail: user.email,
      description: `Created agent: ${agent.name} (${agent.agentCode})`,
      entityType: "Agent",
      entityId: agent.id,
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/agents error:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
