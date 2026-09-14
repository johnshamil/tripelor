import type { PublicProperty } from "@/lib/property-model";

export type CouplePreferences = { pace: "adventure" | "relax" | "balance"; setting: "quiet" | "active" | "either"; meal: string; budget: number; moment: string };
export type CoupleCandidate = { key: string; slug: string; name: string; island: string; room: string; meal: string; rate: number; photo: string; reasons: string[] };
export function mealCode(value: string) {
  const normal = value.toLowerCase().replace(/[^a-z]/g, "");
  return ({ bb:"BB", bedbreakfast:"BB", bedandbreakfast:"BB", hb:"HB", halfboard:"HB", fb:"FB", fullboard:"FB", ro:"RO", roomonly:"RO", ai:"AI", allinclusive:"AI" } as Record<string,string>)[normal] || value;
}
export function momentKey(slug: string, id: string) { return JSON.stringify([slug, id]); }
export function validateCouplePreferences(raw: any, properties: PublicProperty[]): CouplePreferences {
  if(!raw || !["adventure","relax","balance"].includes(raw.pace) || !["quiet","active","either"].includes(raw.setting)) throw new Error("Choose your holiday pace and island atmosphere.");
  const meal = typeof raw.meal === "string" ? raw.meal : "";
  if(!["any", ...properties.flatMap(p=>p.rooms.map(r=>mealCode(r.mealPlan)))].includes(meal)) throw new Error("Choose a listed meal plan.");
  if(typeof raw.budget !== "number" || !Number.isFinite(raw.budget) || raw.budget < 1 || raw.budget > 10000) throw new Error("Enter a nightly room budget between USD 1 and 10,000.");
  const moment = typeof raw.moment === "string" ? raw.moment : "";
  if(moment && !properties.some(p=>(p.experiences || []).some(e=>e.enabled && momentKey(p.slug,e.id)===moment))) throw new Error("That experience is no longer listed. Choose another moment.");
  return { pace:raw.pace, setting:raw.setting, meal, budget:raw.budget, moment };
}
export function buildCoupleMatch(a: CouplePreferences, b: CouplePreferences, properties: PublicProperty[]) {
  const published = properties.filter(p=>p.status==="published");
  const moments = [a,b].map((preference,index) => {
    for(const p of published) {
      const e=(p.experiences || []).find(e=>e.enabled && momentKey(p.slug,e.id)===preference.moment);
      if(e) return { traveller:index+1, name:e.name, slug:p.slug, property:p.name, id:e.id, price:e.price, unit:e.priceUnit };
    }
    return { traveller:index+1, name:preference.moment ? "This experience is no longer listed; choose another moment." : "Time left free", slug:"", property:"", id:"", price:0, unit:"" };
  });
  const candidates = published.flatMap(p=>p.rooms
    .filter(r=>r.capacity>=2 && Number.isFinite(r.sellingRate) && r.sellingRate>0 && r.sellingRate<=Math.min(a.budget,b.budget))
    .map(r=>{
      const meal=mealCode(r.mealPlan);
      const mealMatches=[a,b].filter(x=>x.meal==="any" || x.meal===meal).length;
      const momentMatches=moments.filter(m=>m.slug===p.slug).length;
      return { key:JSON.stringify([p.slug,r.name,r.mealPlan]), slug:p.slug, name:p.name, island:p.island, room:r.name, meal:r.mealPlan, rate:r.sellingRate, photo:p.photos[0] || "", reasons:["Within both nightly room budgets", mealMatches===2 ? "Fits both meal-plan preferences" : mealMatches===1 ? "Meal plan fits one preference; discuss together" : "Alternative meal plan to discuss", ...(momentMatches ? [momentMatches===2 ? "Both special moments are offered through this stay" : "One special moment is offered through this stay"] : [])], score:mealMatches*2+momentMatches*3 };
    }))
    .sort((a,b)=>b.score-a.score || a.rate-b.rate || a.key.localeCompare(b.key));
  const unique = Array.from(new Map(candidates.map(c=>[c.key,c])).values()).slice(0,24).map(({score,...candidate})=>candidate);
  const pace = a.pace===b.pace ? ({adventure:"You both want adventure: make room for discovery.",relax:"You both want to relax: keep your days unhurried.",balance:"You both want a balance of activity and rest."})[a.pace] : "Your middle ground: one shared experience, with space to relax.";
  const setting = a.setting===b.setting && a.setting!=="either" ? (a.setting==="quiet" ? "You both prefer a quieter island atmosphere." : "You both prefer more island activity.") : "Explore the island atmosphere together before choosing.";
  return { candidates:unique as CoupleCandidate[], moments, pace, setting };
}
