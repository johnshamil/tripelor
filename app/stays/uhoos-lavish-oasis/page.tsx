import LuxuryPropertyPage from "@/components/luxury-property-page";

const photos = [
  "/properties/uhoos-lavish-oasis/20250517_193323.jpg",
  "/properties/uhoos-lavish-oasis/20250518_001256.jpg",
  "/properties/uhoos-lavish-oasis/20250518_001936.jpg",
  "/properties/uhoos-lavish-oasis/20250822_104240.jpg",
  "/properties/uhoos-lavish-oasis/20250822_104258(1).jpg",
];

const schema = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Uhoo's Lavish Oasis",
  url: "https://tripelor.com/stays/uhoos-lavish-oasis",
  image: photos.map((photo) => `https://tripelor.com${photo}`),
  description: "Comfortable local island guesthouse accommodation in V. Felidhoo, Maldives with Bed & Breakfast, Half Board and Full Board meal plans.",
  address: { "@type": "PostalAddress", addressLocality: "Felidhoo", addressRegion: "Vaavu Atoll", addressCountry: "MV" },
  priceRange: "USD 85-115 per room per night",
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <LuxuryPropertyPage
        eyebrow="Featured local-island stay"
        name="Uhoo's Lavish Oasis"
        location="V. Felidhoo, Maldives"
        description="An intimate two-room island stay in Vaavu Atoll, with flexible meal plans, ocean experiences and personal Tripelor support."
        photos={photos}
        startingFrom={85}
        bookingHref="/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast"
        highlights={[
          { icon: "shield", title: "Clear from the start", text: "Transparent room rates and confirmation details before payment." },
          { icon: "support", title: "Personal local support", text: "Tripelor assistance before, during and after your Felidhoo stay." },
          { icon: "transfer", title: "Arrival arranged", text: "Speedboat transfer support when requested at least 24 hours before arrival." },
        ]}
        rooms={[
          {
            name: "Room 101",
            image: photos[1],
            description: "A comfortable private room for two, ready for an unhurried Felidhoo escape.",
            details: ["Up to 2 guests", "BB, HB or FB", "Live availability", "Private room gallery"],
            href: "/stays/uhoos-lavish-oasis/room-101",
            bookingHref: "/booking?property=Uhoo%27s%20Lavish%20Oasis&roomType=ROOM%20101&mealPlan=Bed%20%26%20Breakfast",
          },
          {
            name: "Room 102",
            image: photos[2],
            description: "A relaxed private room with the same personal service and flexible dining choices.",
            details: ["Up to 2 guests", "BB, HB or FB", "Live availability", "Private room gallery"],
            href: "/stays/uhoos-lavish-oasis/room-102",
            bookingHref: "/booking?property=Uhoo%27s%20Lavish%20Oasis&roomType=ROOM%20102&mealPlan=Bed%20%26%20Breakfast",
          },
        ]}
        rates={[
          { name: "Bed & Breakfast", price: 85, detail: "Private room with daily breakfast.", bookingHref: "/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast" },
          { name: "Half Board", price: 95, detail: "Private room with breakfast and dinner.", bookingHref: "/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Half%20Board" },
          { name: "Full Board", price: 115, detail: "Private room with breakfast, lunch and dinner.", bookingHref: "/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Full%20Board" },
        ]}
        terms={[
          { title: "Island arrival", text: "Tripelor can assist with scheduled speedboat arrangements between Malé and Felidhoo. Requests should be made at least 24 hours before arrival." },
          { title: "Booking confirmation", text: "Your online request does not take an automatic payment. Tripelor reviews availability and sends confirmation with payment instructions." },
        ]}
        videos={[
          "/uhoos/WhatsApp%20Video%202026-08-17%20at%2015.30.20.mp4",
          "/uhoos/WhatsApp%20Video%202026-08-17%20at%2015.30.22.mp4",
        ]}
      />
    </>
  );
}
