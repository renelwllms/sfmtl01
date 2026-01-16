import { db } from './db';
import { ActivityType } from '@prisma/client';

export interface LogActivityParams {
  type: ActivityType;
  userId?: string;
  userEmail?: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity to the ActivityLog table
 */
export async function logActivity(params: LogActivityParams) {
  try {
    await db.activityLog.create({
      data: {
        type: params.type,
        userId: params.userId,
        userEmail: params.userEmail,
        description: params.description,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging should not break the main operation
  }
}
