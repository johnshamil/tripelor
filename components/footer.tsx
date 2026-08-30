import Link from "next/link";
import { ArrowUpRight, Compass, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#041117]">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_.7fr_.8fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border border-[#c9a86a]/55 text-[#d9bd7b]">
                <Compass className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl tracking-[.09em] text-white">TRIPELOR</span>
            </Link>
            <p className="mt-6 text-sm leading-7 text-white/45">
              Maldives island stays, ocean experiences and transfers—thoughtfully
              arranged into one seamless journey.
            </p>
            <p className="mt-7 text-[10px] uppercase tracking-[.28em] text-[#c9a86a]">
              The art of exploring
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[.2em] text-white">Explore</h2>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
              <Link href="/stays" className="transition hover:text-[#d9bd7b]">Our Stays</Link>
              <Link href="/island-adventures" className="transition hover:text-[#d9bd7b]">Island Packages</Link>
              <Link href="/experience-bundles" className="transition hover:text-[#d9bd7b]">Experiences</Link>
              <Link href="/speedboat" className="transition hover:text-[#d9bd7b]">Transfers</Link>
              <Link href="/reviews" className="transition hover:text-[#d9bd7b]">Guest Reviews</Link>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[.2em] text-white">Information</h2>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
              <Link href="/about" className="transition hover:text-[#d9bd7b]">About Tripelor</Link>
              <Link href="/travel-info#faq" className="transition hover:text-[#d9bd7b]">Frequently Asked Questions</Link>
              <Link href="/travel-info#terms" className="transition hover:text-[#d9bd7b]">Terms & Conditions</Link>
              <Link href="/travel-info#cancellation" className="transition hover:text-[#d9bd7b]">Cancellation Policy</Link>
              <Link href="/travel-info#privacy" className="transition hover:text-[#d9bd7b]">Privacy Policy</Link>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[.2em] text-white">Contact</h2>
            <div className="mt-5 space-y-4 text-sm text-white/45">
              <a href="mailto:bookings@tripelor.com" className="flex items-center gap-3 transition hover:text-[#d9bd7b]">
                <Mail className="h-4 w-4 text-[#c9a86a]" /> bookings@tripelor.com
              </a>
              <a href="tel:+9609429403" className="flex items-center gap-3 transition hover:text-[#d9bd7b]">
                <Phone className="h-4 w-4 text-[#c9a86a]" /> +960 942 9403
              </a>
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#c9a86a]" /> Maldives
              </p>
            </div>
            <Link href="/contact" className="luxury-link mt-7">
              Send an Enquiry <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tripelor. All rights reserved.</p>
          <p>Maldives Travel & Holiday Services</p>
        </div>
      </div>
    </footer>
  );
}
