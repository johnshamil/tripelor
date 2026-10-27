"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function DemoBanner() {
  const [next, setNext] = useState("/");
  const pathname = usePathname();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const target = window.location.pathname === "/login" ? query.get("next") : window.location.pathname + window.location.search;
    if (target && target.startsWith("/") && !target.startsWith("//") && !target.includes("\\")) setNext(target);
    const stopExternal = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (link && new URL(link.href, location.href).origin !== location.origin) {
        event.preventDefault(); event.stopImmediatePropagation();
        window.alert("External contact links are disabled in this sample-data preview.");
      }
    };
    document.addEventListener("click", stopExternal, true);
    return () => document.removeEventListener("click", stopExternal, true);
  }, [pathname]);
  return <aside aria-label="Sample-data preview" className="demo-banner">
    <div><strong>TRIPELOR · SAMPLE-DATA PREVIEW</strong>
      <p>Not Tripelor.com. Rates & availability are examples. No real bookings, payments, email or uploads. Use fictional details only.</p>
      <p>Admin changes are temporary, shared demo memory and may reset between requests or deployments.</p></div>
    <div className="demo-actions">
      <form action="/api/demo/session" method="post"><input type="hidden" name="role" value="member"/><input type="hidden" name="next" value={next === "/login" ? "/booking" : next}/><button>Enter member demo</button></form>
      <form action="/api/demo/session" method="post"><input type="hidden" name="role" value="admin"/><input type="hidden" name="next" value="/admin/properties"/><button>Open admin demo</button></form>
      <form action="/api/demo/session" method="post"><input type="hidden" name="role" value="signout"/><input type="hidden" name="next" value="/"/><button>Sign out demo</button></form>
    </div>
  </aside>;
}