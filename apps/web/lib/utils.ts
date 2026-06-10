/**
 * Formats a currency amount into IDR (Rupiah) display format.
 * Example: 5000000 -> "Rp 5.000.000" (or similar depending on i18n specifications).
 */
export function formatRupiah(amount: number): string {
  if (amount === undefined || amount === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO date string into readable local format.
 * Default locale is 'id-ID' with standard options.
 */
export function formatDate(isoString?: string | Date | null, formatOptions?: Intl.DateTimeFormatOptions): string {
  if (!isoString) return '-';
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
  
  if (isNaN(date.getTime())) return '-';

  const defaultOptions: Intl.DateTimeFormatOptions = formatOptions || {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return date.toLocaleDateString('id-ID', defaultOptions);
}

/**
 * Class name merging utility (similar to standard clsx/tailwind-merge patterns).
 */
export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  const classes: string[] = [];
  inputs.forEach(input => {
    if (!input) return;
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      Object.entries(input).forEach(([key, val]) => {
        if (val) classes.push(key);
      });
    }
  });
  return classes.join(' ');
}
