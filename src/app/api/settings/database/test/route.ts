import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// POST /api/settings/database/test - Test database connection
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
    const { host, port, database, user, password, dbType } = body;

    // Validate required fields
    if (!host || !port || !database || !user || !password || !dbType) {
      return NextResponse.json(
        { error: 'All database connection fields are required' },
        { status: 400 }
      );
    }

    // Build connection URL based on database type
    let databaseUrl = '';

    if (dbType === 'postgresql') {
      databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    } else if (dbType === 'sqlserver') {
      databaseUrl = `sqlserver://${host}:${port};database=${database};user=${user};password=${password};encrypt=true;trustServerCertificate=true`;
    } else {
      return NextResponse.json(
        { error: 'Invalid database type. Use "postgresql" or "sqlserver"' },
        { status: 400 }
      );
    }

    // Test connection
    let testClient: PrismaClient | null = null;

    try {
      testClient = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl
          }
        }
      });

      // Try to connect and run a simple query
      await testClient.$queryRaw`SELECT 1`;

      // Check if schema exists
      const tables = await testClient.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ` as any[];

      await testClient.$disconnect();

      return NextResponse.json({
        success: true,
        message: 'Connection successful!',
        details: {
          connected: true,
          tablesCount: tables.length,
          schemaExists: tables.length > 0,
          tables: tables.map((t: any) => t.table_name)
        }
      });
    } catch (error: any) {
      if (testClient) {
        await testClient.$disconnect();
      }

      let errorMessage = 'Connection failed';

      if (error.message?.includes('authentication failed')) {
        errorMessage = 'Authentication failed. Please check username and password.';
      } else if (error.message?.includes('database') && error.message?.includes('does not exist')) {
        errorMessage = 'Database does not exist. You can create it using the "Setup Schema" button.';
      } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot reach database server. Please check host and port.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: {
          connected: false
        }
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error testing database connection:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
