import { ADDITIONAL_SHOTS } from './additionalShots';
import { CaptureTemplate } from '@/types/template';
import { BodyStyle } from '@/types/vehicle';
import { getSetting, putSetting } from '@/services/storage/indexedDb';
import { getDefaultTemplates } from './defaultTemplates';
export async function loadTemplates(dealer: string) {
  return (
    (await getSetting<CaptureTemplate[]>(`templates:${dealer}`)) || getDefaultTemplates(dealer)
  );
}
export async function persistTemplates(dealer: string, t: CaptureTemplate[]) {
  await putSetting(`templates:${dealer}`, t);
}
export function adaptTemplate(
  base: CaptureTemplate,
  body: BodyStyle,
  features?: { rearSeats?: boolean; thirdRow?: boolean; sunroof?: boolean }
): CaptureTemplate {
  const shots = base.shots
    .filter((s) => !(features?.rearSeats === false && s.code === 'REAR_SEATS'))
    .map((s) => ({ ...s }));
  for (const s of shots) {
    if (body === 'truck' && s.code === 'TRUNK_CARGO') {
      s.name = 'Truck Bed & Tailgate';
      s.guidanceText =
        'Tailgate lowered. Show the bed floor, cab wall, liner and tailgate condition.';
    }
    if (body === 'convertible' && s.code === 'PASSENGER_SIDE')
      s.guidanceText =
        'Capture the full profile with roof down when weather permits. Use the extra feature shot for roof raised.';
    if (body === 'suv' && s.code === 'TRUNK_CARGO')
      s.guidanceText =
        'Liftgate open. Show cargo floor and seat configuration; photograph third row if fitted.';
  }
  for (const code of [
    features?.thirdRow ? 'THIRD_ROW' : null,
    features?.sunroof ? 'ROOF_SUNROOF' : null,
    body === 'convertible' && features ? 'CONVERTIBLE_ROOF_UP' : null,
  ]) {
    const extra = ADDITIONAL_SHOTS.find((s) => s.code === code);
    if (extra && !shots.some((s) => s.code === code)) shots.push({ ...extra, isRequired: true });
  }
  return {
    ...structuredClone(base),
    bodyStyle: body,
    shots: shots.map((s, i) => ({ ...s, order: i + 1 })),
  };
}
