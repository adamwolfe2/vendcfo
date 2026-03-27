// ---------------------------------------------------------------------------
// Constants for workforce / employees
// ---------------------------------------------------------------------------

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ach: "ACH",
  check: "Check",
  cash: "Cash",
  direct_deposit: "Direct Deposit",
};

export const PAYMENT_STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]",
  },
  processing: {
    label: "Processing",
    className: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
  },
  completed: {
    label: "Completed",
    className: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  },
  failed: {
    label: "Failed",
    className: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
  },
};

export const EMPLOYMENT_TYPES: Record<string, string> = {
  w2: "W-2",
  "1099": "1099",
  part_time: "Part-Time",
  seasonal: "Seasonal",
};

export const PAY_MODEL_LABELS: Record<string, string> = {
  per_task: "Per Task",
  hourly: "Hourly",
  hybrid: "Hybrid",
};
