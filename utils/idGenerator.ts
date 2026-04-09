/**
 * Generates a unique, branded Shop ID (TGID) for the ThanniGo platform.
 * Format: TG-S-XXXX (e.g., TG-S-88A2)
 */
export const generateShopId = (): string => {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded O and I for clarity
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TG-S-${result}`;
};
