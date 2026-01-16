import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-log';

// Re-export role helper functions from roles.ts
export { hasRole, getRolesArray } from '@/lib/roles';

// Allowed email domains
const ALLOWED_EMAIL_DOMAINS = ['@samofinance.co.nz'];

// Helper function to validate email domain
function isAllowedEmailDomain(email: string): boolean {
  const emailLower = email.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some(domain => emailLower.endsWith(domain.toLowerCase()));
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Azure AD / Office 365 SSO Provider
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID
      ? [AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
          tenantId: process.env.AZURE_AD_TENANT_ID,
          authorization: {
            params: {
              scope: 'openid profile email User.Read'
            }
          },
          checks: ['pkce', 'state']
        })]
      : []
    ),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles;
      }

      // For Azure AD login, find or create user in database
      if (account?.provider === 'azure-ad' && token.email) {
        // Check if email domain is allowed for SSO login
        if (!isAllowedEmailDomain(token.email as string)) {
          console.log(`SSO login attempt rejected: ${token.email} - not from allowed domain`);
          throw new Error('Access denied. Only @samofinance.co.nz email addresses are allowed.');
        }

        const dbUser = await db.user.findUnique({
          where: { email: token.email as string }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.roles = dbUser.roles;

          // Log SSO login
          await logActivity({
            type: 'USER_LOGIN',
            userId: dbUser.id,
            userEmail: dbUser.email,
            description: `User ${dbUser.email} logged in via Office 365 SSO`
          });
        } else {
          // Auto-create user with STAFF role for Azure AD users
          const newUser = await db.user.create({
            data: {
              email: token.email as string,
              passwordHash: '', // No password for SSO users
              roles: 'STAFF' // Default role
            }
          });

          token.id = newUser.id;
          token.roles = newUser.roles;

          await logActivity({
            type: 'USER_CREATED',
            userId: newUser.id,
            userEmail: newUser.email,
            description: `New user ${newUser.email} auto-created via Office 365 SSO`
          });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).roles = token.roles;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt'
  }
};
