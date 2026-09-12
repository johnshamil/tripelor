import { redirect } from "next/navigation";
import { currentUser, isAdminEmail } from "@/lib/auth-server";
import PropertyDashboard from "@/components/property-dashboard";
export const dynamic="force-dynamic";
export default async function Page(){const u=await currentUser();if(!u)redirect("/login?next=%2Fadmin%2Fproperties");if(!isAdminEmail(u.email))return <main className="container py-20">Admin access required.</main>;return <PropertyDashboard/>;}
