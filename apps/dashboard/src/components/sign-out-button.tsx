"use client";

import { createClient } from "@vendcfo/supabase/client";
import { Button } from "@vendcfo/ui/button";

export function SignOutButton() {
  const supabase = createClient();

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => supabase.auth.signOut()}
    >
      Sign out
    </Button>
  );
}
