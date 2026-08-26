import BookingPageClientV2 from "@/components/booking-page-client-v2";
import {Gift} from "lucide-react";

export default function BookingPage({searchParams}:{searchParams?:{ref?:string}}){
  const ref=(searchParams?.ref||"").trim().toUpperCase();
  return <>
    {ref&&<div className="container pt-8"><div className="mx-auto max-w-5xl rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4"><div className="flex items-start gap-3"><Gift className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"/><div><p className="font-semibold text-emerald-200">Referral reward unlocked — USD 20 off</p><p className="mt-1 text-sm text-gray-300">Referral code <b>{ref}</b> will be verified and applied to this eligible booking. The person who referred you earns 100 Tripelor Points after you complete your stay.</p></div></div></div></div>}
    <BookingPageClientV2/>
  </>;
}
