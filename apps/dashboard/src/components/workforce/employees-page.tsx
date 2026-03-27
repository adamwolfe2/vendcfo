"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  CreditCard,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CompensationSummary } from "./compensation-summary";
import { EMPLOYMENT_TYPES, PAY_MODEL_LABELS } from "./constants";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { EmployeeDetail } from "./employee-detail";
import { EmployeeModal } from "./employee-modal";
import { formatDate } from "./helpers";
import { PaymentHistorySection } from "./payment-history-section";
import { RecordPaymentModal } from "./record-payment-modal";
import type { CompensationPlanRow, EmployeeRow, PaymentRow } from "./types";

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <Users size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No employees yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Add your first employee to start tracking compensation and payroll.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333]"
      >
        <Plus size={16} strokeWidth={1.5} />
        Add Employee
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EmployeesPage({
  initialData,
  initialPlans,
  teamId,
}: {
  initialData: EmployeeRow[];
  initialPlans: CompensationPlanRow[];
  teamId: string;
}) {
  const supabase: any = createClient();
  const [employees, setEmployees] = useState<EmployeeRow[]>(initialData);
  const [allPlans, setAllPlans] = useState<CompensationPlanRow[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<EmployeeRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"employees" | "payments">(
    "employees",
  );
  const [allPayments, setAllPayments] = useState<PaymentRow[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const [empRes, planRes] = await Promise.all([
      supabase
        .from("employees")
        .select("*")
        .eq("business_id", teamId)
        .order("name", { ascending: true }),
      supabase
        .from("compensation_plans")
        .select("*")
        .eq("business_id", teamId)
        .order("effective_from", { ascending: false }),
    ]);
    if (empRes.data) setEmployees(empRes.data as EmployeeRow[]);
    if (planRes.data) setAllPlans(planRes.data as CompensationPlanRow[]);
    setLoading(false);
  }, [supabase, teamId]);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    const { data } = await supabase
      .from("employee_payments")
      .select("*")
      .eq("business_id", teamId)
      .order("payment_date", { ascending: false })
      .limit(50);
    if (data) setAllPayments(data as PaymentRow[]);
    setLoadingPayments(false);
  }, [supabase, teamId]);

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    }
  }, [activeTab, fetchPayments]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", deleteId);
    if (!error) {
      setEmployees((prev) => prev.filter((e) => e.id !== deleteId));
      setAllPlans((prev) => prev.filter((p) => p.employee_id !== deleteId));
    }
    setDeleteId(null);
    setDeleting(false);
  };

  // Build a lookup for active plan per employee (for the list view)
  const activePlanByEmployee: Record<string, CompensationPlanRow> = {};
  for (const plan of allPlans) {
    if (plan.is_active) {
      activePlanByEmployee[plan.employee_id] = plan;
    }
  }

  // If viewing a specific employee detail
  if (selectedEmployee) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
        <EmployeeDetail
          employee={selectedEmployee}
          teamId={teamId}
          onBack={() => {
            setSelectedEmployee(null);
            fetchEmployees();
          }}
          onEdit={() => setEditEntry(selectedEmployee)}
          onRefresh={fetchEmployees}
        />

        {editEntry && (
          <EmployeeModal
            mode="edit"
            entry={editEntry}
            teamId={teamId}
            onClose={() => setEditEntry(null)}
            onSaved={() => {
              fetchEmployees().then(() => {
                // Refresh the selected employee with latest data
                const updated = employees.find(
                  (e) => e.id === selectedEmployee.id,
                );
                if (updated) setSelectedEmployee(updated);
              });
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your workforce, compensation plans, and payment info.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "payments" && (
            <button
              type="button"
              onClick={() => setShowRecordPaymentModal(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
            >
              <Plus size={16} strokeWidth={1.5} />
              Record Payment
            </button>
          )}
          {activeTab === "employees" && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
            >
              <Plus size={16} strokeWidth={1.5} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-[#e0e0e0]">
        <button
          type="button"
          onClick={() => setActiveTab("employees")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "employees"
              ? "border-[#111] text-[#111]"
              : "border-transparent text-[#999] hover:text-[#666]"
          }`}
        >
          <Users size={16} strokeWidth={1.5} />
          Employees
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "payments"
              ? "border-[#111] text-[#111]"
              : "border-transparent text-[#999] hover:text-[#666]"
          }`}
        >
          <CreditCard size={16} strokeWidth={1.5} />
          Payments
        </button>
      </div>

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <>
          {/* Compensation Summary */}
          {!loading && employees.length > 0 && (
            <CompensationSummary employees={employees} plans={allPlans} />
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
                />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState onAdd={() => setShowAddModal(true)} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left font-medium text-[#555]">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#555]">
                      Role
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-[#555]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#555]">
                      Hire Date
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-[#555]">
                      Pay Model
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
                  {employees.map((emp) => {
                    const plan = activePlanByEmployee[emp.id];
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#666]">
                              <User size={16} strokeWidth={1.5} />
                            </div>
                            <div>
                              <span className="font-semibold text-[#111]">
                                {emp.name}
                              </span>
                              {emp.email && (
                                <p className="text-xs text-[#999]">
                                  {emp.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#666]">
                          {emp.role || "--"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                            {EMPLOYMENT_TYPES[emp.employment_type] ??
                              emp.employment_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#666]">
                          {formatDate(emp.hire_date)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {plan ? (
                            <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                              {PAY_MODEL_LABELS[plan.pay_model] ??
                                plan.pay_model}
                            </span>
                          ) : (
                            <span className="text-xs text-[#999]">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              emp.is_active
                                ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                                : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                            }`}
                          >
                            {emp.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setEditEntry(emp)}
                              title="Edit"
                              className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                            >
                              <Pencil size={16} strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(emp.id)}
                              title="Delete"
                              className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && employees.length > 0 && (
            <p className="mt-4 text-xs text-[#999]">
              {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </p>
          )}
        </>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <PaymentHistorySection
          payments={allPayments}
          employees={employees}
          loading={loadingPayments}
          onRecordPayment={() => setShowRecordPaymentModal(true)}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <EmployeeModal
          mode="add"
          teamId={teamId}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchEmployees}
        />
      )}
      {editEntry && !selectedEmployee && (
        <EmployeeModal
          mode="edit"
          entry={editEntry}
          teamId={teamId}
          onClose={() => setEditEntry(null)}
          onSaved={fetchEmployees}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          label="Employee"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          deleting={deleting}
        />
      )}
      {showRecordPaymentModal && (
        <RecordPaymentModal
          employees={employees}
          teamId={teamId}
          onClose={() => setShowRecordPaymentModal(false)}
          onSaved={() => {
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}
