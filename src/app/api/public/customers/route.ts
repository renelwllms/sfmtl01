import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CustomerSchema } from '@/lib/validators';
import { nextCustomerId } from '@/lib/ids';

// POST /api/public/customers - Create customer (public for agent portal)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = CustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if customer with this phone already exists
    const existingCustomer = await db.customer.findUnique({
      where: { phone: data.phone }
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          error: 'Customer with this phone number already exists',
          customer: {
            id: existingCustomer.id,
            customerId: existingCustomer.customerId,
            fullName: existingCustomer.fullName
          }
        },
        { status: 409 }
      );
    }

    // Verify agent if agentId provided
    if (body.agentId) {
      const agent = await db.agent.findUnique({
        where: { id: body.agentId }
      });

      if (!agent || agent.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Invalid or inactive agent' },
          { status: 403 }
        );
      }
    }

    // Generate customer ID
    const customerId = await nextCustomerId();

    // Create customer
    const customer = await db.customer.create({
      data: {
        customerId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        dob: new Date(data.dob),
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        streetAddress: data.streetAddress || null,
        suburb: data.suburb || null,
        city: data.city || null,
        postcode: data.postcode || null,
        homePhone: data.homePhone || null,
        mobilePhone: data.mobilePhone || data.phone,
        occupation: data.occupation || null,
        employerName: data.employerName || null,
        employerAddress: data.employerAddress || null,
        employerPhone: data.employerPhone || null,
        agentId: body.agentId || null
      }
    });

    return NextResponse.json(
      {
        customer,
        message: 'Customer created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/public/customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
