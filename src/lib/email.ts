import { db } from './db';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Microsoft Graph API (Office 365)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Get email settings from database
    const settings = await db.emailSettings.findFirst();

    if (!settings || !settings.enabled) {
      console.log('Email not sent: Email integration is disabled');
      return false;
    }

    if (!settings.tenantId || !settings.clientId || !settings.clientSecret || !settings.senderEmail) {
      console.error('Email not sent: Missing required configuration');
      return false;
    }

    // Get access token from Microsoft
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${settings.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: settings.clientId,
          client_secret: settings.clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Failed to get access token:', error);
      return false;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Prepare recipients
    const toRecipients = Array.isArray(options.to)
      ? options.to.map(email => ({ emailAddress: { address: email } }))
      : [{ emailAddress: { address: options.to } }];

    // Send email via Microsoft Graph API
    const sendResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${settings.senderEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            subject: options.subject,
            body: {
              contentType: 'HTML',
              content: options.html
            },
            toRecipients,
            from: {
              emailAddress: {
                address: settings.senderEmail,
                name: settings.senderName || 'SFMTL'
              }
            }
          },
          saveToSentItems: true
        })
      }
    );

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate HTML template for transaction receipt
 */
export function generateTransactionReceiptEmail(transaction: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #111827; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .amount-highlight { font-size: 24px; font-weight: bold; color: #2563eb; text-align: center; padding: 20px; background: #eff6ff; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Transaction Receipt</h1>
      <p>SFMTL - Samoa Finance Money Transfer</p>
    </div>
    <div class="content">
      <p>Dear ${transaction.customer.fullName},</p>
      <p>Thank you for using our money transfer service. Your transaction has been successfully processed.</p>

      <div class="transaction-details">
        <div class="detail-row">
          <span class="detail-label">Transaction Number:</span>
          <span class="detail-value">${transaction.txnNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date(transaction.createdAt).toLocaleString('en-NZ')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Beneficiary:</span>
          <span class="detail-value">${transaction.beneficiaryName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Currency:</span>
          <span class="detail-value">${transaction.currency}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Exchange Rate:</span>
          <span class="detail-value">${transaction.rate.toFixed(4)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid (NZD):</span>
          <span class="detail-value">$${(transaction.totalPaidNzdCents / 100).toFixed(2)}</span>
        </div>
      </div>

      <div class="amount-highlight">
        ${transaction.currency} ${transaction.totalForeignReceived.toFixed(2)}
        <div style="font-size: 14px; color: #6b7280; font-weight: normal; margin-top: 5px;">Amount to be received</div>
      </div>

      <p><strong>Important:</strong> Please keep this receipt for your records. If you have any questions about this transaction, please contact us.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from SFMTL.</p>
      <p>© ${new Date().getFullYear()} SFMTL - Samoa Finance Money Transfer Ltd. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
