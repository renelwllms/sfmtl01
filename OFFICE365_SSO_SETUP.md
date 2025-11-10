# Office 365 Single Sign-On (SSO) Setup Guide

This guide will help you configure Office 365 / Azure AD Single Sign-On for your Samoa Finance application.

## Prerequisites

- Microsoft 365 / Azure AD account with admin access
- Access to Azure Portal (https://portal.azure.com)

## Step 1: Register Application in Azure Portal

1. Go to https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
2. Click **"New registration"**
3. Fill in the application details:
   - **Name**: Samoa Finance App (or your preferred name)
   - **Supported account types**:
     - Select "Accounts in this organizational directory only" for single tenant
     - Or "Accounts in any organizational directory" for multi-tenant
   - **Redirect URI**:
     - Platform: Web
     - URL: `http://localhost:3000/api/auth/callback/azure-ad` (for development)
     - For production: `https://yourdomain.com/api/auth/callback/azure-ad`
4. Click **"Register"**

## Step 2: Get Application (Client) ID

After registration, you'll see the application overview page:

1. Copy the **"Application (client) ID"**
2. Copy the **"Directory (tenant) ID"**
3. Save these for later

## Step 3: Create Client Secret

1. In the left menu, click **"Certificates & secrets"**
2. Click **"New client secret"**
3. Add a description (e.g., "Samoa Finance SSO")
4. Select expiration period (recommended: 24 months)
5. Click **"Add"**
6. **IMPORTANT**: Copy the **"Value"** immediately - it won't be shown again!

## Step 4: Configure API Permissions

1. In the left menu, click **"API permissions"**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
6. Click **"Add permissions"**
7. Click **"Grant admin consent"** (if you have admin rights)

## Step 5: Update Environment Variables

Add the following to your `.env` file:

```bash
# Office 365 / Azure AD SSO
AZURE_AD_CLIENT_ID=your-application-client-id-here
AZURE_AD_CLIENT_SECRET=your-client-secret-value-here
AZURE_AD_TENANT_ID=your-directory-tenant-id-here
```

Replace the values with:
- `AZURE_AD_CLIENT_ID`: Application (client) ID from Step 2
- `AZURE_AD_CLIENT_SECRET`: Client secret value from Step 3
- `AZURE_AD_TENANT_ID`: Directory (tenant) ID from Step 2

## Step 6: Update Production Redirect URI

When deploying to production:

1. Go back to Azure Portal → Your App Registration
2. Click **"Authentication"** in the left menu
3. Under **"Web"** redirect URIs, add:
   ```
   https://yourdomain.com/api/auth/callback/azure-ad
   ```
4. Update your production `.env` file with:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   ```

## Step 7: Restart Application

After adding environment variables:

```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

## How It Works

### User Login Flow

1. **New Users**: When a user logs in with Office 365 for the first time:
   - A new account is automatically created in the database
   - Default role: `STAFF`
   - No password is set (SSO only)

2. **Existing Users**: If a user with the same email already exists:
   - They will be logged in with their existing account and roles
   - Their roles and permissions are preserved

3. **Mixed Authentication**:
   - Users can log in using traditional email/password OR Office 365 SSO
   - SSO users can't use traditional login (no password set)
   - Traditional users can continue using email/password

### Security Notes

- Client secrets should be kept secure and never committed to version control
- Use different client secrets for development and production
- Rotate client secrets regularly (before expiration)
- Only grant necessary API permissions
- Review Azure AD sign-in logs regularly

## Troubleshooting

### "Sign-in failed" or "Unauthorized"

- Check that all environment variables are correctly set
- Verify redirect URI matches exactly (including http/https)
- Ensure API permissions are granted
- Check client secret hasn't expired

### "Can't reach the app" error

- Verify `NEXTAUTH_URL` matches your domain
- Check that redirect URI is properly configured in Azure Portal
- Ensure app is running on the specified port

### Users can't see the SSO button

- SSO button only appears when Azure AD credentials are configured
- Check that all three environment variables are set
- Restart the application after adding environment variables

## Disable SSO

To disable SSO, simply remove or comment out the Azure AD environment variables in `.env`:

```bash
# AZURE_AD_CLIENT_ID=...
# AZURE_AD_CLIENT_SECRET=...
# AZURE_AD_TENANT_ID=...
```

The application will fall back to traditional email/password authentication only.

## Support

For more information:
- [Azure AD App Registration Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [NextAuth.js Azure AD Provider](https://next-auth.js.org/providers/azure-ad)
- [Microsoft Graph API Permissions](https://learn.microsoft.com/en-us/graph/permissions-reference)
