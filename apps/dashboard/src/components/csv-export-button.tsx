"use client";

import { Download } from "lucide-react";
import { Button } from "@vendcfo/ui/button";

interface CsvExportButtonProps {
  onClick: () => void;
  label?: string;
}

export function CsvExportButton({
  onClick,
  label = "Export CSV",
}: CsvExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-1.5"
    >
      <Download size={14} />
      {label}
    </Button>
  );
}
