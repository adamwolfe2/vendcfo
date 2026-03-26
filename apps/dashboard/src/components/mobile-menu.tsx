"use client";

import { Button } from "@vendcfo/ui/button";
import { Icons } from "@vendcfo/ui/icons";
import { Sheet, SheetContent, SheetTrigger } from "@vendcfo/ui/sheet";
import { useState } from "react";
import { MainMenu } from "./main-menu";

export function MobileMenu() {
  const [isOpen, setOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className="rounded-full w-[44px] h-[44px] min-w-[44px] min-h-[44px] items-center relative flex md:hidden"
        >
          <Icons.Menu size={16} />
        </Button>
      </div>
      <SheetContent side="left" className="border-none rounded-none -ml-4">
        <div className="ml-2 mb-8">
          <Icons.LogoSmall />
        </div>

        <div className="-ml-2">
          <MainMenu onSelect={() => setOpen(false)} isExpanded={true} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
