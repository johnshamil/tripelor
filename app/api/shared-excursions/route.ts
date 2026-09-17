import { requireUser } from '@/lib/auth-server';
import { customerJoins, joinGroup, listGroups, sharedExcursionBody, sharedExcursionError, sharedExcursionResponse } from '@/lib/shared-excursion-server';
export const dynamic='force-dynamic';
export async function GET() { try { const groups=await listGroups(); let joins:any[]=[]; try { const user=await requireUser(); joins=await customerJoins(user); } catch {} return sharedExcursionResponse({groups,joins}); } catch(e){ return sharedExcursionError(e); } }
export async function POST(request:Request) { try { const user=await requireUser(); return sharedExcursionResponse(await joinGroup(user,await sharedExcursionBody(request)),201); } catch(e){ return sharedExcursionError(e); } }
