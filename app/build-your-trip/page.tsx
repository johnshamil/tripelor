"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Heart,
  MapPin,
  ShieldCheck,
  Ship,
  Sparkles,
  Utensils,
  Wallet,
  Waves,
} from "lucide-react";
import SaveTripButton from "@/components/save-trip-button";

type Mood = "relax" | "romance" | "adventure" | "ocean";
type Dining = "flexible" | "Half Board" | "Full Board";
type Budget = "smart" | "signature" | "grand";

type PackageOption = {
  name: string;
  nights: 3 | 5;
  price: number;
  meal: "Half Board" | "Full Board";
  image: string;
  moods: Mood[];
  description: string;
  highlights: string[];
};

const reefImage = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1600&auto=format&fit=crop";
const islandImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop";
const discoveryImage = "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1600&auto=format&fit=crop";
const romanceImage = "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=1600&auto=format&fit=crop";

const basePackages = [
  {
    name: "Maldives Reef & Relax Escape",
    meal: "Half Board" as const,
    image: reefImage,
    moods: ["relax", "ocean"] as Mood[],
    description: "Unhurried island time balanced with an easy snorkeling experience.",
    highlights: ["Daily breakfast and dinner", "Guided snorkeling experience", "Time to enjoy Felidhoo at your pace"],
  },
  {
    name: "Island Adventure",
    meal: "Half Board" as const,
    image: islandImage,
    moods: ["adventure", "ocean"] as Mood[],
    description: "A fuller island journey for couples who want something memorable every day.",
    highlights: ["Snorkeling and sandbank", "Dolphin cruise and fishing", "Island-hopping experience"],
  },
  {
    name: "Maldives Ocean Discovery Escape",
    meal: "Full Board" as const,
    image: discoveryImage,
    moods: ["ocean", "adventure"] as Mood[],
    description: "Immersive ocean experiences paired with the ease of Full Board dining.",
    highlights: ["Breakfast, lunch and dinner", "Snorkeling experience", "Night fishing and island hopping"],
  },
  {
    name: "Beach BBQ Dinner Escape",
    meal: "Half Board" as const,
    image: romanceImage,
    moods: ["romance", "relax"] as Mood[],
    description: "A warm, romantic escape centred around sunset and a beach BBQ dinner.",
    highlights: ["Special beach BBQ dinner", "Sunset time together", "Snorkeling experience"],
  },
  {
    name: "Honeymoon Island Escape",
    meal: "Full Board" as const,
    image: islandImage,
    moods: ["romance", "relax"] as Mood[],
    description: "The most indulgent romantic choice, designed for an effortless celebration.",
    highlights: ["Full Board dining", "Romantic beach dinner", "Sandbank and dolphin cruise"],
  },
  {
    name: "Manta & Dolphin Adventure",
    meal: "Half Board" as const,
    image: reefImage,
    moods: ["adventure", "ocean"] as Mood[],
    description: "A marine-focused escape for couples inspired by the Maldives underwater world.",
    highlights: ["Manta excursion when conditions allow", "Dolphin cruise", "Snorkeling experience"],
  },
  {
    name: "Sunset & Sandbank Escape",
    meal: "Half Board" as const,
    image: romanceImage,
    moods: ["romance", "relax"] as Mood[],
    description: "Soft island romance with beautiful open-water moments and time to unwind.",
    highlights: ["Private-feeling sandbank time", "Sunset cruise", "Snorkeling experience"],
  },
];

const threeNightPrices = [550, 1250, 1050, 775, 1050, 850, 725];
const fiveNightPrices = [750, 1490, 1290, 990, 1350, 1100, 950];

const packageOptions: PackageOption[] = [
  ...basePackages.map((item, index) => ({ ...item, nights: 3 as const, price: threeNightPrices[index] })),
  ...basePackages.map((item, index) => ({
    ...item,
    name: item.name === "Island Adventure" ? "5-Night Island Adventure" : item.name,
    nights: 5 as const,
    price: fiveNightPrices[index],
  })),
];

const moodOptions: { value: Mood; title: string; text: string; icon: typeof Heart }[] = [
  { value: "relax", title: "Slow & peaceful", text: "Beach time, easy days and room to breathe.", icon: Waves },
  { value: "romance", title: "Romantic", text: "Sunsets, sandbanks and memorable moments for two.", icon: Heart },
  { value: "adventure", title: "Full of adventure", text: "More activities, more islands and active days.", icon: Compass },
  { value: "ocean", title: "Ocean discovery", text: "Snorkeling and marine experiences take priority.", icon: Sparkles },
];

const budgetOptions: { value: Budget; title: string; text: string }[] = [
  { value: "smart", title: "Up to USD 800", text: "A beautiful escape with the essentials included." },
  { value: "signature", title: "USD 801–1,100", text: "More experiences with a balanced total." },
  { value: "grand", title: "USD 1,101+", text: "The fullest package and most generous inclusions." },
];

