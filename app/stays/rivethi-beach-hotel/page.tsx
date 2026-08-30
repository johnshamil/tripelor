import LuxuryPropertyPage from "@/components/luxury-property-page";

const photos = [
  "/properties/rivethi-beach-hotel/1719713475.jpeg",
  "/properties/rivethi-beach-hotel/0584s12000ssx9b685F06_W_1280_853_R5.webp",
  "/properties/rivethi-beach-hotel/604895445.jpg",
  "/properties/rivethi-beach-hotel/816271360.jpg",
  "/properties/rivethi-beach-hotel/7143733a-088c-4eea-b23a-117a50d93240.webp",
];

export default function RivethiBeach() {
  return (
    <LuxuryPropertyPage
      eyebrow="Beachfront Hulhumalé stay"
      name="Rivethi Beach Hotel"
      location="Hulhumalé, Maldives"
      description="A convenient beachfront hotel near Velana International Airport, ideal for a refined arrival, departure or short Maldives stopover."
      photos={photos}
      startingFrom={85}
      bookingHref="/booking?property=Rivethi%20Beach%20Hotel&roomType=Deluxe%20Double&mealPlan=Bed%20%26%20Breakfast"
      highlights={[
        { icon: "airport", title: "Close to the airport", text: "A convenient base approximately 5–10 minutes from Velana International Airport." },
        { icon: "island", title: "Beachfront setting", text: "A comfortable city-island stay close to the shoreline and Hulhumalé amenities." },
        { icon: "shield", title: "Live Tripelor booking", text: "Current availability is checked before your reservation request is confirmed." },
      ]}
      rooms={[
        {
          name: "Deluxe Double",
          image: photos[1],
          description: "A comfortable double room for an easy arrival, departure or short island-city stay.",
          details: ["Single or double", "RO or BB", "Live room pool", "Near airport"],
          bookingHref: "/booking?property=Rivethi%20Beach%20Hotel&roomType=Deluxe%20Double&mealPlan=Bed%20%26%20Breakfast",
        },
        {
          name: "Deluxe Twin",
          image: photos[2],
          description: "Twin accommodation with clear room-only and breakfast options.",
          details: ["Twin bedding", "RO or BB", "Live room pool", "Beachfront hotel"],
          bookingHref: "/booking?property=Rivethi%20Beach%20Hotel&roomType=Deluxe%20Twin&mealPlan=Bed%20%26%20Breakfast",
        },
        {
          name: "Deluxe Sea View",
          image: photos[3],
          description: "A sea-facing stay with breakfast or full-board dining choices.",
          details: ["Sea view", "BB or FB", "Live room pool", "Up to 2 adults"],
          bookingHref: "/booking?property=Rivethi%20Beach%20Hotel&roomType=Deluxe%20Double%20Sea%20View&mealPlan=Bed%20%26%20Breakfast",
        },
      ]}
      rates={[
        { name: "Deluxe Double / Twin · Room Only", price: 85, detail: "Comfortable room without meals.", bookingHref: "/booking?property=Rivethi%20Beach%20Hotel&roomType=Deluxe%20Double&mealPlan=Room%20Only" },
        { name: "Deluxe Double / Twin · Breakfast", price: 95, detail: "Comfortable room with daily breakfast.", bookingHref: "/booking?property=Rivethi%20Beach%20Hotel&roomType=Deluxe%20Double&mealPlan=Bed%20%26%20Breakfast" },
        { name: "Deluxe Sea View · Breakfast", price: 130, detail: "Sea-view room with daily breakfast.", bookingHref: "/booking?property=Rivethi%20Beach%20Hotel&roomType=Deluxe%20Double%20Sea%20View&mealPlan=Bed%20%26%20Breakfast" },
        { name: "Deluxe Sea View · Full Board", price: 195, detail: "Sea-view room with breakfast, lunch and dinner.", bookingHref: "/booking?property=Rivethi%20Beach%20Hotel&roomType=Deluxe%20Double%20Sea%20View&mealPlan=Full%20Board" },
      ]}
      terms={[
        { title: "Children & extra beds", text: "Children aged 0–4 stay free when sharing existing bedding. Extra mattress and breakfast charges apply for older children and additional adults." },
        { title: "Booking & cancellation", text: "A 50% advance payment is required to confirm. Cancellation charges vary by notice period, with free cancellation 7 or more days before arrival." },
      ]}
    />
  );
}
