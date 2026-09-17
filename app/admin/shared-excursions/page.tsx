import { redirect } from 'next/navigation';
import { currentUser, isAdminEmail } from '@/lib/auth-server';
import SharedExcursionAdmin from '@/components/shared-excursion-admin';
export const dynamic='force-dynamic';
export default async function Page(){const user=await currentUser();if(!user)redirect('/login?next=%2Fadmin%2Fshared-excursions');if(!isAdminEmail(user.email))return <section className="container py-20">Admin access required.</section>;return <SharedExcursionAdmin/>;}
