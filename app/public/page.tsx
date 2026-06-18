"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useRoleGuard from "@/components/useRoleGuard";
import SimpleLogout from "@/components/SimpleLogout";
import HomeButton from "@/components/HomeButton";
import Link from "next/link";
import {
  ClipboardPlus,
  HeartPulse,
  MessageCircleMore,
  UserRound,
  SearchCheck,
  ShieldPlus,
  Syringe,
} from "lucide-react";

type RequestRow = {
  id: number;
  patient_name: string;
  hospital_name: string;
  blood_group: string;
  units_required: number;
  status: string;
  created_by_email: string;
};

type DonationIntent = {
  id: number;
  donor_id: string;
  donor_email: string;
  donor_name: string;
  blood_group: string;
  preferred_date: string;
  units_to_donate: number;
  status: string;
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PublicDashboardPage() {
  const loading = useRoleGuard("public");

  const [profile, setProfile] = useState<any>(null);
  const [patientName, setPatientName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [unitsRequired, setUnitsRequired] = useState("");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [approvedDonors, setApprovedDonors] = useState<DonationIntent[]>([]);

  useEffect(() => {
    if (loading) return;

    const loadData = async () => {
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

      const { data: requestData } = await supabase
        .from("requests")
        .select("*")
        .eq("created_by_email", user.email)
        .order("id", { ascending: false });

      setRequests(requestData || []);

      const { data: donorData } = await supabase
        .from("donation_intents")
        .select("*")
        .eq("status", "Approved")
        .order("id", { ascending: false });

      setApprovedDonors(donorData || []);
    };

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) return null;

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (profile?.role !== "public") {
      alert("Only recipient/hospital accounts can submit blood requests.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const nameToUse = patientName || profile?.full_name || "Recipient";

    const { error } = await supabase.from("requests").insert([
      {
        patient_name: nameToUse,
        hospital_name: hospitalName,
        blood_group: bloodGroup,
        units_required: Number(unitsRequired),
        status: "Pending",
        created_by_email: user.email,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setPatientName("");
    setHospitalName("");
    setBloodGroup("A+");
    setUnitsRequired("");
  };

  const startChatWithDonor = async (donor: DonationIntent) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !profile) return;

    const { data: existing } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("donation_intent_id", donor.id)
      .eq("recipient_email", user.email)
      .maybeSingle();

    if (existing) {
      window.location.href = `/chat?thread=${existing.id}`;
      return;
    }

    const { data, error } = await supabase
      .from("chat_threads")
      .insert([
        {
          donation_intent_id: donor.id,
          donor_id: donor.donor_id,
          donor_email: donor.donor_email,
          donor_name: donor.donor_name,
          recipient_id: user.id,
          recipient_email: user.email,
          recipient_name: profile.full_name,
          status: "Open",
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = `/chat?thread=${data.id}`;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2d2016_0%,#19130e_30%,#0b0908_100%)] text-white">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300/70">
              Recipient / Hospital Portal
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Welcome, {profile?.full_name || "User"}
            </h1>
            <p className="mt-2 text-zinc-300">
              Request blood, review available donors, and coordinate through chat.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
  <HomeButton href="/public" label="Dashboard" />
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
          <div className="rounded-[2rem] border border-white/10 bg-amber-400/10 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-amber-200" />
              <h3 className="text-xl font-semibold">Profile</h3>
            </div>
            <div className="mt-5 space-y-3 text-sm text-zinc-200">
              <p><strong>Name:</strong> {profile?.full_name || "-"}</p>
              <p><strong>Email:</strong> {profile?.email || "-"}</p>
              <p><strong>Portal:</strong> Recipient / Hospital</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-rose-400/10 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <ClipboardPlus className="h-5 w-5 text-rose-200" />
              <h3 className="text-xl font-semibold">Blood Request</h3>
            </div>
            <p className="mt-5 text-sm text-zinc-200">
              Submit a request and track status below.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-sky-400/10 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <MessageCircleMore className="h-5 w-5 text-sky-200" />
              <h3 className="text-xl font-semibold">Communication</h3>
            </div>
            <p className="mt-5 text-sm text-zinc-200">
              Start donor-specific chat from approved donor entries.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <SearchCheck className="h-5 w-5 text-emerald-200" />
              <h3 className="text-xl font-semibold">Create Blood Request</h3>
            </div>

            <form onSubmit={submitRequest} className="mt-5 grid gap-4">
              <input
                placeholder="Patient Name"
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white outline-none placeholder:text-zinc-400"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />

              <input
                placeholder="Hospital Name"
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white outline-none placeholder:text-zinc-400"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />

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
                type="number"
                min="1"
                placeholder="Units Required"
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white outline-none placeholder:text-zinc-400"
                value={unitsRequired}
                onChange={(e) => setUnitsRequired(e.target.value)}
              />

              <button className="rounded-2xl bg-white px-4 py-3 font-medium text-zinc-950">
                Submit Request
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-5 w-5 text-rose-200" />
              <h3 className="text-xl font-semibold">My Requests</h3>
            </div>

            <div className="mt-5 grid gap-4">
              {requests.length > 0 ? (
                requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                        {req.blood_group}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          req.status === "Approved"
                            ? "bg-sky-300/10 text-sky-200"
                            : req.status === "Completed"
                            ? "bg-emerald-300/10 text-emerald-200"
                            : req.status === "Rejected"
                            ? "bg-rose-300/10 text-rose-200"
                            : "bg-amber-300/10 text-amber-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">
                      Patient: {req.patient_name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {req.hospital_name || "No hospital specified"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Units: {req.units_required}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                  No requests submitted yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="mb-4 flex items-center gap-3">
            <Syringe className="h-5 w-5 text-sky-200" />
            <h3 className="text-xl font-semibold">Approved Donors Available for Contact</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {approvedDonors.length > 0 ? (
              approvedDonors.map((donor) => (
                <div
                  key={donor.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                      {donor.blood_group}
                    </span>
                    <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                      Approved
                    </span>
                  </div>

                  <p className="mt-3 text-base font-medium text-zinc-100">
                    {donor.donor_name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Preferred Date: {donor.preferred_date || "Not specified"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Units: {donor.units_to_donate}
                  </p>

                  <button
                    onClick={() => startChatWithDonor(donor)}
                    className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-950"
                  >
                    Chat with Donor
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400 md:col-span-2">
                No approved donors available yet.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <ShieldPlus className="h-5 w-5 text-rose-200" />
            <h3 className="text-xl font-semibold">Support Overview</h3>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              Request creation, tracking, and donor coordination are enabled.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              Donor communication is tied to approved donor submissions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}