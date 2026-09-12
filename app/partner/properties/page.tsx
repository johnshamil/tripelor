import { currentUser } from "@/lib/auth-server";
import PartnerPropertyDashboard from "@/components/partner-property-dashboard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PartnerPropertiesPage() {
  if (!(await currentUser())) redirect("/login?next=%2Fpartner%2Fproperties");
  return <PartnerPropertyDashboard />;
}
