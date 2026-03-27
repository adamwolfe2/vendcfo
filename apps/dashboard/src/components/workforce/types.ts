// ---------------------------------------------------------------------------
// Types for workforce / employees
// ---------------------------------------------------------------------------

export interface EmployeeRow {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  employment_type: string;
  hire_date: string | null;
  is_active: boolean;
  bank_routing_number: string | null;
  bank_account_number: string | null;
  bank_account_type: string | null;
  created_at: string;
}

export interface CompensationPlanRow {
  id: string;
  business_id: string;
  employee_id: string;
  name: string;
  pay_model: string;
  hourly_rate: string | number | null;
  per_machine_rate: string | number | null;
  per_stop_rate: string | number | null;
  revenue_share_pct: string | number | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  business_id: string;
  employee_id: string;
  amount: string | number;
  payment_method: string;
  payment_date: string;
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  status: string;
  reference_number: string | null;
  created_at: string;
}
