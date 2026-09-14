import LuxuryPropertyPage from "@/components/luxury-property-page";
import { propertyPhotoUrl } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";

function imageUrl(photo: string) { return propertyPhotoUrl(photo); }
function displayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date not set" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
export default function ManagedPropertyView({ property }: { property: PublicProperty }) {
  const photos = property.photos.map(imageUrl);
  const roomGroups = new Map<string, typeof property.rooms>();
  for (const room of property.rooms) {
    const group = roomGroups.get(room.name) || [];
    group.push(room);
    roomGroups.set(room.name, group);
  }
  const rooms = Array.from(roomGroups.values()).map((variants) => {
    const room = variants[0];
    const roomPhotos = Array.from(new Set(variants.flatMap(item => item.photos || []))).map(imageUrl);
    const bathroomPhotos = Array.from(new Set(variants.flatMap(item => item.bathroomPhotos || []))).map(imageUrl);
    const mealPlans = variants.map(variant => ({
      name: variant.mealPlan,
      price: variant.sellingRate,
      detail: variant.mealPlan === "Bed & Breakfast" ? "Breakfast included" : variant.mealPlan === "Half Board" ? "Breakfast and dinner included" : variant.mealPlan === "Full Board" ? "Breakfast, lunch and dinner included" : variant.mealPlan,
      bookingHref: `/booking?property=${encodeURIComponent(property.name)}&roomType=${encodeURIComponent(room.name)}&mealPlan=${encodeURIComponent(variant.mealPlan)}`,
    }));
    return {
      name: room.name,
      image: roomPhotos[0] || photos[0],
      photos: roomPhotos,
      bathroomPhotos,
      description: room.amenities || `${room.name} at ${property.name}.`,
      details: [`Up to ${room.capacity} guests`, property.amenities || "Tripelor support"],
      mealPlans,
      bookingHref: mealPlans[0].bookingHref,
    };
  });
  const seasonalRates = property.seasonalRates.map((rate) => ({
    name: `${rate.name} · ${rate.roomName} · ${rate.mealPlan}`,
    price: rate.sellingRate,
    detail: `${displayDate(rate.startDate)} – ${displayDate(rate.endDate)} · ${rate.mealPlan}`,
    bookingHref: `/booking?property=${encodeURIComponent(property.name)}&roomType=${encodeURIComponent(rate.roomName)}&mealPlan=${encodeURIComponent(rate.mealPlan)}&checkIn=${encodeURIComponent(rate.startDate)}`,
  }));
  const rates = seasonalRates;
  const amounts = [...property.rooms.map(room => room.sellingRate), ...property.seasonalRates.map(rate => rate.sellingRate)].filter(rate => Number.isFinite(rate) && rate > 0);
  const startingFrom = amounts.length ? Math.min(...amounts) : 0;

  return <LuxuryPropertyPage
    eyebrow="A Tripelor partner stay"
    name={property.name}
    location={property.island}
    description={property.description}
    photos={photos}
    startingFrom={startingFrom}
    bookingHref={`/booking?property=${encodeURIComponent(property.name)}`}
    highlights={[
      { icon: "island", title: "Island location", text: property.island },
      { icon: "dining", title: "Flexible meal plans", text: "Choose from the meal plans shown for each room." },
      { icon: "support", title: "Tripelor support", text: "Send a booking request and Tripelor will confirm availability and next steps." },
    ]}
    rooms={rooms}
    rates={rates}
    terms={[
      { title: "Taxes & service charges", text: property.taxes },
      { title: "Transfers", text: property.transfers },
      { title: "Cancellation", text: property.cancellation },
      { title: "Payment", text: property.payment },
    ]}
  />;
}
