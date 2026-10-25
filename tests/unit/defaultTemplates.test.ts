import { describe, it, expect } from 'vitest';
import {
  MASTER_24_SHOT_SEQUENCE,
  getDefaultTemplates,
  getTemplateForBodyStyle,
} from '@/services/templates/defaultTemplates';

describe('Photography Templates & Sequence Engine', () => {
  it('master 24-shot sequence contains exactly 24 standardized angles', () => {
    expect(MASTER_24_SHOT_SEQUENCE).toHaveLength(24);
  });

  it('guarantees Shot #1 is the Front Driver-Side 3/4 Hero shot', () => {
    const heroShot = MASTER_24_SHOT_SEQUENCE[0];
    expect(heroShot.code).toBe('FRONT_3Q_DRIVER');
    expect(heroShot.isHero).toBe(true);
    expect(heroShot.isRequired).toBe(true);
    expect(heroShot.order).toBe(1);
  });

  it('provides D-Drive Auto 20-shot default inventory template', () => {
    const templates = getDefaultTemplates('d-drive-auto');
    const ddriveTemplate = templates.find((t) => t.id === 'template-ddrive-20');

    expect(ddriveTemplate).toBeDefined();
    expect(ddriveTemplate?.shots).toHaveLength(20);
    expect(ddriveTemplate?.isDefault).toBe(true);
    expect(ddriveTemplate?.aspectRatio).toBe('4:3');
  });

  it('adapts template for pickup trucks with bed & tailgate photo', () => {
    const truckTemplate = getTemplateForBodyStyle('truck', 'd-drive-auto');
    expect(truckTemplate.bodyStyle).toBe('truck');

    const bedShot = truckTemplate.shots.find((s) => s.code === 'TRUNK_CARGO');
    expect(bedShot).toBeDefined();
    expect(bedShot?.name).toContain('Truck Bed');
  });

  it('adapts template for convertibles with top up/down guidance', () => {
    const convertibleTemplate = getTemplateForBodyStyle('convertible', 'd-drive-auto');
    expect(convertibleTemplate.bodyStyle).toBe('convertible');

    const profileShot = convertibleTemplate.shots.find((s) => s.code === 'PASSENGER_SIDE');
    expect(profileShot?.guidanceText).toContain('roof');
  });
});
