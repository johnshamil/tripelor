import { adminGuard, adminGroups, createGroup, sharedExcursionBody, sharedExcursionError, sharedExcursionResponse, updateGroup } from '@/lib/shared-excursion-server';
export const dynamic='force-dynamic';
export async function GET(){try{await adminGuard();return sharedExcursionResponse(await adminGroups());}catch(e){return sharedExcursionError(e);}}
export async function POST(request:Request){try{await adminGuard();return sharedExcursionResponse({group:await createGroup(await sharedExcursionBody(request))},201);}catch(e){return sharedExcursionError(e);}}
export async function PATCH(request:Request){try{await adminGuard();return sharedExcursionResponse({group:await updateGroup(await sharedExcursionBody(request))});}catch(e){return sharedExcursionError(e);}}
