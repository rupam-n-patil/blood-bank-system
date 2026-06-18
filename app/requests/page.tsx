"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import useRoleGuard from "@/components/useRoleGuard";
import AppShell from "@/components/AppShell";
import {
  ClipboardPlus,
  Search,
  Building2,
  UserRound,
  Droplets,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Request = {
  id: number;
  patient_name: string;
  hospital_name: string;
  blood_group: string;
  units_required: number;
  status: string;
  requested_at: string;
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RequestsPage() {
  const loading = useRoleGuard("admin");

  const [patientName, setPatientName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [unitsRequired, setUnitsRequired] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [search, setSearch] = useState("");

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) setRequests(data);
  };

  useEffect(() => {
    if (loading) return;

    fetchRequests();

    const interval = setInterval(() => {
      fetchRequests();
    }, 4000);

    return () => clearInterval(interval);
  }, [loading]);

  const filteredRequests = requests.filter((req) => {
    const q = search.toLowerCase();
    return (
      req.patient_name?.toLowerCase().includes(q) ||
      req.hospital_name?.toLowerCase().includes(q) ||
      req.blood_group?.toLowerCase().includes(q) ||
      req.status?.toLowerCase().includes(q)
    );
  });

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "Pending").length,
    [requests]
  );
  const approvedCount = useMemo(
    () => requests.filter((r) => r.status === "Approved").length,
    [requests]
  );
  const completedCount = useMemo(
    () => requests.filter((r) => r.status === "Completed").length,
    [requests]
  );

  if (loading) return null;

  const addRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("requests").insert([
      {
        patient_name: patientName,
        hospital_name: hospitalName,
        blood_group: bloodGroup,
        units_required: Number(unitsRequired),
        status: "Pending",
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

    fetchRequests();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from("requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchRequests();
  };

  return (
    <AppShell
      title="Request Management"
      subtitle="Track patient and hospital blood requests."
    >
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-rose-300/10 p-3">
                <ClipboardPlus className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Create New Request</h3>
                <p className="text-sm text-zinc-400">
                  Add a new patient or hospital blood request
                </p>
              </div>
            </div>

            <form onSubmit={addRequest} className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none placeholder:text-zinc-500"
                placeholder="Patient Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />

              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none placeholder:text-zinc-500"
                placeholder="Hospital Name"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />

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
                placeholder="Units Required"
                type="number"
                min="1"
                value={unitsRequired}
                onChange={(e) => setUnitsRequired(e.target.value)}
                required
              />

              <button className="md:col-span-2 rounded-2xl bg-zinc-100 px-4 py-3 font-medium text-zinc-950 transition hover:bg-white">
                Add Request
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
            <h3 className="text-xl font-semibold">Request Summary</h3>
            <p className="mt-1 text-sm text-zinc-400">Current request flow status</p>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <p className="text-sm text-zinc-400">Pending</p>
                <p className="mt-2 text-3xl font-semibold">{pendingCount}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <p className="text-sm text-zinc-400">Approved</p>
                <p className="mt-2 text-3xl font-semibold">{approvedCount}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <p className="text-sm text-zinc-400">Completed</p>
                <p className="mt-2 text-3xl font-semibold">{completedCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Request Records</h3>
              <p className="text-sm text-zinc-400">
                Review and update request status
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 py-3 pl-10 pr-4 text-white outline-none placeholder:text-zinc-500"
                placeholder="Search by patient, hospital, group, status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {req.patient_name}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-rose-300/15 bg-rose-300/10 px-3 py-1 text-sm text-rose-100">
                          <Droplets className="mr-2 h-4 w-4" />
                          {req.blood_group}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-300">
                          {req.units_required} units
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
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

                  <div className="mt-5 space-y-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-3">
                      <UserRound className="h-4 w-4 text-zinc-400" />
                      <span>Patient: {req.patient_name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-zinc-400" />
                      <span>{req.hospital_name || "No hospital provided"}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {req.status !== "Pending" && (
                      <button
                        onClick={() => updateStatus(req.id, "Pending")}
                        className="rounded-full bg-amber-300/10 px-3 py-2 text-xs text-amber-200"
                      >
                        Mark Pending
                      </button>
                    )}

                    {req.status !== "Approved" && (
                      <button
                        onClick={() => updateStatus(req.id, "Approved")}
                        className="rounded-full bg-sky-300/10 px-3 py-2 text-xs text-sky-200"
                      >
                        Mark Approved
                      </button>
                    )}

                    {req.status !== "Completed" && (
                      <button
                        onClick={() => updateStatus(req.id, "Completed")}
                        className="inline-flex items-center rounded-full bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Mark Completed
                      </button>
                    )}

                    {req.status !== "Rejected" && (
                      <button
                        onClick={() => updateStatus(req.id, "Rejected")}
                        className="inline-flex items-center rounded-full bg-rose-300/10 px-3 py-2 text-xs text-rose-200"
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 text-sm text-zinc-400 lg:col-span-2">
                No request records found.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}