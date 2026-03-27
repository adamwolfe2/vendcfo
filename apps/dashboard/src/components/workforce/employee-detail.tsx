"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  Banknote,
  Briefcase,
  ChevronLeft,
  Clock,
  DollarSign,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CompensationModal } from "./compensation-modal";
import { EMPLOYMENT_TYPES, PAY_MODEL_LABELS } from "./constants";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { EmployeePaymentHistory } from "./employee-payment-history";
import { fmtCurrency, formatDate, maskValue, toNum } from "./helpers";
import { RecordPaymentModal } from "./record-payment-modal";
import type { CompensationPlanRow, EmployeeRow } from "./types";

// ---------------------------------------------------------------------------
// Employee Detail View
// ---------------------------------------------------------------------------

export function EmployeeDetail({
  employee,
  teamId,
  onBack,
  onEdit,
  onRefresh,
}: {
  employee: EmployeeRow;
  teamId: string;
  onBack: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const supabase: any = createClient();
  const [plans, setPlans] = useState<CompensationPlanRow[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editPlan, setEditPlan] = useState<CompensationPlanRow | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    const { data } = await supabase
      .from("compensation_plans")
      .select("*")
      .eq("employee_id", employee.id)
      .order("is_active", { ascending: false })
      .order("effective_from", { ascending: false });
    if (data) setPlans(data as CompensationPlanRow[]);
    setLoadingPlans(false);
  }, [supabase, employee.id]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDeletePlan = async () => {
    if (!deletePlanId) return;
    setDeletingPlan(true);
    const { error } = await supabase
      .from("compensation_plans")
      .delete()
      .eq("id", deletePlanId);
    if (!error) {
      setPlans((prev) => prev.filter((p) => p.id !== deletePlanId));
    }
    setDeletePlanId(null);
    setDeletingPlan(false);
  };

  const activePlan = plans.find((p) => p.is_active);

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 min-h-[44px] text-sm text-[#666] transition-colors hover:text-[#111]"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
        Back to Employees
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] text-[#666]">
            <User size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111]">{employee.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {employee.role && (
                <span className="text-sm text-[#666]">{employee.role}</span>
              )}
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  employee.is_active
                    ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                    : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                }`}
              >
                {employee.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d0d0] bg-white px-3 py-2 min-h-[44px] text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5]"
        >
          <Pencil size={14} strokeWidth={1.5} />
          Edit
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Basic Info */}
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#111] mb-3">
            Basic Info
          </h3>
          <div className="space-y-2.5">
            {employee.email && (
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Mail size={14} strokeWidth={1.5} className="text-[#999]" />
                {employee.email}
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Phone size={14} strokeWidth={1.5} className="text-[#999]" />
                {employee.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-[#555]">
              <Briefcase size={14} strokeWidth={1.5} className="text-[#999]" />
              {EMPLOYMENT_TYPES[employee.employment_type] ??
                employee.employment_type}
            </div>
            {employee.hire_date && (
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Clock size={14} strokeWidth={1.5} className="text-[#999]" />
                Hired {formatDate(employee.hire_date)}
              </div>
            )}
          </div>
        </div>

        {/* Active Compensation Plan */}
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#111] mb-3">
            Active Pay Model
          </h3>
          {loadingPlans ? (
            <div className="h-16 animate-pulse rounded bg-[#f5f5f5]" />
          ) : activePlan ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                  {PAY_MODEL_LABELS[activePlan.pay_model] ??
                    activePlan.pay_model}
                </span>
                <span className="text-xs text-[#999]">{activePlan.name}</span>
              </div>
              {(activePlan.pay_model === "hourly" ||
                activePlan.pay_model === "hybrid") && (
                <div className="flex items-center gap-2 text-sm text-[#555]">
                  <DollarSign
                    size={14}
                    strokeWidth={1.5}
                    className="text-[#999]"
                  />
                  {fmtCurrency(toNum(activePlan.hourly_rate))}/hr
                </div>
              )}
              {activePlan.pay_model === "per_task" && (
                <>
                  <div className="text-sm text-[#555]">
                    {fmtCurrency(toNum(activePlan.per_machine_rate))}/machine
                  </div>
                  <div className="text-sm text-[#555]">
                    {fmtCurrency(toNum(activePlan.per_stop_rate))}/stop
                  </div>
                </>
              )}
              {activePlan.pay_model === "hybrid" &&
                toNum(activePlan.revenue_share_pct) > 0 && (
                  <div className="text-sm text-[#555]">
                    +{toNum(activePlan.revenue_share_pct)}% revenue share
                  </div>
                )}
            </div>
          ) : (
            <p className="text-sm text-[#999]">No active compensation plan</p>
          )}
        </div>

        {/* ACH Info */}
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#111] mb-3">
            ACH Payment
          </h3>
          {employee.bank_routing_number || employee.bank_account_number ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Banknote
                  size={14}
                  strokeWidth={1.5}
                  className="text-[#999]"
                />
                Routing: {maskValue(employee.bank_routing_number)}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Banknote
                  size={14}
                  strokeWidth={1.5}
                  className="text-[#999]"
                />
                Account: {maskValue(employee.bank_account_number)}
              </div>
              <div className="text-xs text-[#999] capitalize">
                {employee.bank_account_type ?? "checking"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#999]">No bank info on file</p>
          )}
        </div>
      </div>

      {/* Compensation Plans table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#111]">
            Compensation Plans
          </h3>
          <button
            type="button"
            onClick={() => setShowAddPlan(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3 py-1.5 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333]"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add Plan
          </button>
        </div>

        {loadingPlans ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
              />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-8 text-center">
            <DollarSign
              size={24}
              strokeWidth={1.5}
              className="mx-auto mb-2 text-[#bbb]"
            />
            <p className="text-sm text-[#666]">
              No compensation plans yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-4 py-3 text-left font-medium text-[#555]">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#555]">
                    Pay Model
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[#555]">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#555]">
                    Effective
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-[#555]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[#555]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-[#111]">
                      {plan.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                        {PAY_MODEL_LABELS[plan.pay_model] ?? plan.pay_model}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#555]">
                      {plan.pay_model === "hourly" &&
                        `${fmtCurrency(toNum(plan.hourly_rate))}/hr`}
                      {plan.pay_model === "per_task" &&
                        `${fmtCurrency(toNum(plan.per_stop_rate))}/stop`}
                      {plan.pay_model === "hybrid" &&
                        `${fmtCurrency(toNum(plan.hourly_rate))}/hr + ${toNum(plan.revenue_share_pct)}%`}
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {formatDate(plan.effective_from)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          plan.is_active
                            ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                            : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditPlan(plan)}
                          title="Edit"
                          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                        >
                          <Pencil size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePlanId(plan.id)}
                          title="Delete"
                          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="mb-6" key={paymentRefreshKey}>
        <EmployeePaymentHistory
          employeeId={employee.id}
          teamId={teamId}
          onRecordPayment={() => setShowRecordPayment(true)}
        />
      </div>

      {/* Modals */}
      {showAddPlan && (
        <CompensationModal
          employeeId={employee.id}
          teamId={teamId}
          onClose={() => setShowAddPlan(false)}
          onSaved={fetchPlans}
        />
      )}
      {editPlan && (
        <CompensationModal
          employeeId={employee.id}
          teamId={teamId}
          entry={editPlan}
          onClose={() => setEditPlan(null)}
          onSaved={fetchPlans}
        />
      )}
      {deletePlanId && (
        <DeleteConfirmModal
          label="Plan"
          onConfirm={handleDeletePlan}
          onCancel={() => setDeletePlanId(null)}
          deleting={deletingPlan}
        />
      )}
      {showRecordPayment && (
        <RecordPaymentModal
          employees={[employee]}
          preselectedEmployeeId={employee.id}
          teamId={teamId}
          onClose={() => setShowRecordPayment(false)}
          onSaved={() => setPaymentRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
