import Link from "next/link";
import { HeartPulse } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1b0d12_0%,#101217_40%,#090b10_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl bg-rose-500/15 p-4 ring-1 ring-rose-400/20">
          <HeartPulse className="h-10 w-10 text-rose-300" />
        </div>

        <h1 className="mt-6 text-4xl font-semibold md:text-5xl">
          Blood Bank Management System
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
          A web-based system for managing donor submissions, recipient requests,
          blood inventory, approvals, and communication.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex rounded-2xl bg-white px-6 py-3 font-medium text-zinc-950 transition hover:bg-zinc-100"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}