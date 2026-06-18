"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useRoleGuard from "@/components/useRoleGuard";
import AppShell from "@/components/AppShell";
import {
  UserPlus,
  Phone,
  MapPin,
  CalendarDays,
  Droplets,
  BadgeCheck,
  Search,
  Users,
  HeartPulse,
} from "lucide-react";

type Donor = {
  id: number;
  full_name: string;
  blood_group: string;
  age: number;
  phone: string;
  address: string;
  last_donation_date: string;
  eligible: boolean;
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorsPage() {
  const loading = useRoleGuard("admin");

  const [fullName, setFullName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lastDonationDate, setLastDonationDate] = useState("");
  const [eligible, setEligible] = useState(true);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState("");

  const fetchDonors = async () => {
    const { data, error } = await supabase
      .from("donors")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) setDonors(data);
  };

  useEffect(() => {
    if (loading) return;
    fetchDonors();
  }, [loading]);

  if (loading) return null;

  const addDonor = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("donors").insert([
      {
        full_name: fullName,
        blood_group: bloodGroup,
        age: Number(age),
        phone,
        address,
        last_donation_date: lastDonationDate || null,
        eligible,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setFullName("");
    setBloodGroup("A+");
    setAge("");
    setPhone("");
    setAddress("");
    setLastDonationDate("");
    setEligible(true);

    fetchDonors();
  };

  const filteredDonors = donors.filter((donor) => {
    const q = search.toLowerCase();
    return (
      donor.full_name?.toLowerCase().includes(q) ||
      donor.blood_group?.toLowerCase().includes(q) ||
      donor.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell
      title="Donor Management"
      subtitle="Register, search, and review donor records."
    >
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-rose-300/10 p-3">
                <UserPlus className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Register New Donor</h3>
                <p className="text-sm text-zinc-400">
                  Add donor identity and eligibility details
                </p>
              </div>
            </div>

            <form onSubmit={addDonor} className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none placeholder:text-zinc-500"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
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
                placeholder="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />

              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none placeholder:text-zinc-500"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none placeholder:text-zinc-500 md:col-span-2"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-white outline-none md:col-span-2"
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
              />

              <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={eligible}
                  onChange={(e) => setEligible(e.target.checked)}
                  className="h-4 w-4 accent-rose-300"
                />
                Mark donor as eligible
              </label>

              <button className="md:col-span-2 rounded-2xl bg-zinc-100 px-4 py-3 font-medium text-zinc-950 transition hover:bg-white">
                Add Donor
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
            <h3 className="text-xl font-semibold">Donor Summary</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Current donor pool information
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Users className="h-4 w-4 text-sky-300" />
                  Total Donors
                </div>
                <p className="mt-3 text-3xl font-semibold">{donors.length}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <HeartPulse className="h-4 w-4 text-emerald-300" />
                  Eligible Donors
                </div>
                <p className="mt-3 text-3xl font-semibold">
                  {donors.filter((d) => d.eligible).length}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-400">Registered Blood Groups</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...new Set(donors.map((d) => d.blood_group))].length > 0 ? (
                  [...new Set(donors.map((d) => d.blood_group))].map((group) => (
                    <span
                      key={group}
                      className="rounded-full border border-rose-300/15 bg-rose-300/10 px-3 py-1 text-sm text-rose-100"
                    >
                      {group}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">No donor groups yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Donor Records</h3>
              <p className="text-sm text-zinc-400">
                Search and review all registered donors
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 py-3 pl-10 pr-4 text-white outline-none placeholder:text-zinc-500"
                placeholder="Search donor by name, group, or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredDonors.length > 0 ? (
              filteredDonors.map((donor) => (
                <div
                  key={donor.id}
                  className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {donor.full_name}
                      </h4>
                      <div className="mt-2 inline-flex rounded-full border border-rose-300/15 bg-rose-300/10 px-3 py-1 text-sm font-medium text-rose-100">
                        <Droplets className="mr-2 h-4 w-4" />
                        {donor.blood_group}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        donor.eligible
                          ? "bg-emerald-300/10 text-emerald-200"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {donor.eligible ? "Eligible" : "Not Eligible"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-3">
                      <BadgeCheck className="h-4 w-4 text-zinc-400" />
                      <span>Age: {donor.age}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <span>{donor.phone || "No phone provided"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-zinc-400" />
                      <span>{donor.address || "No address provided"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-zinc-400" />
                      <span>
                        Last Donation:{" "}
                        {donor.last_donation_date || "No donation date recorded"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 text-sm text-zinc-400 lg:col-span-2">
                No donor records found.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}