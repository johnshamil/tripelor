export const VAAVU_BLUE_ESCAPE = {
  name: "Vaavu Blue Escape",
  slug: "vaavu-blue-escape",
  href: "/island-adventures/vaavu-blue-escape",
  enquiryHref: "/contact?package=vaavu-blue-escape",
  price: 100,
  image: "/packages/3-nights/Snorkelling-1.webp",
  imageAlt: "Snorkeling alongside sharks in clear turquoise water",
  description:
    "Explore Vaavu above and below the water, from Shark Bay and a shipwreck to turtles, dolphins and local island life, with lunch included.",
  inclusions: [
    "Shark Bay snorkeling",
    "Dolphin watching",
    "Lunch",
    "Shipwreck snorkeling",
    "Turtle spotting",
    "Island hopping to Thinadhoo or Keyodhoo",
  ],
} as const;

export const vaavuBlueEscapeEnquiry = `I would like to enquire about ${VAAVU_BLUE_ESCAPE.name} at USD ${VAAVU_BLUE_ESCAPE.price} per person.\n\nIncludes: ${VAAVU_BLUE_ESCAPE.inclusions.join("; ")}.\n\nPlease confirm availability for my travel date and number of guests.`;
