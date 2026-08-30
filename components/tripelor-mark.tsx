export default function TripelorMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="57" height="57" rx="13.5" stroke="currentColor" strokeOpacity=".52" />
      <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19.5 20.5h25v5h-9.4v15.9L32 47l-3.1-5.6V25.5h-9.4v-5Z"
        fill="currentColor"
      />
      <path d="M32 10.5 34.2 15 32 19.5 29.8 15 32 10.5Z" fill="currentColor" />
    </svg>
  );
}
