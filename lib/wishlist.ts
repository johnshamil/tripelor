import type { PublicProperty } from "@/lib/property-model";
export const wishlistIdeas = ["Swim with turtles", "Visit a sandbank", "Watch dolphins", "Enjoy a quiet beach", "Try local food"];
export function tagKey(tag:string) { return tag.trim().replace(/\s+/g," ").toLowerCase(); }
export function wishlistCatalog(properties:PublicProperty[]) {
  const entries=properties.filter(p=>p.status==="published").flatMap(p=>[...(p.wishlistTags || []),...(p.experiences || []).filter(e=>e.enabled).flatMap(e=>e.wishlistTags || [])]);
  return Array.from(new Map([...wishlistIdeas,...entries].map(tag=>[tagKey(tag),tag])).values()).sort((a,b)=>a.localeCompare(b));
}
export function wishlistMatches(properties:PublicProperty[],selected:string[]) {
  const keys=new Set(selected.map(tagKey));
  const matched=(tags:string[])=>Array.from(new Map(tags.filter(t=>keys.has(tagKey(t))).map(t=>[tagKey(t),t])).values());
  return properties.filter(p=>p.status==="published").map(property=>{
    const activities=(property.experiences || []).filter(e=>e.enabled).map(experience=>({experience,tags:matched(experience.wishlistTags || [])})).filter(e=>e.tags.length);
    const direct=matched(property.wishlistTags || []);
    const tags=matched([...direct,...activities.flatMap(e=>e.tags)]);
    return {property,tags,direct,activities};
  }).filter(item=>item.tags.length).sort((a,b)=>b.tags.length-a.tags.length || a.property.name.localeCompare(b.property.name));
}
