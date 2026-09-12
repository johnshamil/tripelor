import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LuxuryPropertyPage from "@/components/luxury-property-page";
import { findProperty } from "@/lib/property-store";

export const dynamic = "force-dynamic";

function imageUrl(photo: string) {
  return `/api/property-photo/${photo}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await findProperty(slug);
  if (!property) return { title: "Stay not found" };
  return { title: property.name, description: property.description };
}

export default async function ManagedStayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await findProperty(slug);
  if (!property) notFound();

  const photos = property.photos.map(imageUrl);
  const rooms = property.rooms.map((room) => ({
    name: room.name,
    image: photos[0],
    description: room.amenities || `${room.name} at ${property.name}.`,
    details: [`Up to ${room.capacity} guest${room.capacity === 1 ? "" : "s"}`, room.mealPlan, `${room.totalRooms} room${room.totalRooms === 1 ? "" : "s"} available`, property.amenities || "Tripelor support"],
    bookingHref: `/booking?property=${encodeURIComponent(property.name)}&roomType=${encodeURIComponent(room.name)}&mealPlan=${encodeURIComponent(room.mealPlan)}`,
  }));
  const rates = property.rooms.map((room) => ({
    name: `${room.name} · ${room.mealPlan}`,
    price: room.sellingRate,
    detail: room.amenities || `${room.mealPlan} stay at ${property.name}.`,
    bookingHref: `/booking?property=${encodeURIComponent(property.name)}&roomType=${encodeURIComponent(room.name)}&mealPlan=${encodeURIComponent(room.mealPlan)}`,
  }));
  const startingFrom = Math.min(...property.rooms.map((room) => room.sellingRate));

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
