"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };
  return (
    <Button variant="secondary" size="sm" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" /> Salir
    </Button>
  );
}
