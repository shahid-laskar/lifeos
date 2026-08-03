// Community Domain Types for Phase 8

export type DonationResponse = {
  id: string;
  user_id: string;
  donation_type: string;
  amount: number;
  date: string;
  recipient: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
};

export type DonationCreate = {
  donation_type: string;
  amount: number;
  date: string;
  recipient?: string | null;
  category?: string | null;
};

export type ZakatCalculatorRequest = {
  cash?: number;
  gold_value?: number;
  silver_value?: number;
  investments?: number;
  business_assets?: number;
  debts?: number;
};

export type ZakatCalculatorResponse = {
  total_assets: number;
  net_assets: number;
  zakat_due: number;
  is_eligible: boolean;
};
