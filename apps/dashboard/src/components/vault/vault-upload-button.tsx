"use client";

import { Button } from "@vendcfo/ui/button";
import { Icons } from "@vendcfo/ui/icons";

export function VaultUploadButton() {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => document.getElementById("upload-files")?.click()}
    >
      <Icons.Add size={17} />
    </Button>
  );
}
