import { ShotDefinition } from '@/types/template';
export const ADDITIONAL_SHOTS: ShotDefinition[] = [
  {
    code: 'THIRD_ROW',
    name: 'Third-Row Seating',
    category: 'interior',
    guidanceText:
      'Open the rear access door or liftgate. Show all third-row seats, headrests, belts and available legroom.',
  },
  {
    code: 'ROOF_SUNROOF',
    name: 'Roof & Sunroof',
    category: 'interior',
    guidanceText:
      'From the cabin center, frame the complete roof opening, glass and shade. Show fitted controls.',
  },
  {
    code: 'DOOR_TRIM',
    name: 'Door Trim & Controls',
    category: 'interior',
    guidanceText:
      'Door open. Include trim, window switches, handle and speaker; show visible wear honestly.',
  },
  {
    code: 'STEERING_WHEEL',
    name: 'Steering Wheel',
    category: 'interior',
    guidanceText:
      'Center the full wheel rim, spokes and controls. Keep the cluster legible in the background.',
  },
  {
    code: 'CENTER_CONSOLE',
    name: 'Center Console',
    category: 'interior',
    guidanceText:
      'Frame shifter, storage, cup holders and armrest from above without blocking the light.',
  },
  {
    code: 'HOOD_OPEN',
    name: 'Hood Open — Context',
    category: 'additional',
    guidanceText:
      'From the front corner show the open hood, secure support and whole engine aperture.',
  },
  {
    code: 'CONVERTIBLE_ROOF_UP',
    name: 'Convertible Roof Raised',
    category: 'exterior_detail',
    guidanceText:
      'Raise and latch the roof. Show the complete profile, seams, glass and roof condition.',
  },
].map((s, i) => ({
  ...s,
  id: `extra-${s.code}`,
  code: s.code as ShotDefinition['code'],
  category: s.category as ShotDefinition['category'],
  order: i + 25,
  isRequired: false,
  isHero: false,
}));
