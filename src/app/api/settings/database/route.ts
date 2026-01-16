import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// GET /api/settings/database - Get current database connection info
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

    // Read current .env file
    const envPath = path.join(process.cwd(), '.env');
    let dbUrl = process.env.DATABASE_URL || '';
    let directUrl = process.env.DIRECT_URL || '';

    // Parse DATABASE_URL to get individual components and detect database type
    const settings = parseDatabaseUrl(dbUrl);

    return NextResponse.json({
      settings: {
        ...settings,
        password: '',
        databaseUrl: '',
        directUrl: '',
        dbType: detectDatabaseType(dbUrl)
      }
    });
  } catch (error) {
    console.error('Error fetching database settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/database - Update database connection
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

    // Build connection URLs based on database type
    let databaseUrl = '';
    let directUrl = '';

    if (dbType === 'postgresql') {
      databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${database}`;
      directUrl = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    } else if (dbType === 'sqlserver') {
      // SQL Server connection string format
      // sqlserver://[host]:[port];database=[database];user=[user];password=[password];encrypt=true;trustServerCertificate=true
      databaseUrl = `sqlserver://${host}:${port};database=${database};user=${user};password=${password};encrypt=true;trustServerCertificate=true`;
      directUrl = databaseUrl;
    } else {
      return NextResponse.json(
        { error: 'Invalid database type. Use "postgresql" or "sqlserver"' },
        { status: 400 }
      );
    }

    // Read current .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    try {
      envContent = fs.readFileSync(envPath, 'utf-8');
    } catch (error) {
      // .env doesn't exist, create new content
      envContent = '';
    }

    // Update DATABASE_URL and DIRECT_URL
    const updatedEnv = updateEnvVariable(envContent, 'DATABASE_URL', databaseUrl);
    const finalEnv = updateEnvVariable(updatedEnv, 'DIRECT_URL', directUrl);

    // Write back to .env file
    fs.writeFileSync(envPath, finalEnv, 'utf-8');

    // Update Prisma schema provider
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    try {
      let schemaContent = fs.readFileSync(schemaPath, 'utf-8');

      // Update the provider based on database type
      if (dbType === 'postgresql') {
        // Replace sqlserver with postgresql and restore directUrl if needed
        schemaContent = schemaContent.replace(
          /datasource db \{[\s\S]+?\}/,
          `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}`
        );
      } else if (dbType === 'sqlserver') {
        // Replace postgresql with sqlserver and remove directUrl
        schemaContent = schemaContent.replace(
          /datasource db \{[\s\S]+?\}/,
          `datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}`
        );
      }

      fs.writeFileSync(schemaPath, schemaContent, 'utf-8');

      // Regenerate Prisma Client
      console.log('Regenerating Prisma Client...');
      await execAsync('npx prisma generate', { cwd: process.cwd() });
      console.log('Prisma Client regenerated successfully');
    } catch (error) {
      console.error('Error updating Prisma schema or regenerating client:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update Prisma schema or regenerate client. You may need to manually run: npx prisma generate',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database settings and Prisma schema updated successfully! Prisma Client has been regenerated. Please restart the application for changes to take effect.',
      settings: {
        host,
        port,
        database,
        user,
        password: '***hidden***',
        dbType
      }
    });
  } catch (error) {
    console.error('Error updating database settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to detect database type from URL
function detectDatabaseType(url: string): 'postgresql' | 'sqlserver' {
  if (url.startsWith('sqlserver://')) {
    return 'sqlserver';
  }
  return 'postgresql'; // default
}

// Helper function to parse database URL
function parseDatabaseUrl(url: string) {
  try {
    if (url.startsWith('postgresql://')) {
      // postgresql://user:password@host:port/database
      const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?|$)/);

      if (match) {
        return {
          user: match[1],
          password: '',
          host: match[3],
          port: match[4],
          database: match[5].split('?')[0] // Remove query params
        };
      }
    } else if (url.startsWith('sqlserver://')) {
      // sqlserver://host:port;database=dbname;user=username;password=pass;...
      const hostMatch = url.match(/sqlserver:\/\/([^:;]+):(\d+)/);
      const dbMatch = url.match(/database=([^;]+)/);
      const userMatch = url.match(/user=([^;]+)/);

      if (hostMatch && dbMatch && userMatch) {
        return {
          user: userMatch[1],
          password: '',
          host: hostMatch[1],
          port: hostMatch[2],
          database: dbMatch[1]
        };
      }
    }
  } catch (error) {
    console.error('Error parsing database URL:', error);
  }

  return {
    user: '',
    password: '',
    host: 'localhost',
    port: '5432',
    database: 'samoa_finance'
  };
}

function redactDatabaseUrl(url: string) {
  if (!url) {
    return '';
  }

  if (url.startsWith('postgresql://')) {
    return url.replace(/postgresql:\/\/([^:]+):([^@]+)@/, 'postgresql://$1:***@');
  }

  if (url.startsWith('sqlserver://')) {
    return url.replace(/password=([^;]+)/, 'password=***');
  }

  return url;
}

// Helper function to update .env variable
function updateEnvVariable(content: string, key: string, value: string): string {
  const lines = content.split('\n');
  const keyPattern = new RegExp(`^${key}=`);
  let found = false;

  const updatedLines = lines.map(line => {
    if (keyPattern.test(line)) {
      found = true;
      return `${key}="${value}"`;
    }
    return line;
  });

  // If not found, add it
  if (!found) {
    updatedLines.push(`${key}="${value}"`);
  }

  return updatedLines.join('\n');
}
