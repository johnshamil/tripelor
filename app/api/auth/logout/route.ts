import { clearSession } from "@/lib/auth-server";
export async function POST(){clearSession();return Response.json({success:true});}
