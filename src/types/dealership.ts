export type UserRole = 'platform_admin' | 'owner' | 'manager' | 'photographer';

export interface Dealership {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  phone?: string;
  city?: string;
  state?: string;
  planId: 'basic' | 'pro' | 'dealer_group';
  maxActiveTemplates: number;
  monthlyVehicleQuota: number;
  storageQuotaGb: number;
  storageUsedMb: number;
  createdAt: string;
}

export interface DealershipMember {
  id: string;
  dealershipId: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  joinedAt: string;
}

export interface PlanEntitlements {
  planId: 'basic' | 'pro' | 'dealer_group';
  name: string;
  monthlyPriceUsd: number;
  features: {
    customTemplates: boolean;
    realtimeQualityChecks: boolean;
    dmsInventorySync: boolean;
    multiUserTeam: boolean;
    cloudStorageGb: number;
    rawExports: boolean;
  };
}
