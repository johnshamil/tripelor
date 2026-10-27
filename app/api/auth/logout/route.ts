import { clearSession } from "@/lib/auth-server";
export async function POST(){await clearSession();return Response.json({success:true});}
