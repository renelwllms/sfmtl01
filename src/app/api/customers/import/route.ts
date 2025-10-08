import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  phone: z.string().regex(/^\+\d{10,15}$/, 'Phone must be in E.164 format (e.g., +6421234567)'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const expectedHeaders = ['firstName', 'lastName', 'dob', 'phone', 'email', 'address'];

    if (!expectedHeaders.every(h => header.includes(h))) {
      return NextResponse.json({
        error: `Invalid CSV format. Expected headers: ${expectedHeaders.join(', ')}`
      }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line (handle quoted values)
        const values: string[] = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];

          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim()); // Push last value

        // Map values to object
        const rowData: any = {};
        header.forEach((key, idx) => {
          rowData[key] = values[idx] || '';
        });

        // Validate data
        const validatedData = customerSchema.parse(rowData);

        // Check age (must be 18+)
        const dob = new Date(validatedData.dob);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const isAdult = age > 18 || (age === 18 && monthDiff >= 0);

        if (!isAdult) {
          throw new Error('Customer must be 18 years or older');
        }

        // Check if customer already exists
        const existing = await db.customer.findUnique({
          where: { phone: validatedData.phone }
        });

        if (existing) {
          throw new Error(`Customer with phone ${validatedData.phone} already exists`);
        }

        // Generate customer ID
        const count = await db.customer.count();
        const customerId = `C${String(count + 1).padStart(6, '0')}`;

        // Create customer
        await db.customer.create({
          data: {
            customerId,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            fullName: `${validatedData.firstName} ${validatedData.lastName}`,
            dob: new Date(validatedData.dob),
            phone: validatedData.phone,
            email: validatedData.email || null,
            address: validatedData.address || null
          }
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        const errorMsg = err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message;
        errors.push({ row: i + 1, error: errorMsg });
      }
    }

    return NextResponse.json({
      result: {
        success: successCount,
        failed: failedCount,
        errors
      }
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import customers' },
      { status: 500 }
    );
  }
}
