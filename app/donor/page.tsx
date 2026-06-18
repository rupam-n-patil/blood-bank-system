"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import useRoleGuard from "@/components/useRoleGuard";
import SimpleLogout from "@/components/SimpleLogout";
import HomeButton from "@/components/HomeButton";
import Link from "next/link";
import {
  HeartHandshake,
  CalendarCheck2,
  BadgeCheck,
  MessageCircleMore,
  UserRound,
  BellRing,
  Syringe,
} from "lucide-react";

type DonationIntent = {
  id: number;
  donor_email: string;
  donor_name: string;
  blood_group: string;
  preferred_date: string;
  notes: string;
  status: string;
  created_at: string;
  units_to_donate: number;
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorDashboardPage() {
  const loading = useRoleGuard("donor");

  const [profile, setProfile] = useState<any>(null);
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [preferredDate, setPreferredDate] = useState("");
  const [unitsToDonate, setUnitsToDonate] = useState("1");
  const [notes, setNotes] = useState("");
  const [donations, setDonations] = useState<DonationIntent[]>([]);

  useEffect(() => {
    if (loading) return;

    const loadProfileAndDonations = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const { data: donationData } = await supabase
        .from("donation_intents")
        .select("*")
        .eq("donor_id", user.id)
        .order("id", { ascending: false });

      setDonations(donationData || []);
    };

    loadProfileAndDonations();
    const interval = setInterval(loadProfileAndDonations, 3000);

    return () => clearInterval(interval);
  }, [loading]);

  const pendingCount = useMemo(
    () => donations.filter((d) => d.status === "Pending").length,
    [donations]
  );
  const approvedCount = useMemo(
    () => donations.filter((d) => d.status === "Approved").length,
    [donations]
  );
  const completedCount = useMemo(
    () => donations.filter((d) => d.status === "Completed").length,
    [donations]
  );

  if (loading) return null;

  const submitDonationIntent = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !profile) return;

    const { error } = await supabase.from("donation_intents").insert([
      {
        donor_id: user.id,
        donor_email: profile.email,
        donor_name: profile.full_name,
        blood_group: bloodGroup,
        preferred_date: preferredDate || null,
        notes,
        units_to_donate: Number(unitsToDonate) || 1,
        status: "Pending",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setBloodGroup("A+");
    setPreferredDate("");
    setUnitsToDonate("1");
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1b2b3a_0%,#101826_30%,#0a0f16_100%)] text-white">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300/70">
              Donor Portal
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Welcome, {profile?.full_name || "Donor"}
            </h1>
            <p className="mt-2 text-zinc-300">
              Submit donation availability and track approval status in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
  <HomeButton href="/donor" label="Dashboard" />
  <Link
    href="/chat"
    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium"
  >
    Open Chat
  </Link>
  <SimpleLogout />
</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-sky-400/10 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold">Profile</h3>
            <div className="mt-5 space-y-3 text-sm text-zinc-200">
              <p><strong>Name:</strong> {profile?.full_name || "-"}</p>
              <p><strong>Email:</strong> {profile?.email || "-"}</p>
              <p><strong>Portal:</strong> Donor</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-emerald-400/10 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold">Approval Summary</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-zinc-300">Pending</p>
                <p className="mt-2 text-3xl font-semibold">{pendingCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-zinc-300">Approved</p>
                <p className="mt-2 text-3xl font-semibold">{approvedCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-zinc-300">Completed</p>
                <p className="mt-2 text-3xl font-semibold">{completedCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-rose-400/10 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold">Communication</h3>
            <div className="mt-5 space-y-3 text-sm text-zinc-200">
              <p>Use chat to coordinate after approval.</p>
              <Link
                href="/chat"
                className="inline-flex rounded-2xl bg-white px-4 py-3 font-medium text-zinc-950"
              >
                Go to Chat
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold">Donate Blood</h3>

            <form onSubmit={submitDonationIntent} className="mt-5 grid gap-4">
              <select
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white outline-none"
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
                type="date"
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white outline-none"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />

              <input
                type="number"
                min="1"
                placeholder="Units to Donate"
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white outline-none placeholder:text-zinc-400"
                value={unitsToDonate}
                onChange={(e) => setUnitsToDonate(e.target.value)}
              />

              <textarea
                placeholder="Notes (optional)"
                className="min-h-[120px] rounded-2xl border border-white/10 bg-black/20 p-3 text-white outline-none placeholder:text-zinc-400"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button className="rounded-2xl bg-white px-4 py-3 font-medium text-zinc-950">
                Submit Donation Intent
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold">My Donation Requests</h3>

            <div className="mt-5 grid gap-4">
              {donations.length > 0 ? (
                donations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                        {item.blood_group}
                      </span>
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
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">
                      Preferred Date: {item.preferred_date || "Not specified"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Units: {item.units_to_donate || 1}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {item.notes || "No notes added"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                  No donation intents submitted yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}