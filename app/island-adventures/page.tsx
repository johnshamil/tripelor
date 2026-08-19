import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const packages = [
  {
    name:"Maldives Reef & Relax Escape",
    slug:"reef-relax-escape",
    label:"Relax & Snorkel",
    price:750,
    image:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1400&auto=format&fit=crop",
    preview:[
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1530053969600-caed2596d242?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop"
    ],
    description:"Five relaxing nights with Half Board meals and a snorkeling experience in warm, crystal-clear tropical water.",
    items:["5-night stay","Half Board meal plan","Snorkeling experience"],
    meal:"Half Board"
  },
  {
    name:"5-Night Island Adventure",
    slug:"5-night-island-adventure",
    label:"Full Adventure",
    price:540,
    image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
    preview:[
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540202404-a2f29016b523?q=80&w=900&auto=format&fit=crop"
    ],
    description:"See and do more with tropical reef snorkeling, a sandbank escape, dolphin cruise, fishing and island hopping.",
    items:["5-night Maldives island experience","Snorkeling trip","Sandbank trip","Dolphin cruise","Fishing experience","Island hopping experience"]
  },
  {
    name:"Maldives Ocean Discovery Escape",
    slug:"ocean-discovery-escape",
    label:"Full Board Adventure",
    price:850,
    image:"https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1400&auto=format&fit=crop",
    preview:[
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?q=80&w=900&auto=format&fit=crop"
    ],
    description:"Five unforgettable nights with Full Board dining, snorkeling, night fishing and island hopping.",
    items:["5-night stay","Full Board meal plan","Snorkeling experience","Night fishing trip","Island hopping experience"],
    meal:"Full Board"
  },
];

export default function IslandAdventuresPage(){return <main>
<section className="relative min-h-[58vh] overflow-hidden"><Image src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2200&auto=format&fit=crop" alt="Maldives island adventure" fill priority className="object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30"/><div className="container relative flex min-h-[58vh] items-center"><div className="max-w-3xl py-20"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Tripelor Experiences</p><h1 className="mt-3 text-5xl font-bold md:text-7xl">Maldives <span className="text-gold">Island Packages</span></h1><p className="mt-6 max-w-2xl text-lg text-gray-200">Choose a package, view the photos, read the full experience and see exactly what is included before you book.</p></div></div></section>
<section className="container py-16"><div className="mb-10 text-center"><p className="text-sm uppercase tracking-[0.3em] text-gold">Explore Packages</p><h2 className="mt-3 text-4xl font-bold">Find the escape that feels right for you</h2></div><div className="grid gap-8 lg:grid-cols-3">{packages.map(pkg=><article key={pkg.name} className="card overflow-hidden"><div className="relative h-60"><Image src={pkg.image} alt={pkg.name} fill className="object-cover"/></div><div className="grid grid-cols-3 gap-1 p-2">{pkg.preview.map((photo,i)=><div key={photo} className="relative h-20 overflow-hidden rounded-lg"><Image src={photo} alt={`${pkg.name} preview ${i+1}`} fill className="object-cover"/></div>)}</div><div className="p-7 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{pkg.label} Package</p><h3 className="mt-2 text-3xl font-bold">{pkg.name}</h3><p className="mt-4 leading-7 text-gray-400">{pkg.description}</p><div className="mt-6 space-y-3">{pkg.items.slice(0,4).map(x=><div key={x} className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-gold"/><span>{x}</span></div>)}</div><div className="mt-7 border-t border-white/10 pt-6"><strong className="text-4xl text-gold">USD {pkg.price}</strong><div className="mt-5 flex flex-wrap gap-3"><Link href={`/island-adventures/${pkg.slug}`} className="btn-outline">View Details & Photos</Link><Link href={`/booking?package=${encodeURIComponent(pkg.name+" - USD "+pkg.price)}${pkg.meal?`&mealPlan=${encodeURIComponent(pkg.meal)}`:""}`} className="btn-gold">Book Package</Link></div></div></div></article>)}</div></section>
</main>}
