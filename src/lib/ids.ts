import { DateTime } from 'luxon';
import { db } from '@/lib/db';

export async function nextCustomerId() {
  return await db.$transaction(async (tx) => {
    const c = await tx.counter.update({
      where: { name: 'customer' },
      data: { value: { increment: 1 } }
    });
    return `SFMTL${String(c.value).padStart(4, '0')}`;
  });
}

export async function nextTxnNumber() {
  return await db.$transaction(async (tx) => {
    const c = await tx.counter.update({
      where: { name: 'transaction' },
      data: { value: { increment: 1 } }
    });
    const y = DateTime.now().setZone('Pacific/Auckland').toFormat('yyyy');
    const m = DateTime.now().setZone('Pacific/Auckland').toFormat('MM');
    return `TXN-${y}-${m}-${String(c.value).padStart(6, '0')}`;
  });
}
