import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";
import { writeFile } from "fs/promises";
import { join } from "path";

// POST /api/public/register - Public customer registration (no auth required)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const dob = formData.get("dob") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string | null;
    const address = formData.get("address") as string | null;
    const agentCode = formData.get("agentCode") as string;
    const idPhoto = formData.get("idPhoto") as File | null;

    // Validation
    if (!firstName || !lastName || !dob || !phone || !agentCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify agent exists and is active
    const agent = await db.agent.findUnique({
      where: { agentCode },
    });

    if (!agent) {
      return NextResponse.json({ error: "Invalid agent code" }, { status: 400 });
    }

    if (agent.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Agent is not active" },
        { status: 400 }
      );
    }

    // Check if customer with this phone already exists
    const existingCustomer = await db.customer.findUnique({
      where: { phone },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer with this phone number already exists" },
        { status: 409 }
      );
    }

    // Generate customer ID
    const counter = await db.counter.upsert({
      where: { name: "customer" },
      update: { value: { increment: 1 } },
      create: { name: "customer", value: 1 },
    });

    const year = new Date().getFullYear();
    const customerId = `CUST-${year}-${String(counter.value).padStart(6, "0")}`;

    // Create customer
    const customer = await db.customer.create({
      data: {
        customerId,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        dob: new Date(dob),
        phone,
        email: email || null,
        address: address || null,
        agentId: agent.id,
      },
    });

    // Handle ID photo if provided
    if (idPhoto && idPhoto.size > 0) {
      try {
        const bytes = await idPhoto.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const timestamp = Date.now();
        const ext = idPhoto.name.split(".").pop() || "jpg";
        const filename = `${customer.id}_${timestamp}.${ext}`;
        const filepath = join(process.cwd(), "uploads", "customer-ids", filename);

        // Save file
        await writeFile(filepath, buffer);

        // Create CustomerIdFile record
        await db.customerIdFile.create({
          data: {
            customerId: customer.id,
            filePath: `/uploads/customer-ids/${filename}`,
            mimeType: idPhoto.type || "image/jpeg",
            documentType: "OTHER",
          },
        });
      } catch (error) {
        console.error("Error saving ID photo:", error);
        // Continue even if photo upload fails
      }
    }

    // Log activity
    await logActivity({
      type: "CUSTOMER_CREATED",
      description: `Customer registered via QR code: ${customer.fullName} (${customer.customerId}) - Agent: ${agent.agentCode}`,
      entityType: "Customer",
      entityId: customer.id,
      metadata: { agentCode, source: "qr_registration" },
    });

    return NextResponse.json(
      {
        success: true,
        customerId: customer.customerId,
        message: "Registration successful! Your customer ID is " + customer.customerId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/public/register error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
