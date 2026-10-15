export default function TripelorMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M32 5v54M5 32h54M13 13l38 38M13 51l38-38" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}
