import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// POST /api/settings/database/migrate - Run Prisma migrations
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
    const { action } = body; // 'push' or 'seed'

    try {
      let output = '';
      let command = '';

      if (action === 'push') {
        // Run prisma db push to create/update schema
        command = 'npx prisma db push';
        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          timeout: 60000 // 60 second timeout
        });

        output = stdout + stderr;

        // Also generate Prisma Client
        const { stdout: genStdout } = await execAsync('npx prisma generate', {
          cwd: process.cwd(),
          timeout: 60000
        });

        output += '\n' + genStdout;

        return NextResponse.json({
          success: true,
          message: 'Database schema updated successfully!',
          output: output,
          action: 'push'
        });
      } else if (action === 'seed') {
        // Run prisma db seed
        command = 'npx prisma db seed';
        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          timeout: 60000
        });

        output = stdout + stderr;

        return NextResponse.json({
          success: true,
          message: 'Database seeded successfully!',
          output: output,
          action: 'seed'
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid action. Use "push" or "seed"' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('Error running migration:', error);

      let errorMessage = 'Migration failed';

      if (error.message?.includes('P1000')) {
        errorMessage = 'Authentication failed. Please check database credentials.';
      } else if (error.message?.includes('P1001')) {
        errorMessage = 'Cannot reach database server. Please check connection settings.';
      } else if (error.message?.includes('P1003')) {
        errorMessage = 'Database does not exist.';
      } else if (error.stdout || error.stderr) {
        errorMessage = error.stdout + '\n' + error.stderr;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        output: error.stdout || error.stderr || ''
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in database migrate endpoint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
