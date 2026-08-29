import { NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/auth-server";

export async function POST(req:Request){
 try{
  const {email}=await req.json();
  if(!email||!String(email).includes("@")) return NextResponse.json({error:"Please enter a valid email address."},{status:400});
  const r=await supabaseAuth("recover",{method:"POST",body:JSON.stringify({email:String(email).trim().toLowerCase(),redirect_to:"https://tripelor.com/reset-password"})});
  if(!r.ok){const x=await r.json().catch(()=>({}));throw new Error(x?.msg||x?.error_description||"Unable to send reset email.");}
  return NextResponse.json({ok:true,message:"If an account exists for this email, a password reset link has been sent."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to send reset email."},{status:500});}
}
