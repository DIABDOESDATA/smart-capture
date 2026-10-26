import { VehicleCaptureSession, CapturedShot } from '@/types/capture';
import { CaptureTemplate } from '@/types/template';
export function missingRequired(template: CaptureTemplate, shots: CapturedShot[]) {
  return template.shots.filter((t) => t.isRequired && !shots.some((s) => s.shotCode === t.code));
}
export function nextMissing(template: CaptureTemplate, shots: CapturedShot[], from = 0) {
  for (let i = 0; i < template.shots.length; i++) {
    const idx = (from + i) % template.shots.length;
    if (!shots.some((s) => s.shotCode === template.shots[idx].code)) return idx;
  }
  return Math.min(from, template.shots.length - 1);
}
export function replaceShot(
  session: VehicleCaptureSession,
  shot: CapturedShot
): VehicleCaptureSession {
  const old = session.shots.find((s) => s.shotCode === shot.shotCode);
  const next = {
    ...shot,
    shotId: old?.shotId || shot.shotId,
    sequenceOrder: old?.sequenceOrder || shot.sequenceOrder,
    isHero: old?.isHero ?? shot.isHero,
    retakeCount: old ? old.retakeCount + 1 : 0,
    previousImageId: old?.imageId,
  };
  const shots = old
    ? session.shots.map((s) => (s.shotCode === shot.shotCode ? next : s))
    : [...session.shots, next];
  if (next.isHero)
    shots.forEach((s) => {
      if (s.shotCode !== next.shotCode) s.isHero = false;
    });
  return {
    ...session,
    shots,
    status: 'in_progress',
    completedAt: undefined,
    updatedAt: new Date().toISOString(),
  };
}
