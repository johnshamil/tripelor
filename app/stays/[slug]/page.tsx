import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ManagedPropertyView from "@/components/managed-property-view";
import { findProperty } from "@/lib/property-store";

export const dynamic = "force-dynamic";

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
  return <ManagedPropertyView property={property}/>;
}
