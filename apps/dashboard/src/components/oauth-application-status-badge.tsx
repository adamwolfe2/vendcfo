import { cn } from "@vendcfo/ui/cn";

type OAuthApplicationStatus =
  | "approved"
  | "rejected"
  | "pending"
  | "draft"
  | null;

type Props = {
  status: OAuthApplicationStatus;
  className?: string;
};

export function OAuthApplicationStatusBadge({ status, className }: Props) {
  const getStatusColor = (status: OAuthApplicationStatus) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "draft":
        return "text-[#878787] bg-[#F2F1EF] text-[10px]";
      default:
        return "text-[#878787] bg-[#F2F1EF] text-[10px]";
    }
  };

  return (
    <div
      className={cn(
        "text-[10px] px-3 py-1 rounded-full capitalize",
        getStatusColor(status),
        className,
      )}
    >
      {status === "pending" ? "Reviewing" : status}
    </div>
  );
}
