"use client";

import { useRouter } from "next/navigation";

export default function PortalSwitch({
  currentRole,
}: {
  currentRole: "donor" | "public";
}) {
  const router = useRouter();

  const switchPortal = () => {
    router.push(currentRole === "donor" ? "/public" : "/donor");
  };

  return (
    <button
      onClick={switchPortal}
      className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-100"
    >
      Switch to {currentRole === "donor" ? "Public" : "Donor"} Portal
    </button>
  );
}