import { redirect } from "next/navigation";
import { currentUser, isAdminEmail } from "@/lib/auth-server";
import TransferManager from "@/components/transfer-manager";

export const dynamic = "force-dynamic";

export default async function TransferManagerPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fadmin%2Ftransfers");
  if (!isAdminEmail(user.email)) return <main className="container py-20">Admin access required.</main>;
  return <TransferManager />;
}
