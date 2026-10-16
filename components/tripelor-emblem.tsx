export default function TripelorEmblem({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <img
      src="/brand/tripelor-globe-gold.webp"
      alt=""
      aria-hidden="true"
      width={320}
      height={320}
      decoding="async"
      className={className}
    />
  );
}