function addDays(date: string, days: number) {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, "0")}-${String(result.getUTCDate()).padStart(2, "0")}`;
}

function formatDate(date: string) {
  if (!date) return "Choose later";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function packageScore(pkg: PackageOption, mood: Mood, dining: Dining, budget: Budget) {
  let score = pkg.moods.includes(mood) ? 60 : 0;
  if (dining === "flexible") score += 8;
  else if (pkg.meal === dining) score += 20;

  if (budget === "smart") score += pkg.price <= 800 ? 30 : Math.max(-30, 30 - (pkg.price - 800) / 8);
  if (budget === "signature") {
    if (pkg.price >= 801 && pkg.price <= 1100) score += 30;
    else score += Math.max(-20, 18 - Math.abs(pkg.price - 950) / 12);
  }
  if (budget === "grand") score += pkg.price >= 1101 ? 30 : Math.max(0, 12 - (1101 - pkg.price) / 40);
  return score;
}

export default function BuildYourTripPage() {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [arrival, setArrival] = useState("");
  const [nights, setNights] = useState<3 | 5>(5);
  const [mood, setMood] = useState<Mood>("relax");
  const [dining, setDining] = useState<Dining>("flexible");
  const [budget, setBudget] = useState<Budget>("signature");
  const [room, setRoom] = useState("ROOM 101");
  const [includeTransfer, setIncludeTransfer] = useState(true);

  const recommendation = useMemo(() => {
    return packageOptions
      .filter((option) => option.nights === nights)
      .sort((a, b) => packageScore(b, mood, dining, budget) - packageScore(a, mood, dining, budget))[0];
  }, [nights, mood, dining, budget]);

  const transferSeats = includeTransfer ? 2 : 0;
  const transferTotal = transferSeats * 50;
  const total = recommendation.price + transferTotal;
  const checkOut = addDays(arrival, nights);
  const selectedMood = moodOptions.find((option) => option.value === mood)?.title || "your preferences";
  const bookingHref = useMemo(() => {
    const params = new URLSearchParams({
      package: `${recommendation.name} - USD ${recommendation.price}`,
      mealPlan: recommendation.meal,
      nights: String(recommendation.nights),
      property: "Uhoo's Lavish Oasis",
      roomType: room,
      speedboatSeats: String(transferSeats),
      speedboatTotal: String(transferTotal),
      planTotal: String(total),
    });
    if (arrival) {
      params.set("checkIn", arrival);
      params.set("checkOut", checkOut);
    }
    return `/booking?${params.toString()}`;
  }, [recommendation, room, transferSeats, transferTotal, total, arrival, checkOut]);

  const steps = ["Your dates", "Travel style", "Preferences", "Finishing touches"];

  function nextStep() {
    if (step < steps.length - 1) setStep((current) => current + 1);
    else setComplete(true);
  }

  function editPlan() {
    setComplete(false);
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="bg-[#f1ebdf] pb-28 text-[#071922]">
      <section className="relative overflow-hidden bg-[#06151c] text-white">
        <img
          src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2200&auto=format&fit=crop"
          alt="Maldives island seen from the sea"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#031016] via-[#04151d]/95 to-[#04151d]/55" />
        <div className="container relative py-16 md:py-20">
          <div className="max-w-4xl">
            <p className="eyebrow">Tripelor private trip planner</p>
            <h1 className="font-display mt-4 text-5xl leading-[1.02] md:text-7xl">Let us find your kind of Maldives.</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">
              Tell us how you want the journey to feel. We will match you with the Tripelor package that fits your time, style and budget.
            </p>
          </div>
        </div>
      </section>

      {!complete ? (
        <section className="container -mt-1 pt-10">
          <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[1fr_320px] lg:items-start">
            <div className="border border-[#d0c5b0] bg-[#fffdf8] shadow-[0_24px_80px_rgba(34,43,46,.1)]">
              <div className="border-b border-[#d0c5b0] p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">Private recommendation</p>
                    <h2 className="font-display mt-2 text-3xl">{steps[step]}</h2>
                  </div>
                  <p className="font-display text-2xl italic text-[#9c7d3d]">0{step + 1} / 04</p>
                </div>
                <div className="mt-6 grid grid-cols-4 gap-2" aria-label={`Step ${step + 1} of 4`}>
                  {steps.map((label, index) => (
                    <div key={label} className={`h-1 ${index <= step ? "bg-[#9c7d3d]" : "bg-[#ded5c5]"}`} />
                  ))}
                </div>
              </div>

              <div className="min-h-[410px] p-6 md:p-9">
                {step === 0 && (
                  <div>
                    <p className="max-w-2xl leading-7 text-[#58656c]">Choose an approximate arrival date and the length of your island escape. You can confirm or change the date before sending your request.</p>
                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      <label className="premium-label">
                        <span><CalendarDays className="h-4 w-4 text-[#9c7d3d]" /> Approximate arrival</span>
                        <input
                          type="date"
                          value={arrival}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(event) => setArrival(event.target.value)}
                          className="premium-control [color-scheme:light]"
                        />
                        <small className="normal-case tracking-normal text-[#7b8588]">Optional — you may choose your date later.</small>
                      </label>
                      <div>
                        <p className="premium-label"><span><Sparkles className="h-4 w-4 text-[#9c7d3d]" /> Length of stay</span></p>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {([3, 5] as const).map((value) => (
                            <ChoiceButton
                              key={value}
                              active={nights === value}
                              onClick={() => setNights(value)}
                              title={`${value} nights`}
                              text={value === 3 ? "A concise island escape" : "More time to experience"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <p className="max-w-2xl leading-7 text-[#58656c]">What should this holiday feel like? Choose the experience that matters most to both of you.</p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {moodOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setMood(option.value)}
                            className={`group min-h-36 border p-5 text-left transition ${
                              mood === option.value ? "border-[#9c7d3d] bg-[#f3ead9]" : "border-[#d0c5b0] bg-[#fffdf8] hover:border-[#b39c6e]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <Icon className="h-6 w-6 text-[#9c7d3d]" />
                              {mood === option.value && <Check className="h-5 w-5 text-[#8d7037]" />}
                            </div>
                            <p className="font-display mt-5 text-2xl">{option.title}</p>
                            <p className="mt-2 text-sm leading-6 text-[#687377]">{option.text}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <p className="max-w-2xl leading-7 text-[#58656c]">Select your preferred level of dining and the package budget that feels comfortable.</p>
                    <div className="mt-8">
                      <p className="premium-label"><span><Utensils className="h-4 w-4 text-[#9c7d3d]" /> Dining preference</span></p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-3">
                        {(["flexible", "Half Board", "Full Board"] as Dining[]).map((value) => (
                          <ChoiceButton
                            key={value}
                            active={dining === value}
                            onClick={() => setDining(value)}
                            title={value === "flexible" ? "Surprise me" : value}
                            text={value === "Full Board" ? "All daily meals" : value === "Half Board" ? "Breakfast and dinner" : "Choose the best match"}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-8">
                      <p className="premium-label"><span><Wallet className="h-4 w-4 text-[#9c7d3d]" /> Package budget for two</span></p>
                      <div className="mt-2 grid gap-3 md:grid-cols-3">
                        {budgetOptions.map((option) => (
                          <ChoiceButton
                            key={option.value}
                            active={budget === option.value}
                            onClick={() => setBudget(option.value)}
                            title={option.title}
                            text={option.text}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <p className="max-w-2xl leading-7 text-[#58656c]">Add the finishing touches. These choices will be carried into your booking request automatically.</p>
                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="premium-label"><span><BedDouble className="h-4 w-4 text-[#9c7d3d]" /> Preferred room</span></p>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {["ROOM 101", "ROOM 102"].map((value) => (
                            <ChoiceButton
                              key={value}
                              active={room === value}
                              onClick={() => setRoom(value)}
                              title={value}
                              text="Uhoo's Lavish Oasis"
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="premium-label"><span><Ship className="h-4 w-4 text-[#9c7d3d]" /> Airport speedboat</span></p>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <ChoiceButton active={includeTransfer} onClick={() => setIncludeTransfer(true)} title="Arrange it" text="2 seats · USD 100" />
                          <ChoiceButton active={!includeTransfer} onClick={() => setIncludeTransfer(false)} title="Not now" text="Decide with concierge" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-7 flex gap-3 border border-[#c9b88f] bg-[#f3ead9] p-5 text-sm leading-6 text-[#58656c]">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8d7037]" />
                      Your recommendation is a planning guide. A Tripelor concierge personally verifies availability, transfers and final inclusions before payment.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-[#d0c5b0] p-5 md:px-9 md:py-6">
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0}
                  className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold uppercase tracking-[.08em] text-[#6a7477] disabled:invisible"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={nextStep} className="btn-gold">
                  {step === steps.length - 1 ? "Reveal My Trip" : "Continue"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <aside className="border border-[#d0c5b0] bg-[#f8f4ec] p-6 lg:sticky lg:top-24">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">Your preferences</p>
              <div className="mt-5 space-y-4 text-sm">
                <SummaryLine icon={CalendarDays} label="Journey" value={`${nights} nights · ${formatDate(arrival)}`} />
                <SummaryLine icon={Heart} label="Feeling" value={selectedMood} />
                <SummaryLine icon={Utensils} label="Dining" value={dining === "flexible" ? "Best match" : dining} />
                <SummaryLine icon={BedDouble} label="Stay" value={`Uhoo's · ${room}`} />
              </div>
              <div className="mt-6 border-t border-[#d0c5b0] pt-5">
                <p className="text-xs leading-6 text-[#687377]">Your answers are used only to create this recommendation. Nothing is charged or reserved at this stage.</p>
              </div>
            </aside>
          </div>
        </section>
      ) : (
        <section className="container pt-10">
          <div className="mx-auto max-w-6xl overflow-hidden border border-[#c9b88f] bg-[#fffdf8] shadow-[0_30px_100px_rgba(34,43,46,.14)]">
            <div className="grid lg:grid-cols-[1.05fr_.95fr]">
              <div className="relative min-h-[430px] overflow-hidden lg:min-h-[680px]">
                <img src={recommendation.image} alt={recommendation.name} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#031016] via-[#031016]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-10">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#ead7aa]">
                    <Crown className="h-4 w-4" /> Your Tripelor match
                  </p>
                  <h2 className="font-display mt-4 text-4xl leading-tight md:text-6xl">{recommendation.name}</h2>
                  <p className="mt-4 max-w-xl leading-7 text-white/65">{recommendation.description}</p>
                </div>
              </div>

              <div className="p-7 md:p-10">
                <p className="eyebrow text-[#8d7037]">Personally matched</p>
                <h1 className="font-display mt-3 text-4xl">Made for {selectedMood.toLowerCase()}.</h1>
                <p className="mt-4 leading-7 text-[#58656c]">
                  This is the strongest match for your {nights}-night journey, preferred dining style and package budget.
                </p>

                <div className="mt-7 grid gap-px overflow-hidden border border-[#d8cdb8] bg-[#d8cdb8] sm:grid-cols-2">
                  <ResultDetail label="Stay" value={`Uhoo's Lavish Oasis · ${room}`} />
                  <ResultDetail label="Journey" value={`${formatDate(arrival)} · ${nights} nights`} />
                  <ResultDetail label="Dining" value={recommendation.meal} />
                  <ResultDetail label="Transfer" value={includeTransfer ? "2 speedboat seats requested" : "Arrange later"} />
                </div>

                <div className="mt-7">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#778184]">Why it suits you</p>
                  <div className="mt-4 space-y-3">
                    {recommendation.highlights.map((highlight) => (
                      <p key={highlight} className="flex items-start gap-3 text-sm text-[#58656c]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7d3d]" /> {highlight}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-7 border-y border-[#d8cdb8] py-6">
                  <div className="flex justify-between gap-4 text-sm text-[#687377]"><span>Package for two</span><span>USD {recommendation.price}</span></div>
                  <div className="mt-2 flex justify-between gap-4 text-sm text-[#687377]"><span>Speedboat transfer</span><span>USD {transferTotal}</span></div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <span className="text-xs font-bold uppercase tracking-[.16em] text-[#778184]">Estimated total</span>
                    <strong className="font-display text-4xl text-[#8d7037]">USD {total}</strong>
                  </div>
                </div>

                <div className="mt-7 grid gap-3">
                  <Link href={bookingHref} className="btn-gold w-full">Continue to Private Booking <ArrowRight className="h-4 w-4" /></Link>
                  <SaveTripButton
                    itemType="package"
                    itemKey={`${recommendation.name}-${nights}-${room}-${transferSeats}`}
                    title={recommendation.name}
                    subtitle={`${nights} nights · ${room} · USD ${total}`}
                    href={bookingHref}
                  />
                  <button type="button" onClick={editPlan} className="btn-outline border-[#9c7d3d] text-[#7c622e]">Adjust My Preferences</button>
                </div>
                <p className="mt-5 text-center text-xs leading-5 text-[#778184]">No automatic charge. Final availability and inclusions are confirmed before payment.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function ChoiceButton({
  active,
  onClick,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-28 border p-4 text-left transition ${
        active ? "border-[#9c7d3d] bg-[#f3ead9]" : "border-[#d0c5b0] bg-[#fffdf8] hover:border-[#b39c6e]"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <strong className="font-display text-xl font-normal">{title}</strong>
        {active && <Check className="h-4 w-4 shrink-0 text-[#8d7037]" />}
      </span>
      <span className="mt-2 block text-xs leading-5 text-[#687377]">{text}</span>
    </button>
  );
}

function SummaryLine({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-[#ded5c5] pb-4 last:border-0 last:pb-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7d3d]" />
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#899194]">{label}</p>
        <p className="mt-1 leading-5 text-[#39484e]">{value}</p>
      </div>
    </div>
  );
}

function ResultDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f8f4ec] p-4">
      <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#899194]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}
