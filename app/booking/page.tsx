import BookingPageClientV2 from "@/components/booking-page-client-v2";
import {Gift} from "lucide-react";

export default function BookingPage({searchParams}:{searchParams?:{ref?:string}}){
  const ref=(searchParams?.ref||"").trim().toUpperCase();
  return <>
    {ref&&<div className="bg-[#f1ebdf] px-5 pt-8 text-[#071922] md:px-8"><div className="mx-auto max-w-5xl border border-[#c9b88f] bg-[#f8f2e7] p-5"><div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9c7d3d]/10"><Gift className="h-5 w-5 text-[#8d7037]"/></div><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#8d7037]">Private referral benefit</p><p className="font-display mt-1 text-2xl">USD 20 off your stay</p><p className="mt-2 text-sm leading-6 text-[#58656c]">Referral code <b>{ref}</b> will be verified and applied to this eligible booking. The person who referred you earns 100 Tripelor Points after you complete your stay.</p></div></div></div></div>}
    <BookingPageClientV2/>
  </>;
}
