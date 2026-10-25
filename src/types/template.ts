import { BodyStyle } from './vehicle';

export type ShotCategory = 'exterior' | 'exterior_detail' | 'interior' | 'additional';

export type ShotAngle =
  // Exterior primary
  | 'FRONT_3Q_DRIVER' // Hero
  | 'STRAIGHT_FRONT'
  | 'FRONT_3Q_PASSENGER'
  | 'PASSENGER_SIDE'
  | 'REAR_3Q_PASSENGER'
  | 'STRAIGHT_REAR'
  | 'REAR_3Q_DRIVER'
  | 'DRIVER_SIDE'
  // Exterior details
  | 'WHEEL_FRONT_DRIVER'
  | 'WHEEL_REAR_PASSENGER'
  | 'GRILLE_HEADLIGHT_DETAIL'
  | 'REAR_BADGE_TAILLIGHT'
  // Interior
  | 'DRIVER_COCKPIT'
  | 'STEERING_DASHBOARD'
  | 'INSTRUMENT_CLUSTER'
  | 'FRONT_SEATS'
  | 'REAR_SEATS'
  | 'INFOTAINMENT_CONSOLE'
  // Additional
  | 'TRUNK_CARGO'
  | 'ENGINE_BAY'
  | 'VIN_DOOR_JAMB'
  | 'KEYS_ACCESSORIES'
  | 'CONDITION_DOCUMENTATION'
  | 'ADDITIONAL_FREE';

export interface ShotDefinition {
  id: string;
  code: ShotAngle;
  name: string;
  category: ShotCategory;
  isRequired: boolean;
  isHero: boolean;
  guidanceText: string;
  recommendedDistanceMeters?: number;
  order: number;
}

export interface CaptureTemplate {
  id: string;
  name: string;
  dealershipId: string;
  description: string;
  bodyStyle: BodyStyle;
  aspectRatio: '4:3' | '16:9' | '1:1';
  targetResolutionWidth: number;
  targetResolutionHeight: number;
  shots: ShotDefinition[];
  isDefault: boolean;
}
