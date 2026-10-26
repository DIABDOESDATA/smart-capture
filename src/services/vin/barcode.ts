import { validateVin } from './vinValidator';
/** Barcode values may include Code39 sentinels. Never silently repair VIN characters. */
export function barcodeVin(raw: string): string | null {
  const value = raw
    .trim()
    .toUpperCase()
    .replace(/^\*|\*$/g, '');
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(value) ? value : null;
}
export function acceptedBarcode(raw: string) {
  const vin = barcodeVin(raw);
  return vin && validateVin(vin).isValid ? vin : null;
}
