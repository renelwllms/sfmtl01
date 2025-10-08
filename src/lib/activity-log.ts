import { db } from './db';
import { ActivityType } from '@prisma/client';

interface LogActivityOptions {
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
 * Log an activity to the database
 */
export async function logActivity(options: LogActivityOptions) {
  try {
    await db.activityLog.create({
      data: {
        type: options.type,
        userId: options.userId,
        userEmail: options.userEmail,
        description: options.description,
        entityType: options.entityType,
        entityId: options.entityId,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      }
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('Failed to log activity:', error);
  }
}

/**
 * Helper to extract IP and user agent from Next.js request
 */
export function getRequestInfo(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Helper to log customer-related activities
 */
export async function logCustomerActivity(
  type: ActivityType,
  customerId: string,
  customerName: string,
  userId: string,
  userEmail: string,
  description: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    type,
    userId,
    userEmail,
    description,
    entityType: 'Customer',
    entityId: customerId,
    metadata: {
      customerName,
      ...metadata
    }
  });
}

/**
 * Helper to log transaction-related activities
 */
export async function logTransactionActivity(
  type: ActivityType,
  transactionId: string,
  transactionNumber: string,
  userId: string,
  userEmail: string,
  description: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    type,
    userId,
    userEmail,
    description,
    entityType: 'Transaction',
    entityId: transactionId,
    metadata: {
      transactionNumber,
      ...metadata
    }
  });
}
