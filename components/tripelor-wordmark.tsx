import TripelorMark from "@/components/tripelor-mark";

export default function TripelorWordmark({ tagline = "Maldives, made personal", light = false }: { tagline?: string; light?: boolean }) {
  return <span className={`tripelor-wordmark${light ? " is-light" : ""}`}>
    <span className="tripelor-wordmark-name">tripelor<TripelorMark className="tripelor-wordmark-star" /></span>
    <span className="tripelor-wordmark-tagline">{tagline}</span>
  </span>;
}
