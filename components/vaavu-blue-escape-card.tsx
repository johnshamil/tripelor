import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { VAAVU_BLUE_ESCAPE as excursion } from "@/lib/vaavu-blue-escape";

export default function VaavuBlueEscapeCard() {
  return (
    <section className="container py-12 md:py-16" aria-labelledby="vaavu-blue-escape-title">
      <article className="card grid overflow-hidden lg:grid-cols-2">
        <Link href={excursion.href} className="relative block min-h-[280px] lg:min-h-[440px]" aria-label={`Explore ${excursion.name}`}>
          <Image src={excursion.image} alt={excursion.imageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </Link>
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-gold">Vaavu Atoll · Ocean excursion</p>
          <h2 id="vaavu-blue-escape-title" className="font-display mt-3 text-4xl">{excursion.name}</h2>
          <p className="mt-4 leading-7 text-gray-300">{excursion.description}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {excursion.inclusions.map(item => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-gray-200">
                <CheckCircle2 aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-gold" />{item}
              </li>
            ))}
          </ul>
          <div className="mt-7 border-t border-white/10 pt-6">
            <p><strong className="text-4xl text-gold">USD {excursion.price}</strong><span className="ml-2 text-sm text-gray-300">per person</span></p>
            <Link href={excursion.href} className="btn-gold mt-5 w-full gap-2 sm:w-auto">View Package <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
        </div>
      </article>
    </section>
  );
}
