import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    let settings = await db.userSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await db.userSettings.create({
        data: {
          userId,
          notificationsEnabled: true,
          soundNotificationsEnabled: true
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('GET /api/user/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const settings = await db.userSettings.upsert({
      where: { userId },
      update: {
        notificationsEnabled: body.notificationsEnabled ?? undefined,
        soundNotificationsEnabled: body.soundNotificationsEnabled ?? undefined
      },
      create: {
        userId,
        notificationsEnabled: body.notificationsEnabled ?? true,
        soundNotificationsEnabled: body.soundNotificationsEnabled ?? true
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('PATCH /api/user/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
