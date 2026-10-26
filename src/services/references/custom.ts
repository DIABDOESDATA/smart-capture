import { BodyStyle } from '@/types/vehicle';
import { ShotAngle } from '@/types/template';
import { getSetting, putSetting } from '@/services/storage/indexedDb';
export interface ApprovedReference {
  id: string;
  dealershipId: string;
  body: BodyStyle;
  shot: ShotAngle;
  original: Blob;
  cutout: Blob;
  width: number;
  height: number;
  approvedAt: string;
  label: string;
}
interface StoredReference extends Omit<ApprovedReference, 'original' | 'cutout'> {
  original: ArrayBuffer;
  originalType: string;
  cutout: ArrayBuffer;
}
export const referenceKey = (dealer: string, body: BodyStyle, shot: ShotAngle) =>
  `reference:${dealer}:${body}:${shot}`;
export async function getApprovedReference(dealer: string, body: BodyStyle, shot: ShotAngle) {
  const r = await getSetting<StoredReference>(referenceKey(dealer, body, shot));
  return r
    ? {
        ...r,
        original: new Blob([r.original], { type: r.originalType }),
        cutout: new Blob([r.cutout], { type: 'image/png' }),
      }
    : undefined;
}
export async function saveApprovedReference(r: ApprovedReference) {
  await putSetting(referenceKey(r.dealershipId, r.body, r.shot), {
    ...r,
    original: await r.original.arrayBuffer(),
    originalType: r.original.type,
    cutout: await r.cutout.arrayBuffer(),
  });
}
