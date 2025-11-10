import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-log';

// Re-export role helper functions from roles.ts
export { hasRole, getRolesArray } from '@/lib/roles';

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
          }
        })]
      : []
    ),
    // Traditional credentials login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        // Log successful login
        await logActivity({
          type: 'USER_LOGIN',
          userId: user.id,
          userEmail: user.email,
          description: `User ${user.email} logged in successfully`
        });

        return {
          id: user.id,
          email: user.email,
          roles: user.roles // Now using roles (comma-separated string)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles;
      }

      // For Azure AD login, find or create user in database
      if (account?.provider === 'azure-ad' && token.email) {
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
