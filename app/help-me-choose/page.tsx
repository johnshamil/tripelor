import HelpMeChoose from "@/components/help-me-choose";
import { publishedProperties } from "@/lib/property-store";
export const dynamic="force-dynamic";
export const metadata={title:"Help Me Choose",description:"Three simple questions to help find your Maldives stay, transfer or holiday."};
export default async function HelpPage(){return <HelpMeChoose properties={await publishedProperties()}/>;}
