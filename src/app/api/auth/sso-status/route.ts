import { NextResponse } from 'next/server';

// GET /api/auth/sso-status - Check if Office 365 SSO is enabled
export async function GET() {
  const ssoEnabled = !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );

  return NextResponse.json({ enabled: ssoEnabled });
}
