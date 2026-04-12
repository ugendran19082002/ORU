export type OnboardingStepStatus = 'pending' | 'in_progress' | 'under_review' | 'completed' | 'skipped' | 'failed';

export interface OnboardingStep {
  id: number;
  step_key: string;
  title: string;
  description: string;
  screen_route: string;
  icon_name: string;
  is_mandatory: boolean;
  is_skippable: boolean;
  sort_order: number;
  status: OnboardingStepStatus;
  admin_review_status?: 'pending' | 'approved' | 'rejected' | null;
  admin_notes?: string | null;
  document_url?: string | null;
  completed_at?: string | null;
}

export interface OnboardingStatus {
  onboarding_completed: boolean;
  total_steps: number;
  completed_steps: number;
  current_step: OnboardingStep | null;
  steps: OnboardingStep[];
}

export interface ShopCreationData {
  name: string;
  contact_number: string;
  shop_type: 'individual' | 'agency' | 'distributor';
  address?: string;
  latitude?: number;
  longitude?: number;
}
