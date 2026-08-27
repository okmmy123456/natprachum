import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique booking number
 * Format: BK-YYYYMMDD-XXXX (e.g., BK-20240815-A3F2)
 */
export const generateBookingNo = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = uuidv4().slice(0, 4).toUpperCase();
  return `BK-${date}-${suffix}`;
};
