import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/settings/email - Get email settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has ADMIN role
    const userRoles = (session.user as any)?.roles || '';
    if (!hasRole(userRoles, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    // Get or create email settings
    let settings = await db.emailSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await db.emailSettings.create({
        data: {
          enabled: false,
          tenantId: '',
          clientId: '',
          clientSecret: '',
          senderEmail: '',
          senderName: ''
        }
      });
    }

    return NextResponse.json({
      settings: {
        enabled: settings.enabled,
        tenantId: settings.tenantId || '',
        clientId: settings.clientId || '',
        clientSecret: '',
        senderEmail: settings.senderEmail || '',
        senderName: settings.senderName || ''
      }
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/email - Update email settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has ADMIN role
    const userRoles = (session.user as any)?.roles || '';
    if (!hasRole(userRoles, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, tenantId, clientId, clientSecret, senderEmail, senderName } = body;

    // Validate required fields if enabled
    if (enabled) {
      if (!tenantId || !clientId || !clientSecret || !senderEmail) {
        return NextResponse.json(
          { error: 'All fields are required when email is enabled' },
          { status: 400 }
        );
      }
    }

    // Get existing settings or create new
    let settings = await db.emailSettings.findFirst();

    if (settings) {
      // Update existing settings
      settings = await db.emailSettings.update({
        where: { id: settings.id },
        data: {
          enabled: enabled || false,
          tenantId: tenantId || null,
          clientId: clientId || null,
          clientSecret: clientSecret || null,
          senderEmail: senderEmail || null,
          senderName: senderName || null
        }
      });
    } else {
      // Create new settings
      settings = await db.emailSettings.create({
        data: {
          enabled: enabled || false,
          tenantId: tenantId || null,
          clientId: clientId || null,
          clientSecret: clientSecret || null,
          senderEmail: senderEmail || null,
          senderName: senderName || null
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings updated successfully',
      settings: {
        enabled: settings.enabled,
        tenantId: settings.tenantId || '',
        clientId: settings.clientId || '',
        clientSecret: '',
        senderEmail: settings.senderEmail || '',
        senderName: settings.senderName || ''
      }
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
