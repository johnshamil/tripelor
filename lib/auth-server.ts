import { cookies } from "next/headers";

const ACCESS_COOKIE="tripelor_access";
const REFRESH_COOKIE="tripelor_refresh";

function cfg(){const url=process.env.SUPABASE_URL?.replace(/\/$/,"");const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Supabase authentication is not configured.");return{url,key};}

export async function supabaseAuth(path:string,init:RequestInit={}){const{url,key}=cfg();return fetch(`${url}/auth/v1/${path}`,{...init,headers:{apikey:key,"Content-Type":"application/json",...(init.headers||{})},cache:"no-store"});}

export function setSession(accessToken:string,refreshToken?:string,expiresIn=3600){const jar=cookies();jar.set(ACCESS_COOKIE,accessToken,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:expiresIn});if(refreshToken)jar.set(REFRESH_COOKIE,refreshToken,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*24*30});}
export function clearSession(){const jar=cookies();jar.set(ACCESS_COOKIE,"",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:0});jar.set(REFRESH_COOKIE,"",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:0});}

export async function currentUser(){const token=cookies().get(ACCESS_COOKIE)?.value;if(!token)return null;const r=await supabaseAuth("user",{headers:{Authorization:`Bearer ${token}`}});if(!r.ok)return null;return await r.json();}

export async function requireUser(){const user=await currentUser();if(!user)throw new Error("UNAUTHORIZED");return user;}
export function isAdminEmail(email?:string|null){const configured=(process.env.TRIPELOR_ADMIN_EMAIL||"bookings@tripelor.com").toLowerCase();return Boolean(email&&email.toLowerCase()===configured);}
