"use client";
import { propertyPhotoUrl } from "@/lib/property-model";
import type { PropertyExperience } from "@/lib/property-model";
import SaveTripButton from "@/components/save-trip-button";

export default function PropertyExperiences({experiences,propertyName,slug,preview=false}:{experiences:PropertyExperience[];propertyName:string;slug:string;preview?:boolean}) {
  const visible=experiences.filter(item=>item.enabled);
  if(!visible.length)return null;
  return <section id="experiences" className="bg-[#06151c] text-white"><div className="container py-16 md:py-20">
    <p className="eyebrow">Explore beyond your room</p><h2 className="section-title mt-3">Things to do near this stay</h2>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">Discover experiences available through {propertyName}. Save your favourites to My Tripelor, then ask our team to arrange them. Prices and availability are confirmed before booking.</p>
    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{visible.map(item=><article id={`experience-${item.id}`} key={item.id} className="flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
      {item.photos.length>0&&<div className="flex snap-x snap-mandatory overflow-x-auto">{item.photos.map((photo,index)=><img key={photo} src={propertyPhotoUrl(photo)} alt={`${item.name} · photo ${index+1}`} loading="lazy" className="aspect-[4/3] w-full shrink-0 snap-center object-cover"/>)}</div>}
      <div className="flex flex-1 flex-col p-6"><p className="text-xs uppercase tracking-wider text-gold">{item.duration}</p><h3 className="font-display mt-3 text-3xl">{item.name}</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/60">{item.description}</p>
      <h4 className="mt-5 text-sm font-semibold text-gold">What's included</h4><p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/60">{item.inclusions}</p>
      <p className="mt-6 text-xl text-gold">{item.price>0?`From USD ${item.price}`:"Price on request"}{item.price>0&&<span className="ml-2 text-xs text-white/50">{item.priceUnit}</span>}</p>
      <div className="mt-auto pt-5">{preview?<button type="button" disabled className="btn-outline opacity-50">Add to My Trip · Preview</button>:<SaveTripButton itemType="package" itemKey={`experience-${slug}-${item.id}`} title={item.name} subtitle={`${propertyName} · ${item.duration} · ${item.price>0?"From USD "+item.price+" "+item.priceUnit:"Price on request"}`} imageUrl={item.photos[0]?propertyPhotoUrl(item.photos[0]):undefined} href={`/stays/${slug}#experience-${item.id}`} label="Add to My Trip"/>}</div>
      </div>
    </article>)}</div>
  </div></section>;
}
