"use client";

import Link from "next/link";

export default function HomeButton({
  href,
  label = "Home",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15"
    >
      {label}
    </Link>
  );
}