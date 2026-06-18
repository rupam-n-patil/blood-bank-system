"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartPulse, Mail, LockKeyhole, UserRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("public");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const redirectByRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("User session not found.");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setMessage("Could not load user profile.");
      return;
    }

    if (!profile) {
      setMessage("Profile not found. Create a profile row for this user in Supabase.");
      return;
    }

    if (profile.role === "admin") router.push("/dashboard");
    else if (profile.role === "donor") router.push("/donor");
    else router.push("/public");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      await redirectByRole();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert([
          {
            id: data.user.id,
            email,
            full_name: fullName,
            role,
          },
        ]);

        if (profileError) {
          setMessage(profileError.message);
          return;
        }
      }

      setMessage("Account created. Now login.");
      setIsLogin(true);
      setFullName("");
      setRole("public");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2d1a20_0%,#18181b_28%,#0b0b0d_100%)] text-white">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/50 shadow-2xl backdrop-blur lg:grid-cols-2">
          <div className="hidden border-r border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex rounded-2xl bg-rose-300/10 p-3 ring-1 ring-rose-300/15">
                <HeartPulse className="h-7 w-7 text-rose-300" />
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight">
                Blood Bank
                <br />
                Multi-Role System
              </h1>
              <p className="mt-4 max-w-md text-zinc-400">
                Separate portals for admin, donor, and public users.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                Admin manages donors, stock, and requests
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                Donors can manage profile and communicate
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                Public users can request blood and chat
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex min-h-full max-w-md flex-col justify-center"
            >
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
                  Welcome
                </p>
                <h2 className="mt-3 text-3xl font-semibold">
                  {isLogin ? "Login to continue" : "Create your account"}
                </h2>
              </div>

              <div className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserRound className="h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          className="w-full bg-transparent outline-none placeholder:text-zinc-500"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <select
                      className="w-full rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white outline-none"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="public">Public / Recipient</option>
                      <option value="donor">Donor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </>
                )}

                <div className="rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full bg-transparent outline-none placeholder:text-zinc-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="h-4 w-4 text-zinc-500" />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full bg-transparent outline-none placeholder:text-zinc-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button className="w-full rounded-2xl bg-zinc-100 px-4 py-3 font-medium text-zinc-950 transition hover:bg-white">
                  {isLogin ? "Login" : "Create Account"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-200 transition hover:bg-white/10"
                >
                  {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
                </button>

                <Link href="/" className="text-center text-sm text-zinc-400 underline">
                  Back to Home
                </Link>

                {message && (
                  <p className="text-center text-sm text-rose-300">{message}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}