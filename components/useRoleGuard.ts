"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function useRoleGuard(expectedRole: "admin" | "donor" | "public") {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !profile) {
        router.replace("/login");
        return;
      }

      if (profile.role !== expectedRole) {
        if (profile.role === "admin") router.replace("/dashboard");
        else if (profile.role === "donor") router.replace("/donor");
        else router.replace("/public");
        return;
      }

      if (mounted) setLoading(false);
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, [router, expectedRole]);

  return loading;
}