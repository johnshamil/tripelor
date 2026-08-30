import LuxuryPropertyPage from "@/components/luxury-property-page";

const photos = [
  "/images%20(3).jpeg",
  "/images.jpeg",
  "/images%20(1).jpeg",
  "/images%20(2).jpeg",
  "/8afbb6cc.jpeg",
  "/images%20(4).jpeg",
  "/images%20(5).jpeg",
  "/images%20(6).jpeg",
  "/images%20(7).jpeg",
  "/images%20(8).jpeg",
];

const schema = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Masfalhi View Inn",
  url: "https://tripelor.com/stays/masfalhi-view-inn",
  image: photos.map((photo) => `https://tripelor.com${photo}`),
  description: "Maldives local island guesthouse with Bed & Breakfast, Half Board and Full Board room rates.",
  address: { "@type": "PostalAddress", addressCountry: "MV" },
  priceRange: "USD 97-130 per room per night",
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <LuxuryPropertyPage
        eyebrow="Relaxed island guesthouse"
        name="Masfalhi View Inn"
        location="Maldives"
        description="A comfortable six-room local-island guesthouse with flexible meal plans and a relaxed setting for an authentic Maldives stay."
        photos={photos}
        startingFrom={97}
        bookingHref="/booking?property=Masfalhi%20View%20Inn&mealPlan=Bed%20%26%20Breakfast"
        highlights={[
          { icon: "island", title: "Island atmosphere", text: "A slower, more personal way to experience everyday life in the Maldives." },
          { icon: "dining", title: "Flexible dining", text: "Choose Bed & Breakfast, Half Board or Full Board for your stay." },
          { icon: "support", title: "Tripelor assistance", text: "Clear booking support from your first enquiry to arrival." },
        ]}
        rates={[
          { name: "Bed & Breakfast", price: 97, detail: "Comfortable room with daily breakfast.", bookingHref: "/booking?property=Masfalhi%20View%20Inn&mealPlan=Bed%20%26%20Breakfast" },
          { name: "Half Board", price: 110, detail: "Room with breakfast and dinner included.", bookingHref: "/booking?property=Masfalhi%20View%20Inn&mealPlan=Half%20Board" },
          { name: "Full Board", price: 130, detail: "Room with breakfast, lunch and dinner.", bookingHref: "/booking?property=Masfalhi%20View%20Inn&mealPlan=Full%20Board" },
        ]}
        terms={[
          { title: "Six-room availability", text: "Tripelor checks the current room pool for your dates before a reservation is confirmed." },
          { title: "A clear booking journey", text: "Select your dates and meal plan online, then receive personal confirmation and payment guidance from Tripelor." },
        ]}
      />
    </>
  );
}
