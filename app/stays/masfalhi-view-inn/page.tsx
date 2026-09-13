import ManagedStayPage from "../[slug]/page";
import { findProperty } from "@/lib/property-store";
export const dynamic = "force-dynamic";
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
  description: "Maldives local island guesthouse offering Standard Double Rooms and a Family Room with Sea View in V. Felidhoo.",
  address: { "@type": "PostalAddress", addressLocality: "Felidhoo", addressRegion: "Vaavu Atoll", addressCountry: "MV" },
  priceRange: "USD 97-130 per room per night",
};

export default async function Page() {
  if (await findProperty("masfalhi-view-inn")) return <ManagedStayPage params={Promise.resolve({ slug: "masfalhi-view-inn" })} />;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <LuxuryPropertyPage
        eyebrow="Relaxed island guesthouse"
        name="Masfalhi View Inn"
        location="V. Felidhoo, Maldives"
        description="Choose the room style that suits your stay: a comfortable Standard Double Room for two or a spacious Family Room with Sea View for larger groups."
        photos={photos}
        startingFrom={97}
        bookingHref="/booking?property=Masfalhi%20View%20Inn&roomType=Standard%20Double%20Room&mealPlan=Bed%20%26%20Breakfast"
        rooms={[
          {
            name: "Standard Double Room",
            image: "/images.jpeg",
            description: "A comfortable air-conditioned room for two with one twin bed, one full bed and a private bathroom.",
            details: [
              "Sleeps up to 2 guests",
              "1 twin bed + 1 full bed",
              "Private bathroom",
              "Air conditioning",
              "Free Wi-Fi",
              "Flexible meal plans",
            ],
            bookingHref: "/booking?property=Masfalhi%20View%20Inn&roomType=Standard%20Double%20Room&mealPlan=Bed%20%26%20Breakfast",
          },
          {
            name: "Family Room with Sea View",
            image: "/images%20(3).jpeg",
            description: "A spacious sea-view family room with flexible bedding for families and groups of up to five guests.",
            details: [
              "Sleeps up to 5 guests",
              "3 twin beds + 1 queen bed",
              "Sea view",
              "Private bathroom",
              "Air conditioning",
              "Free Wi-Fi",
            ],
            bookingHref: "/booking?property=Masfalhi%20View%20Inn&roomType=Family%20Room%20with%20Sea%20View&mealPlan=Bed%20%26%20Breakfast",
          },
        ]}
        highlights={[
          { icon: "island", title: "Island atmosphere", text: "Stay in the heart of Felidhoo with an easy, personal local-island experience." },
          { icon: "dining", title: "Flexible dining", text: "Choose Bed & Breakfast, Half Board or Full Board for your stay." },
          { icon: "support", title: "Tripelor assistance", text: "Clear booking support from your first enquiry to arrival." },
        ]}
        rates={[
          { name: "Bed & Breakfast", price: 97, detail: "Comfortable room with daily breakfast.", bookingHref: "/booking?property=Masfalhi%20View%20Inn&roomType=Standard%20Double%20Room&mealPlan=Bed%20%26%20Breakfast" },
          { name: "Half Board", price: 110, detail: "Room with breakfast and dinner included.", bookingHref: "/booking?property=Masfalhi%20View%20Inn&roomType=Standard%20Double%20Room&mealPlan=Half%20Board" },
          { name: "Full Board", price: 130, detail: "Room with breakfast, lunch and dinner.", bookingHref: "/booking?property=Masfalhi%20View%20Inn&roomType=Standard%20Double%20Room&mealPlan=Full%20Board" },
        ]}
        terms={[
          { title: "Room-category availability", text: "Tripelor checks the available room pool for your selected category and dates before confirmation." },
          { title: "A clear booking journey", text: "Choose your room category, dates and meal plan online, then receive personal confirmation and payment guidance from Tripelor." },
        ]}
      />
    </>
  );
}
