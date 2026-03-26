import { Loader2 } from "lucide-react";

export default function ReconciliationLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-[#999]" />
    </div>
  );
}
