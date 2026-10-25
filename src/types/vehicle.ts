export type BodyStyle =
  | 'sedan'
  | 'coupe'
  | 'suv'
  | 'crossover'
  | 'truck'
  | 'hatchback'
  | 'wagon'
  | 'van'
  | 'convertible'
  | 'classic'
  | 'other';

export interface Vehicle {
  id: string;
  dealershipId: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyStyle: BodyStyle;
  stockNumber?: string;
  color?: string;
  mileage?: number;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NhtsaVinDecodeResult {
  vin: string;
  isValid: boolean;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyClass?: string;
  suggestedBodyStyle: BodyStyle;
  vehicleType?: string;
  manufacturer?: string;
  plantCountry?: string;
  errorCode?: string;
  errorText?: string;
  raw?: Record<string, string>;
}
