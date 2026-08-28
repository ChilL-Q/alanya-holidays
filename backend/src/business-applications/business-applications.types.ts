export const BUSINESS_APPLICATION_ACCOUNT_TYPES = [
  'seller',
  'service_provider',
  'property_host',
  'directory_owner',
] as const;

export type BusinessApplicationAccountType =
  (typeof BUSINESS_APPLICATION_ACCOUNT_TYPES)[number];

export interface BusinessApplication {
  id: string;
  userId: string;
  accountType: BusinessApplicationAccountType;
  businessName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  status: string;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessApplicationsPage {
  items: BusinessApplication[];
  page: number;
  limit: number;
  total: number;
}
