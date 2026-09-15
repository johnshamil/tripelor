import type { PublicProperty } from "@/lib/property-model";

export const shortlistChoices = [{value:"favourite",label:"❤️ My favourite"},{value:"happy",label:"👍 Happy with this"},{value:"question",label:"💬 I have a question"}] as const;
export type ShortlistChoice = (typeof shortlistChoices)[number]["value"];
export type ShortlistVote = { slug: string; choice: ShortlistChoice; question: string };
export type ShortlistPerson = { name: string; votes: ShortlistVote[] };
export type ShortlistView = { title: string; version: number; expiresAt: string; isOwner: boolean; slugs: string[]; properties: PublicProperty[]; people: ShortlistPerson[]; mine: ShortlistPerson | null };
export function shortlistText(value: unknown, max: number, label: string) {
  if(typeof value !== "string" || value.length > max) throw new Error(label + " must be text with up to " + max + " characters.");
  return value.trim();
}
export function shortlistSlugs(value: unknown, properties: PublicProperty[]) {
  if(!Array.isArray(value) || value.length < 1 || value.length > 3 || new Set(value).size !== value.length) throw new Error("Choose one to three different stays.");
  if(value.some(slug => typeof slug !== "string" || !properties.some(p => p.slug === slug && p.status === "published"))) throw new Error("One of these stays is no longer available. Refresh and choose again.");
  return value as string[];
}
export function shortlistVote(value: any, slugs: string[]): ShortlistVote {
  if(!value || !slugs.includes(value.slug) || !shortlistChoices.some(c => c.value === value.choice)) throw new Error("Choose a stay and a valid vote.");
  const question = shortlistText(value.question ?? "", 300, "Your question");
  if(value.choice === "question" && !question) throw new Error("Enter your question before saving.");
  return {slug:value.slug,choice:value.choice,question:value.choice === "question" ? question : ""};
}
export function shortlistQuote(view: ShortlistView, selected: string[]) {
  const properties=view.properties.filter(p=>selected.includes(p.slug));
  return ["Hello Tripelor, please prepare a group quote for our holiday shortlist: " + view.title,
    ...properties.map(p => {
      const votes=view.people.flatMap(person=>person.votes).filter(v=>v.slug===p.slug);
      return "\n" + p.name + " — " + p.island + "\nhttps://tripelor.com/stays/" + p.slug + "\n" + votes.filter(v=>v.choice==="favourite").length + " favourite votes; " + votes.filter(v=>v.choice==="happy").length + " happy votes." + votes.filter(v=>v.choice==="question").slice(0,3).map(v=>"\nQuestion: " + v.question).join("");
    }), "\nTravel dates:", "Adults and children (with ages):", "Rooms needed:", "Preferred rooms and meal plans:", "Transfer requirements:", "\nPlease confirm availability, total price, taxes and transfer costs."].join("\n");
}
