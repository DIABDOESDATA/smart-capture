import { CaptureTemplate, ShotDefinition } from '@/types/template';
import { BodyStyle } from '@/types/vehicle';
export const MASTER_24_SHOT_SEQUENCE: ShotDefinition[] = [
  // 1-8 Exterior standard walkaround
  {
    id: 'shot-01',
    code: 'FRONT_3Q_DRIVER',
    name: 'Front Driver-Side 3/4 (Hero)',
    category: 'exterior',
    isRequired: true,
    isHero: true,
    guidanceText:
      'Step 45° to the driver front corner. Align headlights, wheels, and front bumper.',

    order: 1,
  },
  {
    id: 'shot-02',
    code: 'STRAIGHT_FRONT',
    name: 'Straight Front',
    category: 'exterior',
    isRequired: true,
    isHero: false,
    guidanceText: 'Stand directly center-front. Center badge and align horizontal bumper guide.',

    order: 2,
  },
  {
    id: 'shot-03',
    code: 'FRONT_3Q_PASSENGER',
    name: 'Front Passenger-Side 3/4',
    category: 'exterior',
    isRequired: true,
    isHero: false,
    guidanceText: 'Step 45° to passenger front corner. Balance hood length and side bodyline.',

    order: 3,
  },
  {
    id: 'shot-04',
    code: 'PASSENGER_SIDE',
    name: 'Passenger-Side Full Profile',
    category: 'exterior',
    isRequired: true,
    isHero: false,
    guidanceText:
      'Step back to center-passenger side. Ensure both wheels sit on the horizon guide.',

    order: 4,
  },
  {
    id: 'shot-05',
    code: 'REAR_3Q_PASSENGER',
    name: 'Rear Passenger-Side 3/4',
    category: 'exterior',
    isRequired: true,
    isHero: false,
    guidanceText:
      'Position at rear passenger quarter. Frame taillight, trunk line, and rear wheel.',

    order: 5,
  },
  {
    id: 'shot-06',
    code: 'STRAIGHT_REAR',
    name: 'Straight Rear',
    category: 'exterior',
    isRequired: true,
    isHero: false,
    guidanceText: 'Stand directly behind center bumper. Level license plate and rear window.',

    order: 6,
  },
  {
    id: 'shot-07',
    code: 'REAR_3Q_DRIVER',
    name: 'Rear Driver-Side 3/4',
    category: 'exterior',
    isRequired: true,
    isHero: false,
    guidanceText: 'Position at rear driver corner. Align rear quarter panel and exhaust tips.',

    order: 7,
  },
  {
    id: 'shot-08',
    code: 'DRIVER_SIDE',
    name: 'Driver-Side Full Profile',
    category: 'exterior',
    isRequired: true,
    isHero: false,
    guidanceText: 'Step back to center-driver side. Frame both wheels flat along lower guideline.',

    order: 8,
  },
  // 9-12 Exterior Details
  {
    id: 'shot-09',
    code: 'WHEEL_FRONT_DRIVER',
    name: 'Front Driver Wheel & Tire',
    category: 'exterior_detail',
    isRequired: true,
    isHero: false,
    guidanceText: 'Crouch at wheel center. Center wheel cap with brake caliper visible.',

    order: 9,
  },
  {
    id: 'shot-10',
    code: 'WHEEL_REAR_PASSENGER',
    name: 'Rear Passenger Wheel & Tire',
    category: 'exterior_detail',
    isRequired: false,
    isHero: false,
    guidanceText: 'Crouch square with rear wheel. Show tire tread depth and wheel rim condition.',

    order: 10,
  },
  {
    id: 'shot-11',
    code: 'GRILLE_HEADLIGHT_DETAIL',
    name: 'Grille & Headlight Detail',
    category: 'exterior_detail',
    isRequired: false,
    isHero: false,
    guidanceText: 'Close-up of front emblem, grille texture, and driver headlight assembly.',

    order: 11,
  },
  {
    id: 'shot-12',
    code: 'REAR_BADGE_TAILLIGHT',
    name: 'Rear Badge & Model Trim Detail',
    category: 'exterior_detail',
    isRequired: false,
    isHero: false,
    guidanceText: 'Close-up of vehicle badge, trim lettering, and rear taillight lens.',

    order: 12,
  },
  // 13-18 Interior
  {
    id: 'shot-13',
    code: 'DRIVER_COCKPIT',
    name: 'Driver Cockpit & Door Open',
    category: 'interior',
    isRequired: true,
    isHero: false,
    guidanceText: 'Open driver door. Frame driver seat bolsters, pedals, and steering wheel.',

    order: 13,
  },
  {
    id: 'shot-14',
    code: 'STEERING_DASHBOARD',
    name: 'Dashboard & Steering Wheel',
    category: 'interior',
    isRequired: true,
    isHero: false,
    guidanceText:
      'Sit in passenger or rear seat. Frame complete steering wheel, dash, and air vents.',

    order: 14,
  },
  {
    id: 'shot-15',
    code: 'INSTRUMENT_CLUSTER',
    name: 'Instrument Cluster & Odometer',
    category: 'interior',
    isRequired: true,
    isHero: false,
    guidanceText: 'Ignition on. Frame odometer mileage clearly without steering wheel glare.',

    order: 15,
  },
  {
    id: 'shot-16',
    code: 'FRONT_SEATS',
    name: 'Front Seats & Center Armrest',
    category: 'interior',
    isRequired: true,
    isHero: false,
    guidanceText:
      'Shoot from back seat looking forward. Show both seat cushions and center console.',

    order: 16,
  },
  {
    id: 'shot-17',
    code: 'REAR_SEATS',
    name: 'Rear Passenger Seats',
    category: 'interior',
    isRequired: true,
    isHero: false,
    guidanceText: 'Open rear door. Frame rear passenger bench, headrests, and legroom.',

    order: 17,
  },
  {
    id: 'shot-18',
    code: 'INFOTAINMENT_CONSOLE',
    name: 'Infotainment Screen & Shifter',
    category: 'interior',
    isRequired: true,
    isHero: false,
    guidanceText:
      'Display navigation/radio active. Frame screen, climate controls, and gear shift.',

    order: 18,
  },
  // 19-24 Additional & Condition
  {
    id: 'shot-19',
    code: 'TRUNK_CARGO',
    name: 'Trunk / Cargo Space',
    category: 'additional',
    isRequired: true,
    isHero: false,
    guidanceText: 'Trunk lid open. Capture cargo floor, spare tire compartment, or folding seats.',

    order: 19,
  },
  {
    id: 'shot-20',
    code: 'ENGINE_BAY',
    name: 'Engine Compartment',
    category: 'additional',
    isRequired: true,
    isHero: false,
    guidanceText: 'Hood propped open. Shoot clean engine bay showing fluid reservoirs and battery.',

    order: 20,
  },
  {
    id: 'shot-21',
    code: 'VIN_DOOR_JAMB',
    name: 'VIN Plate & Door Sticker',
    category: 'additional',
    isRequired: true,
    isHero: false,
    guidanceText: 'High clarity macro of driver door jamb federal safety / tire pressure sticker.',

    order: 21,
  },
  {
    id: 'shot-22',
    code: 'KEYS_ACCESSORIES',
    name: 'Key Fobs & Owner Manuals',
    category: 'additional',
    isRequired: false,
    isHero: false,
    guidanceText: 'Display keys, master fobs, books, or window sticker on clean console or seat.',

    order: 22,
  },
  {
    id: 'shot-23',
    code: 'CONDITION_DOCUMENTATION',
    name: 'Condition & Imperfection Log',
    category: 'additional',
    isRequired: false,
    isHero: false,
    guidanceText:
      'Close-up of any noticeable scratches, dings, or wear for transparent disclosure.',

    order: 23,
  },
  {
    id: 'shot-24',
    code: 'ADDITIONAL_FREE',
    name: 'Dealership Specialty / Extra Feature',
    category: 'additional',
    isRequired: false,
    isHero: false,
    guidanceText: 'Sunroof, bedliner, tow hitch, upgraded sound, or custom modifications.',

    order: 24,
  },
];
/**
 * Creates default templates for dealerships based on body style and workflow requirements.
 */
