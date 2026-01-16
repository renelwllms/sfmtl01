import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/branding - Get business branding settings
export async function GET(request: NextRequest) {
  try {
    let settings = await db.businessBrandingSettings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.businessBrandingSettings.create({
        data: {
          businessName: 'TransferPoint',
          fontSize: '36',
          fontColor: '#1e40af',
          fontFamily: 'Inter',
          footerText: 'TransferPoint | Developed & Hosted by Edgepoint'
        }
      });
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('GET /api/branding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/branding - Update business branding settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const userRoles = (session.user as any)?.roles || '';
    if (!hasRole(userRoles, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { businessName, fontSize, fontColor, fontFamily, footerText } = body;

    // Validate inputs
    if (!businessName || businessName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Get existing settings or create new
    let settings = await db.businessBrandingSettings.findFirst();

    if (!settings) {
      settings = await db.businessBrandingSettings.create({
        data: {
          businessName,
          fontSize: fontSize || '36',
          fontColor: fontColor || '#1e40af',
          fontFamily: fontFamily || 'Inter',
          footerText: footerText || null,
          updatedById: (session.user as any).id
        }
      });
    } else {
      settings = await db.businessBrandingSettings.update({
        where: { id: settings.id },
        data: {
          businessName,
          fontSize: fontSize || '36',
          fontColor: fontColor || '#1e40af',
          fontFamily: fontFamily || 'Inter',
          footerText: footerText || null,
          updatedById: (session.user as any).id
        }
      });
    }

    return NextResponse.json(
      { settings, message: 'Business branding updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/branding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
