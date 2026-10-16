"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Heart, LogOut, Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import CartLink from "@/components/cart-link";
import TripelorWordmark from "@/components/tripelor-wordmark";
import LanguageSwitcher from "@/components/language-switcher";
import { useSiteLanguage } from "@/components/use-site-language";
import { translations } from "@/lib/professional-translations";
import { coastalCopy } from "@/lib/coastal-copy";

type User = { email: string; fullName: string; isAdmin?: boolean };
const primaryRoutes = [["/stays", "stays"], ["/island-adventures", "packages"], ["/excursions", "sharedExcursions"], ["/experience-bundles", "experiences"], ["/speedboat", "transfers"]] as const;

export default function Navbar() {
  const pathname = usePathname();
  const locale = useSiteLanguage();
  const copy = translations[locale].nav;
  const brand = coastalCopy[locale];
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const attachMenu = useCallback((node: HTMLDivElement | null) => {
    menuRef.current = node;
    if (node) node.inert = !open;
  }, [open]);
  const primaryLinks = primaryRoutes.map(([href, key]) => [href, copy[key]] as const);
  const menuLinks = [["/", copy.home], ...primaryLinks, ["/maldives-matchmaker", copy.helpMeChoose], ["/secret-deals", brand.secretCta], ["/island-story", translations[locale].home.islandStoryCta], ["/couple-match", translations[locale].home.coupleCta], ["/wishlist", translations[locale].home.wishlistCta], ["/holiday-shortlist", copy.holidayShortlist], ["/my-trip", copy.myTripPlan], ["/account#referral-rewards", copy.referralEarn], ["/reviews", copy.reviews], ["/contact", copy.contact]];

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { cache: "no-store", signal: controller.signal }).then(response => response.json()).then(data => { if (!controller.signal.aborted) setUser(data.user || null); }).catch(() => { if (!controller.signal.aborted) setUser(null); });
    return () => controller.abort();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true });
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const controls = menuRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),select");
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keyboard); previousFocus?.focus({ preventScroll: true }); };
  }, [open]);

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }

  return <header className="brand-header" data-menu-open={open || undefined}>
    <div className="brand-announcement"><div className="container"><span>{brand.announcement}</span><Link href="/maldives-matchmaker">{brand.local}<ArrowUpRight aria-hidden="true" /></Link></div></div>
    <div className="container brand-navigation">
      <Link href="/" onClick={() => setOpen(false)} aria-label="Tripelor home"><TripelorWordmark /></Link>
      <nav className="brand-main-links" aria-label="Main navigation">{primaryLinks.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>
      <div className="brand-nav-actions">
        <div className="brand-language"><LanguageSwitcher compact /></div>
        <div className="brand-plan"><CartLink compact /></div>
        <Link href="/account/saved" className="brand-saved" aria-label={brand.saved} onClick={() => setOpen(false)}><Heart aria-hidden="true" /></Link>
        <Link href={user ? "/account" : "/login"} className="brand-signin" onClick={() => setOpen(false)}>{user ? copy.myAccount : copy.signIn}<ArrowUpRight aria-hidden="true" /></Link>
        <button type="button" className="brand-menu-toggle" onClick={() => setOpen(current => !current)} aria-label={open ? "Close navigation menu" : "Open menu"} aria-expanded={open} aria-controls="tripelor-menu">{open ? <X /> : <Menu />}</button>
      </div>
    </div>
    <div id="tripelor-menu" className="brand-menu" data-open={open} role="dialog" aria-modal={open || undefined} aria-hidden={!open} aria-label={brand.menu} ref={attachMenu}>
      <div className="container brand-menu-inner">
        <div className="brand-menu-heading"><p>{brand.menu}</p><button type="button" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button></div>
        {user?.isAdmin && <nav className="brand-admin-links" aria-label="Admin navigation">{[["/admin", copy.adminHome], ["/admin/manual-bookings", "Manual Booking"], ["/admin/properties", copy.properties], ["/admin/quotations", "Quotations"]].map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight /></Link>)}</nav>}
        <nav className="brand-menu-links" aria-label="More navigation">{menuLinks.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight aria-hidden="true" /></Link>)}</nav>
        <div className="brand-menu-bottom"><LanguageSwitcher fullWidth /><CartLink onClick={() => setOpen(false)} />{user && <button type="button" onClick={logout}><LogOut />{copy.logOut}</button>}<Link href="/build-your-trip" onClick={() => setOpen(false)} className="coastal-button">{copy.planTrip}<ArrowUpRight /></Link></div>
      </div>
    </div>
  </header>;
}
