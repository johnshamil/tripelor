import type { Metadata } from "next";
import HolidayShortlist from "@/components/holiday-shortlist";
import { publishedProperties } from "@/lib/property-store";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {title:"Share My Holiday Shortlist",description:"Choose Maldives stays together with your family and friends.",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page(){return <HolidayShortlist properties={await publishedProperties()}/>;}
