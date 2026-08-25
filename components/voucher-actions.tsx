"use client";
import {Download,Printer} from "lucide-react";
export default function VoucherActions(){return <div className="no-print mt-8 flex flex-wrap justify-center gap-3"><button onClick={()=>window.print()} className="btn-gold gap-2"><Download className="h-4 w-4"/>Save Voucher as PDF</button><button onClick={()=>window.print()} className="btn-outline gap-2"><Printer className="h-4 w-4"/>Print Voucher</button></div>}
