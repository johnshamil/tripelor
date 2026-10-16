import TripelorEmblem from "@/components/tripelor-emblem";

export default function TripelorWordmark() {
  return <span className="tripelor-wordmark">
    <TripelorEmblem className="tripelor-wordmark-emblem" />
    <span className="tripelor-wordmark-copy">
      <span className="tripelor-wordmark-name">TRIPELOR</span>
      <span className="tripelor-wordmark-tagline">The Art of Exploring</span>
    </span>
  </span>;
}
