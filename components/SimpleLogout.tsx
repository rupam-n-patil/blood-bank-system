"use client";

import { supabase } from "@/lib/supabase";

export default function SimpleLogout() {
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={logout}
      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium"
    >
      Logout
    </button>
  );
}