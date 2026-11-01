import type { Metadata } from "next";
import Link from "next/link";
import NalaBookingForm from "@/components/nala-booking-form";
import { nalaStay, nalaToday } from "@/lib/nala-veli";
import styles from "@/components/nala-booking-form.module.css";

export const metadata: Metadata = {
  title: "Nala Veli Ukulhas",
  description: "Choose a room at Nala Veli Villa or Nala Veli Beach & Spa on Ukulhas. Compare breakfast-inclusive prices and request your stay with Tripelor.",
};

export default function NalaVeliPage({ searchParams }: {
  searchParams?: { checkIn?: string; checkOut?: string };
}) {
  const today = nalaToday();
  const start = typeof searchParams?.checkIn === "string" ? searchParams.checkIn : "";
  const end = typeof searchParams?.checkOut === "string" ? searchParams.checkOut : "";
  const validSearch = start >= today && ["priced", "quote"].includes(nalaStay(start, end).status);

  return <div className={styles.page}>
    <header className={`container ${styles.intro}`}>
      <Link href="/stays" className={styles.back}>← All stays</Link>
      <p className="eyebrow">Ukulhas · North Ari Atoll</p>
      <h1>Nala Veli Maldives</h1>
      <p className={styles.lead}>Two island stays. One easy way to choose your room.</p>
      <p className={styles.muted}>Explore Nala Veli Villa and Nala Veli Beach &amp; Spa, with breakfast included and a local Tripelor team to arrange your stay.</p>
    </header>
    <NalaBookingForm today={today} initialStart={validSearch ? start : ""} initialEnd={validSearch ? end : ""}/>
    <section className={`container ${styles.information}`} aria-labelledby="nala-information">
      <h2 id="nala-information">Good to know</h2>
      <div className={styles.informationGrid}>
        <div><h3>Breakfast &amp; taxes included</h3><p>Prices are in USD per room per night for the occupancy selected. Extra beds, additional meals and the mandatory 31 December supplement are extra.</p></div>
        <div><h3>Your island transfer</h3><p>Scheduled speedboat: USD 50 per adult each way, USD 25 per child aged 3–10; infants travel free. Transfers are separate from accommodation.</p></div>
        <div><h3>Booking &amp; cancellation</h3><p>Tripelor confirms availability and final terms with Nala Veli before payment. Standard cancellation: 31+ days free; 15–30 days 25%; 8–14 days 50%; 0–7 days 100%. Peak dates have different conditions.</p></div>
      </div>
    </section>
  </div>;
}
