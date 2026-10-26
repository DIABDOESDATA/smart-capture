import { BodyStyle } from '@/types/vehicle';
import { ShotAngle, ShotDefinition } from '@/types/template';
export interface ReferenceAsset {
  id: string;
  url: string;
  rect: [number, number, number, number];
  mirror: boolean;
  label: string;
  imageWidth?: number;
  imageHeight?: number;
}
const packFor: Record<BodyStyle, string> = {
  sedan: 'sedan',
  suv: 'suv',
  crossover: 'suv',
  truck: 'truck',
  coupe: 'coupe',
  hatchback: 'wagon',
  wagon: 'wagon',
  convertible: 'convertible',
  van: 'van',
  classic: 'classic',
  other: 'sedan',
};
// Curated source windows in original 1254px atlases, independently inspected.
const windows: Record<string, [number, number, number, number][]> = {
  sedan: [
    [0, 300, 465, 270],
    [465, 300, 325, 270],
    [790, 335, 464, 200],
    [0, 740, 465, 280],
    [465, 740, 325, 280],
    [805, 700, 449, 330],
  ],
  suv: [
    [0, 260, 465, 285],
    [465, 260, 325, 285],
    [790, 300, 464, 220],
    [0, 740, 465, 300],
    [465, 740, 325, 300],
    [815, 720, 439, 390],
  ],
  truck: [
    [0, 260, 465, 285],
    [465, 255, 325, 290],
    [790, 305, 464, 215],
    [0, 800, 460, 290],
    [465, 800, 325, 300],
    [800, 745, 454, 390],
  ],
  coupe: [
    [0, 365, 465, 230],
    [465, 365, 325, 230],
    [790, 400, 464, 175],
    [0, 800, 465, 240],
    [465, 800, 325, 240],
    [800, 730, 454, 370],
  ],
  wagon: [
    [0, 305, 465, 275],
    [465, 305, 325, 275],
    [790, 355, 464, 190],
    [0, 765, 465, 300],
    [465, 755, 325, 310],
    [815, 750, 439, 350],
  ],
  convertible: [
    [0, 310, 465, 250],
    [465, 310, 325, 250],
    [790, 340, 464, 190],
    [0, 810, 465, 265],
    [465, 810, 325, 265],
    [805, 780, 449, 330],
  ],
  van: [
    [0, 250, 455, 285],
    [460, 250, 330, 285],
    [790, 300, 464, 210],
    [0, 730, 465, 300],
    [470, 715, 315, 315],
    [800, 715, 454, 340],
  ],
  classic: [
    [0, 335, 465, 255],
    [465, 335, 325, 255],
    [790, 370, 464, 185],
    [0, 800, 465, 270],
    [470, 800, 320, 270],
    [815, 720, 439, 390],
  ],
};
export function referenceAsset(body: BodyStyle, code: ShotAngle): ReferenceAsset | null {
  const views: Partial<Record<ShotAngle, [number, boolean]>> = {
    FRONT_3Q_DRIVER: [0, false],
    STRAIGHT_FRONT: [1, false],
    FRONT_3Q_PASSENGER: [0, true],
    PASSENGER_SIDE: [2, true],
    REAR_3Q_PASSENGER: [3, true],
    STRAIGHT_REAR: [4, false],
    REAR_3Q_DRIVER: [3, false],
    DRIVER_SIDE: [2, false],
    STEERING_DASHBOARD: [5, false],
  };
  const v = views[code];
  if (!v) return null;
  const pack = packFor[body];
  return {
    id: `original-${pack}-${v[0]}-v2`,
    url: `${import.meta.env.BASE_URL}references/${pack}.png`,
    rect: windows[pack][v[0]],
    mirror: v[1],
    label:
      body === 'other'
        ? 'Generic sedan reference; choose or upload matching body style'
        : `${pack} body-style example; adjust to this vehicle`,
  };
}
export interface CompositionGuide {
  landmarks: string[];
  region: 'wide' | 'circle' | 'label' | 'vertical';
  note: string;
}
export function compositionGuide(shot: ShotDefinition, body: BodyStyle): CompositionGuide {
  if (shot.category === 'exterior')
    return {
      landmarks: ['Roofline / full vehicle', 'Center of body', 'Tires / ground plane'],
      region: 'wide',
      note: 'Reference unavailable. Keep the complete vehicle centered with visible space around bumpers, roof and tires. Upload an approved reference when available.',
    };
  const guides: Partial<Record<ShotAngle, CompositionGuide>> = {
    THIRD_ROW: {
      landmarks: ['All headrests', 'Seat belts', 'Legroom'],
      region: 'wide',
      note: 'Use a rear access opening; show the complete third row only when fitted.',
    },
    ROOF_SUNROOF: {
      landmarks: ['Glass aperture', 'Roof lining', 'Shade controls'],
      region: 'wide',
      note: 'Aim upward from cabin center. Include complete roof opening and controls.',
    },
    DOOR_TRIM: {
      landmarks: ['Door handle', 'Switch panel', 'Lower trim'],
      region: 'vertical',
      note: 'Door open; keep the entire trim panel and controls visible.',
    },
    STEERING_WHEEL: {
      landmarks: ['Complete rim', 'Control spokes', 'Cluster context'],
      region: 'circle',
      note: 'Center the wheel and avoid clipping the rim or obscuring controls.',
    },
    CENTER_CONSOLE: {
      landmarks: ['Shifter', 'Storage / cup holders', 'Armrest'],
      region: 'vertical',
      note: 'Frame the full console from above. Avoid reflective glare.',
    },
    HOOD_OPEN: {
      landmarks: ['Raised hood', 'Secure support', 'Engine aperture'],
      region: 'wide',
      note: 'Include hood and full compartment from the front corner.',
    },
    CONVERTIBLE_ROOF_UP: {
      landmarks: ['Roof seams', 'Side glass', 'Full vehicle profile'],
      region: 'wide',
      note: 'Roof raised and latched; document the condition of top and seals.',
    },

    DRIVER_COCKPIT: {
      landmarks: ['Door opening', 'Seat + pedals', 'Complete wheel'],
      region: 'vertical',
      note: 'Stand outside the open driver door. Include door trim and controls; do not crop seat bolsters.',
    },
    INSTRUMENT_CLUSTER: {
      landmarks: ['Cluster hood', 'Odometer', 'Warning lights'],
      region: 'wide',
      note: 'Ignition on; keep digits readable and avoid screen reflections.',
    },
    FRONT_SEATS: {
      landmarks: ['Both headrests', 'Seat cushions', 'Center console'],
      region: 'wide',
      note: 'From the rear seat, show the full front seating area. Adjust for cab layout.',
    },
    REAR_SEATS: {
      landmarks: ['Headrests', 'Full bench', 'Legroom'],
      region: 'wide',
      note: 'Open a rear door and show all seating surfaces; omit this shot if the vehicle has no rear seats.',
    },
    INFOTAINMENT_CONSOLE: {
      landmarks: ['Active screen', 'Climate controls', 'Shifter'],
      region: 'vertical',
      note: 'Keep display text readable. Show console storage and controls without glare.',
    },
    ENGINE_BAY: {
      landmarks: ['Cowl / windshield', 'Both fender edges', 'Front radiator support'],
      region: 'wide',
      note: 'Hood secured open. Include the complete compartment; do not hide leaks or wear.',
    },
    TRUNK_CARGO: {
      landmarks:
        body === 'truck'
          ? ['Cab wall', 'Bed floor', 'Tailgate edge']
          : ['Open aperture', 'Cargo floor', 'Loading sill'],
      region: 'wide',
      note:
        body === 'truck'
          ? 'Tailgate lowered; show full bed and liner condition.'
          : 'Liftgate / trunk fully open. Show floor and side walls; configure folding seats as applicable.',
    },
    VIN_DOOR_JAMB: {
      landmarks: ['Complete label', 'VIN characters', 'Barcode'],
      region: 'label',
      note: 'Keep the label square and legible; avoid flash glare. This image contains a vehicle identifier.',
    },
    KEYS_ACCESSORIES: {
      landmarks: ['All keys', 'Manuals', 'Accessories'],
      region: 'wide',
      note: 'Arrange on a clean surface with space around each item.',
    },
    CONDITION_DOCUMENTATION: {
      landmarks: ['Damage detail', 'Surrounding panel', 'Scale context'],
      region: 'wide',
      note: 'Show scratches, dents and wear honestly. Add a contextual photo if needed.',
    },
    ADDITIONAL_FREE: {
      landmarks: ['Feature context', 'Controls / label', 'Condition'],
      region: 'wide',
      note: 'Show roof / sunroof, third-row seating, special equipment or door controls only when fitted.',
    },
    GRILLE_HEADLIGHT_DETAIL: {
      landmarks: ['Lamp edge', 'Grille texture', 'Panel condition'],
      region: 'wide',
      note: 'Frame the complete headlight and adjacent grille. Preserve visible imperfections.',
    },
    REAR_BADGE_TAILLIGHT: {
      landmarks: ['Badge text', 'Taillight', 'Panel condition'],
      region: 'wide',
      note: 'Keep lettering sharp and include the whole light assembly.',
    },
  };
  return (
    guides[shot.code] || {
      landmarks: ['Tire outline', 'Wheel center', 'Tread / rim condition'],
      region: 'circle',
      note: 'Square the camera to the wheel. Include the whole tire and visible tread.',
    }
  );
}
export const EXTERIOR_ANGLES: Partial<Record<ShotAngle, number>> = {
  STRAIGHT_FRONT: 0,
  FRONT_3Q_PASSENGER: 45,
  PASSENGER_SIDE: 90,
  REAR_3Q_PASSENGER: 135,
  STRAIGHT_REAR: 180,
  REAR_3Q_DRIVER: 225,
  DRIVER_SIDE: 270,
  FRONT_3Q_DRIVER: 315,
};
