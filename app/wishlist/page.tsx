import MaldivesWishlist from "@/components/maldives-wishlist";
import { publishedProperties } from "@/lib/property-store";
export const dynamic="force-dynamic";
export const metadata={title:"My Maldives Wishlist",description:"Choose the island moments you want and discover matching stays and experiences."};
export default async function WishlistPage({searchParams}:{searchParams:Promise<{wishes?:string|string[]}>}) {
  const params=await searchParams;
  const initial=typeof params.wishes==="string" && params.wishes.length<=5000?params.wishes:"";
  return <MaldivesWishlist properties={await publishedProperties()} initial={initial}/>;
}
