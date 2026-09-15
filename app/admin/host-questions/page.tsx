import { redirect } from "next/navigation";
import { currentUser, isAdminEmail } from "@/lib/auth-server";
import HostQuestionInbox from "@/components/host-question-inbox";
export const dynamic="force-dynamic";
export const metadata={title:"Host Questions | Tripelor Admin",robots:{index:false,follow:false}};
export default async function Page(){const u=await currentUser();if(!u)redirect("/login?next=%2Fadmin%2Fhost-questions");if(!isAdminEmail(u.email))return <section className="container py-20">Admin access required.</section>;return <HostQuestionInbox admin/>;}