export function getDefaultTemplates(dealershipId: string = 'default'): CaptureTemplate[] {
  // D-Drive 20-Shot Premium Inventory
  const ddrive20Shots = MASTER_24_SHOT_SEQUENCE.filter(
    (s) => s.order !== 10 && s.order !== 12 && s.order !== 23 && s.order !== 24
  ).map((s, idx) => ({ ...s, order: idx + 1 }));
  // 12-Shot Retail Fast Capture (8 exterior + 4 key interior)
  const fast12Shots = [
    ...MASTER_24_SHOT_SEQUENCE.slice(0, 8),
    MASTER_24_SHOT_SEQUENCE[12], // Cockpit
    MASTER_24_SHOT_SEQUENCE[13], // Dashboard
    MASTER_24_SHOT_SEQUENCE[14], // Cluster
    MASTER_24_SHOT_SEQUENCE[18], // Trunk
  ].map((s, idx) => ({ ...s, order: idx + 1 }));
  // 8-Shot Wholesale Quick Capture
  const wholesale8Shots = MASTER_24_SHOT_SEQUENCE.slice(0, 8).map((s, idx) => ({
    ...s,
    order: idx + 1,
  }));
  return [
    {
      id: 'template-ddrive-20',
      name: 'Premium Inventory (20 Shots)',
      dealershipId,
      description: 'A complete 20-photo professional vehicle sequence.',
      bodyStyle: 'sedan',
      aspectRatio: '4:3',
      targetResolutionWidth: 2048,
      targetResolutionHeight: 1536,
      shots: ddrive20Shots,
      isDefault: true,
    },
    {
      id: 'template-master-24',
      name: 'Full 24-Shot Luxury Showcase',
      dealershipId,
      description:
        'Comprehensive 24-photo walkaround covering exterior, engine, cluster, and details.',
      bodyStyle: 'sedan',
      aspectRatio: '4:3',
      targetResolutionWidth: 2048,
      targetResolutionHeight: 1536,
      shots: MASTER_24_SHOT_SEQUENCE,
      isDefault: false,
    },
    {
      id: 'template-fast-12',
      name: 'Fast Retail 12-Shot Express',
      dealershipId,
      description: 'Speedy 12-shot template for fast lot turnaround and high-volume intake.',
      bodyStyle: 'sedan',
      aspectRatio: '4:3',
      targetResolutionWidth: 1920,
      targetResolutionHeight: 1440,
      shots: fast12Shots,
      isDefault: false,
    },
    {
      id: 'template-wholesale-8',
      name: 'Wholesale 8-Shot Exterior Only',
      dealershipId,
      description:
        'Exterior 360° walkaround for dealer auction listings and wholesale disposition.',
      bodyStyle: 'sedan',
      aspectRatio: '4:3',
      targetResolutionWidth: 1920,
      targetResolutionHeight: 1440,
      shots: wholesale8Shots,
      isDefault: false,
    },
  ];
}
/**
 * Returns customized template for specific body style (e.g. pickup trucks getting bed photo)
 */
export function getTemplateForBodyStyle(
  bodyStyle: BodyStyle,
  dealershipId: string = 'default'
): CaptureTemplate {
  const base = getDefaultTemplates(dealershipId)[0];
  const shots = [...base.shots];
  if (bodyStyle === 'truck') {
    // Replace trunk shot with truck bed shot
    const trunkIdx = shots.findIndex((s) => s.code === 'TRUNK_CARGO');
    if (trunkIdx !== -1) {
      shots[trunkIdx] = {
        ...shots[trunkIdx],
        name: 'Truck Bed & Tailgate',
        guidanceText: 'Tailgate down or shoot from bumper looking into the truck bed and liner.',
      };
    }
  } else if (bodyStyle === 'convertible') {
    // Add roof up and down guidance
    const profileIdx = shots.findIndex((s) => s.code === 'PASSENGER_SIDE');
    if (profileIdx !== -1) {
      shots[profileIdx] = {
        ...shots[profileIdx],
        guidanceText: 'Passenger profile with roof stowed down (or raised if weather requires).',
      };
    }
  }
  return {
    ...base,
    id: `template-${bodyStyle}-default`,
    name: `${bodyStyle.toUpperCase()} Standard Template`,
    bodyStyle,
    shots,
  };
}
