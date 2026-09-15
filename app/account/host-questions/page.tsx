import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth-server";
import HostQuestionInbox from "@/components/host-question-inbox";
export const dynamic="force-dynamic";
export const metadata={title:"My Host Messages | Tripelor",robots:{index:false,follow:false}};
export default async function Page(){if(!await currentUser())redirect("/login?next=%2Faccount%2Fhost-questions");return <HostQuestionInbox/>;}
