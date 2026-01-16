import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/branding - Get business branding settings (public for agent portal)
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
    console.error('GET /api/public/branding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
