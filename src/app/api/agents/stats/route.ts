import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DateTime } from "luxon";

// GET /api/agents/stats - Get agent sales statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30days"; // 7days, 30days, 90days, year
    const currency = searchParams.get("currency"); // optional filter by currency

    // Calculate date range
    let startDate: DateTime;
    const endDate = DateTime.now().setZone("Pacific/Auckland");

    switch (period) {
      case "7days":
        startDate = endDate.minus({ days: 7 });
        break;
      case "90days":
        startDate = endDate.minus({ days: 90 });
        break;
      case "year":
        startDate = endDate.minus({ years: 1 });
        break;
      case "30days":
      default:
        startDate = endDate.minus({ days: 30 });
    }

    // Build where clause
    const where: any = {
      date: {
        gte: startDate.toJSDate(),
        lte: endDate.toJSDate(),
      },
      agentId: { not: null }, // Only transactions with agents
    };

    if (currency) {
      where.currency = currency;
    }

    // Get transactions grouped by agent
    const transactions = await db.transaction.findMany({
      where,
      select: {
        agentId: true,
        amountNzdCents: true,
        totalPaidNzdCents: true,
        feeNzdCents: true,
        currency: true,
        agent: {
          select: {
            agentCode: true,
            name: true,
          },
        },
      },
    });

    // Group by agent and calculate totals
    type AgentStat = {
      agentId: string;
      agentCode: string;
      agentName: string;
      transactionCount: number;
      totalAmountNzd: number;
      totalFeesNzd: number;
      totalRevenueNzd: number;
    };

    const agentStats = new Map<string, AgentStat>();

    transactions.forEach((txn) => {
      if (!txn.agentId || !txn.agent) return;

      const key = String(txn.agentId);
      const existing = agentStats.get(key);

      if (!existing) {
        agentStats.set(key, {
          agentId: String(txn.agentId),
          agentCode: txn.agent.agentCode,
          agentName: txn.agent.name,
          transactionCount: 1,
          totalAmountNzd: txn.amountNzdCents / 100,
          totalFeesNzd: txn.feeNzdCents / 100,
          totalRevenueNzd: txn.totalPaidNzdCents / 100,
        });
        return;
      }

      existing.transactionCount += 1;
      existing.totalAmountNzd += txn.amountNzdCents / 100;
      existing.totalFeesNzd += txn.feeNzdCents / 100;
      existing.totalRevenueNzd += txn.totalPaidNzdCents / 100;
    });

    // Convert to array and sort by revenue
    const stats = Array.from(agentStats.values()).sort(
      (a, b) => b.totalRevenueNzd - a.totalRevenueNzd
    );

    // Calculate totals across all agents
    const totals = stats.reduce(
      (acc, agent: any) => ({
        transactionCount: acc.transactionCount + agent.transactionCount,
        totalAmountNzd: acc.totalAmountNzd + agent.totalAmountNzd,
        totalFeesNzd: acc.totalFeesNzd + agent.totalFeesNzd,
        totalRevenueNzd: acc.totalRevenueNzd + agent.totalRevenueNzd,
      }),
      {
        transactionCount: 0,
        totalAmountNzd: 0,
        totalFeesNzd: 0,
        totalRevenueNzd: 0,
      }
    );

    return NextResponse.json({
      period,
      startDate: startDate.toISODate(),
      endDate: endDate.toISODate(),
      stats,
      totals,
    });
  } catch (error: any) {
    console.error("GET /api/agents/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent statistics" },
      { status: 500 }
    );
  }
}
