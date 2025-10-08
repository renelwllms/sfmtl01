// NZ date and time formatting utilities

/**
 * Format date to NZ format: dd/MM/yyyy
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "25/12/2024")
 */
export function formatNZDate(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format datetime to NZ format: dd/MM/yyyy HH:mm
 * @param date - Date string or Date object
 * @returns Formatted datetime string (e.g., "25/12/2024 14:30")
 */
export function formatNZDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Format datetime to NZ format with seconds: dd/MM/yyyy HH:mm:ss
 * @param date - Date string or Date object
 * @returns Formatted datetime string (e.g., "25/12/2024 14:30:45")
 */
export function formatNZDateTimeWithSeconds(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format time to NZ format: HH:mm
 * @param date - Date string or Date object
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatNZTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}
