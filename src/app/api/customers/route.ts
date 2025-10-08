import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { CustomerSchema } from '@/lib/validators';
import { nextCustomerId } from '@/lib/ids';
import { logCustomerActivity, getRequestInfo } from '@/lib/activity-log';

// GET /api/customers - Search by phone/customerId OR list all customers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const customerId = searchParams.get('customerId');
    const list = searchParams.get('list');

    // If list=true, return all customers
    if (list === 'true') {
      const customers = await db.customer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      });
      return NextResponse.json({ customers });
    }

    // Otherwise, search for specific customer
    if (!phone && !customerId) {
      return NextResponse.json(
        { error: 'Either phone, customerId, or list=true is required' },
        { status: 400 }
      );
    }

    let customer;
    if (phone) {
      customer = await db.customer.findUnique({
        where: { phone },
        include: {
          ids: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    } else if (customerId) {
      customer = await db.customer.findUnique({
        where: { customerId },
        include: {
          ids: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Check if phone already exists
    const existing = await db.customer.findUnique({
      where: { phone: data.phone }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists', customer: existing },
        { status: 409 }
      );
    }

    // Generate customer ID
    const customerId = await nextCustomerId();

    // Calculate fullName
    const fullName = `${data.firstName} ${data.lastName}`;

    // Create customer
    const customer = await db.customer.create({
      data: {
        customerId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        dob: data.dob,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null
      }
    });

    // Log customer creation
    const { ipAddress, userAgent } = getRequestInfo(request);
    const userId = (session.user as any).id;
    const userEmail = (session.user as any).email;
    await logCustomerActivity(
      'CUSTOMER_CREATED',
      customer.id,
      customer.fullName,
      userId,
      userEmail,
      `Customer ${customer.customerId} (${customer.fullName}) created`,
      {
        phone: customer.phone,
        email: customer.email,
        ipAddress,
        userAgent
      }
    );

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('POST /api/customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
