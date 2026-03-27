"use client";

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

export function DeleteConfirmModal({
  label,
  onConfirm,
  onCancel,
  deleting,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative mx-4 w-full max-w-sm rounded-lg border border-[#e0e0e0] bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[#111]">
          Delete {label}
        </h3>
        <p className="mt-2 text-sm text-[#666]">
          Are you sure you want to delete this {label.toLowerCase()}? This
          action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 min-h-[44px] text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
