"use client";

import { useState } from "react";
import { CopyPlus } from "lucide-react";

export default function CopyStoryTripButton({
  token,
  propertyName,
  title,
  nights,
}: {
  token: string;
  propertyName: string;
  title: string;
  nights: number;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function copyTrip() {
    setBusy(true);
    setStatus("");
    try {
      const href =
        "/build-your-trip?source=tripelor-story&property=" +
        encodeURIComponent(propertyName) +
        "&nights=" +
        encodeURIComponent(String(nights));
      const response = await fetch("/api/account/saved-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "bundle",
          itemKey: "story:" + token,
          title: "Inspired by: " + (title || "Tripelor Story"),
          subtitle: propertyName + " · " + nights + " nights",
          href,
          metadata: { source: "tripelor-story", storyToken: token, propertyName, nights: String(nights) },
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = "/signup?next=" + encodeURIComponent(window.location.pathname);
        return;
      }
      if (!response.ok) throw new Error(result.error || "Unable to copy this trip.");
      setStatus("Copied to My Tripelor.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to copy this trip.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={copyTrip} disabled={busy} className="btn-gold w-full justify-center disabled:opacity-60">
        <CopyPlus className="h-4 w-4" /> {busy ? "Copying…" : "Copy this trip to My Tripelor"}
      </button>
      {status && <p className="mt-2 text-center text-xs">{status}</p>}
    </div>
  );
}
