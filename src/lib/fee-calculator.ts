import { db } from './db';

export interface FeeSettings {
  feeType: string;
  defaultFeeNzd: number;
  feePercentage: number;
  minimumFeeNzd: number;
  maximumFeeNzd: number | null;
}

export interface FeeBracket {
  minAmount: number;
  maxAmount: number;
  feeAmount: number;
}

export async function calculateFee(amountNzd: number): Promise<number> {
  console.log('[Fee Calculator] Calculating fee for amount:', amountNzd);

  // Get fee settings
  const settings = await db.feeSettings.findFirst();

  if (!settings) {
    console.log('[Fee Calculator] No settings found, using default $5');
    // Default to $5 if no settings found
    return 5.0;
  }

  console.log('[Fee Calculator] Settings:', settings);

  if (settings.feeType === 'BRACKET') {
    // Use bracket-based fees
    const brackets = await db.feeBracket.findMany({
      where: {
        AND: [
          { minAmount: { lte: amountNzd } },
          { maxAmount: { gte: amountNzd } }
        ]
      }
    });

    console.log('[Fee Calculator] Found brackets:', brackets);

    if (brackets.length > 0) {
      console.log('[Fee Calculator] Using bracket fee:', brackets[0].feeAmount);
      return brackets[0].feeAmount;
    }

    // If no bracket found, use default
    console.log('[Fee Calculator] No matching bracket, using default:', settings.defaultFeeNzd);
    return settings.defaultFeeNzd;
  } else if (settings.feeType === 'PERCENTAGE') {
    // Calculate percentage-based fee
    let fee = (amountNzd * settings.feePercentage) / 100;

    // Apply minimum
    if (fee < settings.minimumFeeNzd) {
      fee = settings.minimumFeeNzd;
    }

    // Apply maximum if set
    if (settings.maximumFeeNzd !== null && fee > settings.maximumFeeNzd) {
      fee = settings.maximumFeeNzd;
    }

    console.log('[Fee Calculator] Calculated percentage fee:', fee);
    return fee;
  } else {
    // FIXED fee type
    console.log('[Fee Calculator] Using fixed fee:', settings.defaultFeeNzd);
    return settings.defaultFeeNzd;
  }
}

export async function getFeeSettings(): Promise<FeeSettings | null> {
  const settings = await db.feeSettings.findFirst();
  return settings;
}

export async function getFeeBrackets(): Promise<FeeBracket[]> {
  const brackets = await db.feeBracket.findMany({
    orderBy: {
      minAmount: 'asc'
    }
  });
  return brackets;
}
