import { isAdminEmail, requireUser } from "@/lib/auth-server";

export async function GET(){
  try{
    const user=await requireUser();
    if(!isAdminEmail(user.email)) return Response.json({error:"Admin access required."},{status:403});

    const url=process.env.SUPABASE_URL?.replace(/\/$/,"");
    const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!key) throw new Error("Supabase admin access is not configured.");

    const r=await fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`,{
      headers:{apikey:key,Authorization:`Bearer ${key}`},
      cache:"no-store"
    });
    const text=await r.text();
    const data=text?JSON.parse(text):{};
    if(!r.ok) throw new Error(data?.msg||data?.message||"Unable to load users.");

    const users=(data.users||[]).map((u:any)=>({
      id:u.id,
      email:u.email||"",
      fullName:u.user_metadata?.full_name||u.user_metadata?.name||"",
      confirmedAt:u.email_confirmed_at||u.confirmed_at||null,
      createdAt:u.created_at||null,
      lastSignInAt:u.last_sign_in_at||null,
      isAdmin:isAdminEmail(u.email)
    }));

    return Response.json({users});
  }catch(e){
    if(e instanceof Error&&e.message==="UNAUTHORIZED") return Response.json({error:"Please log in."},{status:401});
    return Response.json({error:e instanceof Error?e.message:"Unable to load users."},{status:500});
  }
}
