"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useRoleGuard from "@/components/useRoleGuard";
import AppShell from "@/components/AppShell";
import {
  Users,
  Droplets,
  ClipboardList,
  HeartPulse,
  AlertTriangle,
} from "lucide-react";

type InventoryRow = {
  blood_group: string;
  units: number;
  status: string;
};

type RequestRow = {
  id: number;
  patient_name: string;
  blood_group: string;
  units_required: number;
  status: string;
};

export default function DashboardPage() {
  const loading = useRoleGuard("admin");

  const [donorCount, setDonorCount] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [lowStockGroups, setLowStockGroups] = useState<string[]>([]);
  const [recentRequests, setRecentRequests] = useState<RequestRow[]>([]);

  useEffect(() => {
    if (loading) return;

    const fetchStats = async () => {
      const { count: donorProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "donor");

      const { data: inventory } = await supabase
        .from("blood_inventory")
        .select("blood_group, units, status");

      const { count: requests } = await supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending");

      const { data: requestData } = await supabase
        .from("requests")
        .select("id, patient_name, blood_group, units_required, status")
        .order("id", { ascending: false })
        .limit(5);

      setDonorCount(donorProfiles || 0);
      setPendingRequests(requests || 0);
      setRecentRequests(requestData || []);

      const rows = (inventory || []) as InventoryRow[];
      const total = rows.reduce((sum, row) => sum + Number(row.units || 0), 0);
      setTotalUnits(total);

      const groups = rows
        .filter((row) => row.status !== "Expired" && Number(row.units) > 0)
        .map((row) => row.blood_group);

      setAvailableGroups([...new Set(groups)]);

      const low = rows
        .filter(
          (row) =>
            row.status !== "Expired" &&
            Number(row.units) > 0 &&
            Number(row.units) <= 2
        )
        .map((row) => row.blood_group);

      setLowStockGroups([...new Set(low)]);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) return null;

  const cards = [
    {
      title: "Registered Donor Accounts",
      value: donorCount,
      icon: Users,
      iconColor: "text-rose-300",
      iconBg: "bg-rose-300/10",
    },
    {
      title: "Blood Units Available",
      value: totalUnits,
      icon: Droplets,
      iconColor: "text-red-300",
      iconBg: "bg-red-300/10",
    },
    {
      title: "Pending Requests",
      value: pendingRequests,
      icon: ClipboardList,
      iconColor: "text-amber-300",
      iconBg: "bg-amber-300/10",
    },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Overview of donor accounts, blood availability, and request activity."
    >
      <div className="space-y-8">
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">{card.title}</p>
                    <h3 className="mt-3 text-4xl font-semibold">{card.value}</h3>
                  </div>
                  <div className={`rounded-2xl p-3 ${card.iconBg}`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-rose-300/10 p-3">
                <HeartPulse className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Available Blood Groups</h3>
                <p className="text-sm text-zinc-400">
                  Groups currently present in inventory
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {availableGroups.length > 0 ? (
                availableGroups.map((group) => (
                  <span
                    key={group}
                    className="rounded-full border border-rose-300/15 bg-rose-300/10 px-4 py-2 text-sm font-medium text-rose-100"
                  >
                    {group}
                  </span>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
                  No blood groups available yet
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-300/10 p-3">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Low Stock Alerts</h3>
                <p className="text-sm text-zinc-400">
                  Blood groups with low available units
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {lowStockGroups.length > 0 ? (
                lowStockGroups.map((group) => (
                  <span
                    key={group}
                    className="rounded-full border border-amber-300/15 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-200"
                  >
                    {group}
                  </span>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
                  No low stock warnings
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
          <h3 className="text-xl font-semibold">Recent Requests</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Latest recipient or hospital requests
          </p>

          <div className="mt-5 grid gap-4">
            {recentRequests.length > 0 ? (
              recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-zinc-100">{req.patient_name}</p>
                    <p className="text-sm text-zinc-400">
                      Blood Group: {req.blood_group} • Units: {req.units_required}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                      req.status === "Completed"
                        ? "bg-emerald-300/10 text-emerald-200"
                        : req.status === "Approved"
                        ? "bg-sky-300/10 text-sky-200"
                        : req.status === "Rejected"
                        ? "bg-rose-300/10 text-rose-200"
                        : "bg-amber-300/10 text-amber-200"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                No requests found yet
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}