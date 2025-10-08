import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// POST /api/settings/email/test - Send test email
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

    const userEmail = (session.user as any)?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Send test email
    const testEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .success-box { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Email Integration Test</h1>
      <p>SFMTL - Samoa Finance Money Transfer</p>
    </div>
    <div class="content">
      <div class="success-box">
        <h2 style="margin: 0;">🎉 Success!</h2>
        <p style="margin: 10px 0 0 0;">Your Office 365 email integration is working correctly.</p>
      </div>

      <p>Dear Administrator,</p>
      <p>This is a test email to confirm that your Office 365 email integration with SFMTL is configured correctly and working as expected.</p>

      <h3>What's Working:</h3>
      <ul>
        <li>✅ Azure AD authentication</li>
        <li>✅ Microsoft Graph API connection</li>
        <li>✅ Email sending capability</li>
        <li>✅ HTML email rendering</li>
      </ul>

      <h3>Next Steps:</h3>
      <p>Your email integration is ready to use for:</p>
      <ul>
        <li>Transaction receipts</li>
        <li>Customer notifications</li>
        <li>AML/PTR alerts</li>
        <li>Daily summaries</li>
      </ul>

      <p><strong>Note:</strong> This test was sent at ${new Date().toLocaleString('en-NZ')} by ${userEmail}</p>
    </div>
    <div class="footer">
      <p>This is a test message from SFMTL Email Integration.</p>
      <p>© ${new Date().getFullYear()} SFMTL - Samoa Finance Money Transfer Ltd. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const success = await sendEmail({
      to: userEmail,
      subject: '✅ SFMTL Email Integration Test - Success',
      html: testEmailHtml,
      text: 'Your Office 365 email integration is working correctly. This is a test email from SFMTL.'
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send test email. Check server logs for details.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${userEmail}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
