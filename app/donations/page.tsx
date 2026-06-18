"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useRoleGuard from "@/components/useRoleGuard";
import AppShell from "@/components/AppShell";
import { Syringe, CheckCircle2, XCircle, PackageCheck } from "lucide-react";

type DonationIntent = {
  id: number;
  donor_id: string;
  donor_name: string;
  donor_email: string;
  blood_group: string;
  preferred_date: string;
  notes: string;
  status: string;
  units_to_donate: number;
};

type InventoryRow = {
  id: number;
  blood_group: string;
  units: number;
  collection_date: string | null;
  expiry_date: string | null;
  status: string | null;
};

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString().split("T")[0];
}

export default function DonationsPage() {
  const loading = useRoleGuard("admin");
  const [items, setItems] = useState<DonationIntent[]>([]);

  const loadItems = async () => {
    const { data: donors } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("role", "donor");

    const donorEmails = (donors || []).map((d) => d.email);
    if (donorEmails.length === 0) {
      setItems([]);
      return;
    }

    const { data } = await supabase
      .from("donation_intents")
      .select("*")
      .in("donor_email", donorEmails)
      .order("id", { ascending: false });

    setItems(data || []);
  };

  useEffect(() => {
    if (loading) return;

    loadItems();
    const interval = setInterval(loadItems, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) return null;

  const updateStatus = async (id: number, status: string) => {
    const { error } = await supabase
      .from("donation_intents")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadItems();
  };

  const markCompletedAndAddInventory = async (item: DonationIntent) => {
    const today = new Date();
    const collectionDate = today.toISOString().split("T")[0];
    const expiryDate = addDays(today, 35);
    const unitsToAdd = Number(item.units_to_donate) || 1;

    const { data: existingRow, error: fetchError } = await supabase
      .from("blood_inventory")
      .select("*")
      .eq("blood_group", item.blood_group)
      .maybeSingle<InventoryRow>();

    if (fetchError) {
      alert(fetchError.message);
      return;
    }

    if (existingRow) {
      const { error: updateInventoryError } = await supabase
        .from("blood_inventory")
        .update({
          units: Number(existingRow.units || 0) + unitsToAdd,
          collection_date: collectionDate,
          expiry_date: expiryDate,
          status: "Available",
        })
        .eq("id", existingRow.id);

      if (updateInventoryError) {
        alert(updateInventoryError.message);
        return;
      }
    } else {
      const { error: insertInventoryError } = await supabase
        .from("blood_inventory")
        .insert([
          {
            blood_group: item.blood_group,
            units: unitsToAdd,
            collection_date: collectionDate,
            expiry_date: expiryDate,
            status: "Available",
          },
        ]);

      if (insertInventoryError) {
        alert(insertInventoryError.message);
        return;
      }
    }

    const { error: statusError } = await supabase
      .from("donation_intents")
      .update({ status: "Completed" })
      .eq("id", item.id);

    if (statusError) {
      alert(statusError.message);
      return;
    }

    loadItems();
  };

  return (
    <AppShell
      title="Donation Intents"
      subtitle="Only donor blood submissions appear here. Recipient requests are handled in Requests."
    >
      <div className="grid gap-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="inline-flex rounded-full border border-rose-300/15 bg-rose-300/10 px-3 py-1 text-sm text-rose-100">
                    <Syringe className="mr-2 h-4 w-4" />
                    Donor Submission • {item.blood_group}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{item.donor_name}</h3>
                  <p className="text-sm text-zinc-400">{item.donor_email}</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    Preferred Date: {item.preferred_date || "Not specified"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Units to Donate: {item.units_to_donate || 1}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {item.notes || "No notes added"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      item.status === "Approved"
                        ? "bg-emerald-300/10 text-emerald-200"
                        : item.status === "Completed"
                        ? "bg-sky-300/10 text-sky-200"
                        : item.status === "Rejected"
                        ? "bg-rose-300/10 text-rose-200"
                        : "bg-amber-300/10 text-amber-200"
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.status !== "Approved" && item.status !== "Completed" && (
                    <button
                      onClick={() => updateStatus(item.id, "Approved")}
                      className="inline-flex items-center rounded-full bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Approve
                    </button>
                  )}

                  {item.status !== "Rejected" && item.status !== "Completed" && (
                    <button
                      onClick={() => updateStatus(item.id, "Rejected")}
                      className="inline-flex items-center rounded-full bg-rose-300/10 px-3 py-2 text-xs text-rose-200"
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}

                  {item.status !== "Completed" && (
                    <button
                      onClick={() => markCompletedAndAddInventory(item)}
                      className="inline-flex items-center rounded-full bg-sky-300/10 px-3 py-2 text-xs text-sky-200"
                    >
                      <PackageCheck className="mr-1 h-3.5 w-3.5" />
                      Complete + Add to Inventory
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 text-sm text-zinc-400">
            No donor donation intents found.
          </div>
        )}
      </div>
    </AppShell>
  );
}