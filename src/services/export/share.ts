export function safeExportName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'VEHICLE';
}
export function canShareFile(file: File) {
  try {
    return !!navigator.share && !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}
export async function shareFile(file: File) {
  // Caller invokes this directly from a tap, after file preparation, to preserve mobile activation.
  await navigator.share({ files: [file], title: 'Smart Capture gallery' });
}
