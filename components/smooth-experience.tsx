"use client";

import Link from "next/link";
import { BedDouble, CalendarCheck, Compass, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const mobileActions = [
  { href: "/stays", label: "Stays", icon: BedDouble },
  { href: "/island-adventures", label: "Packages", icon: Compass },
  { href: "/booking", label: "Book", icon: CalendarCheck },
];

export default function SmoothExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showPlanButton, setShowPlanButton] = useState(false);

  useEffect(() => {
    const update = () => setShowPlanButton(window.scrollY > 560);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".route-transition > section, .route-transition [data-smooth-reveal]",
      ),
    );

    elements.forEach((element) => element.classList.add("smooth-reveal"));

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -9% 0px", threshold: 0.08 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <>
      <div key={pathname} className="route-transition">
        {children}
      </div>

      <Link
        href="/build-your-trip"
        className={`floating-plan hidden md:flex ${showPlanButton ? "is-visible" : ""}`}
        aria-hidden={!showPlanButton}
        tabIndex={showPlanButton ? 0 : -1}
      >
        <span className="flex h-10 w-10 items-center justify-center bg-[#c9a86a] text-[#071922]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="pr-5">
          <span className="block text-[9px] uppercase tracking-[.2em] text-white/40">
            Your Maldives
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-white">Plan My Trip</span>
        </span>
      </Link>

      <nav className="mobile-booking-bar md:hidden" aria-label="Quick booking navigation">
        {mobileActions.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/booking" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={`mobile-booking-action ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
