"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import useRoleGuard from "@/components/useRoleGuard";
import AppShell from "@/components/AppShell";
import {
  Droplets,
  CalendarDays,
  PackagePlus,
  Search,
} from "lucide-react";

type Inventory = {
  id: number;
  blood_group: string;
  units: number;
  collection_date: string;
  expiry_date: string;
  status: string;
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function getDaysLeft(date: string) {
  const today = new Date();
  const expiry = new Date(date);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function InventoryPage() {
  const loading = useRoleGuard("admin");

  const [bloodGroup, setBloodGroup] = useState("A+");
  const [units, setUnits] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("Available");
  const [records, setRecords] = useState<Inventory[]>([]);
  const [search, setSearch] = useState("");

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("blood_inventory")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) setRecords(data);
  };

  useEffect(() => {
    if (loading) return;
    fetchInventory();
  }, [loading]);

  const filteredRecords = records.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.blood_group?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q)
    );
  });

  const totalUnits = useMemo(
    () => records.reduce((sum, row) => sum + Number(row.units || 0), 0),
    [records]
  );

  const lowStockCount = useMemo(
    () =>
      records.filter(
        (row) =>
          row.status !== "Expired" &&
          Number(row.units) > 0 &&
          Number(row.units) <= 2
      ).length,
    [records]
  );

  const expiringSoonCount = useMemo(
    () =>
      records.filter((row) => {
        const days = getDaysLeft(row.expiry_date);
        return days >= 0 && days <= 7;
      }).length,
    [records]
  );

  if (loading) return null;

  const addInventory = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("blood_inventory").insert([
      {
        blood_group: bloodGroup,
        units: Number(units),
        collection_date: collectionDate,
        expiry_date: expiryDate,
        status,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setBloodGroup("A+");
    setUnits("");
    setCollectionDate("");
    setExpiryDate("");
    setStatus("Available");

    fetchInventory();
  };

  return (
    <AppShell
      title="Inventory Management"
      subtitle="Track blood stock, expiry dates, and availability status."
    >
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-rose-300/10 p-3">
                <PackagePlus className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Add Inventory Record</h3>
                <p className="text-sm text-zinc-400">
                  Record collected blood units and availability data
                </p>
              </div>
            </div>

            <form onSubmit={addInventory} className="grid gap-4 md:grid-cols-2">
              <select
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>

              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none placeholder:text-zinc-500"
                placeholder="Units"
                type="number"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                required
              />

              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none"
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                required
              />

              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />

              <select
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none md:col-span-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Expired">Expired</option>
              </select>

              <button className="md:col-span-2 rounded-2xl bg-zinc-100 px-4 py-3 font-medium text-zinc-950 transition hover:bg-white">
                Add Inventory Record
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
            <h3 className="text-xl font-semibold">Inventory Summary</h3>
            <p className="mt-1 text-sm text-zinc-400">Quick blood stock overview</p>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <p className="text-sm text-zinc-400">Total Units</p>
                <p className="mt-2 text-3xl font-semibold">{totalUnits}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <p className="text-sm text-zinc-400">Low Stock Records</p>
                <p className="mt-2 text-3xl font-semibold">{lowStockCount}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <p className="text-sm text-zinc-400">Expiring Soon</p>
                <p className="mt-2 text-3xl font-semibold">{expiringSoonCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Inventory Records</h3>
              <p className="text-sm text-zinc-400">
                Review blood stock levels and expiry information
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 py-3 pl-10 pr-4 text-white outline-none placeholder:text-zinc-500"
                placeholder="Search by blood group or status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((item) => {
                const daysLeft = getDaysLeft(item.expiry_date);
                const lowStock =
                  item.status !== "Expired" &&
                  Number(item.units) > 0 &&
                  Number(item.units) <= 2;
                const expiringSoon = daysLeft >= 0 && daysLeft <= 7;

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex rounded-full border border-rose-300/15 bg-rose-300/10 px-3 py-1 text-sm font-medium text-rose-100">
                          <Droplets className="mr-2 h-4 w-4" />
                          {item.blood_group}
                        </div>
                        <p className="mt-3 text-2xl font-semibold">{item.units} units</p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === "Expired"
                            ? "bg-zinc-700 text-zinc-300"
                            : item.status === "Reserved"
                            ? "bg-sky-300/10 text-sky-200"
                            : "bg-emerald-300/10 text-emerald-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-zinc-300">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-zinc-400" />
                        <span>Collection Date: {item.collection_date}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-zinc-400" />
                        <span>Expiry Date: {item.expiry_date}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {lowStock && (
                        <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
                          Low stock
                        </span>
                      )}
                      {expiringSoon && (
                        <span className="rounded-full bg-rose-300/10 px-3 py-1 text-xs text-rose-200">
                          Expiring soon
                        </span>
                      )}
                      {daysLeft < 0 && (
                        <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs text-zinc-200">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 text-sm text-zinc-400 lg:col-span-2">
                No inventory records found.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}