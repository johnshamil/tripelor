export default function GoogleSignInButton({ nextPath, label }: { nextPath: string; label: string }) {
  const href = nextPath ? `/api/auth/google?next=${encodeURIComponent(nextPath)}` : "/api/auth/google";
  return (
    <a href={href} className="flex min-h-12 w-full items-center justify-center gap-3 border border-[#c9c1b2] bg-white px-4 py-3 text-sm font-semibold text-[#243239] transition hover:border-[#8d7037] hover:bg-[#fbf9f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d7037]">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M17.64 9.2c0-.6-.05-1.05-.17-1.52H9v3.22h4.97a4.24 4.24 0 0 1-1.84 2.78v2.31h2.98c1.75-1.61 2.53-3.99 2.53-6.79Z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.2l-2.83-2.2c-.79.53-1.79.85-3.13.85-2.4 0-4.43-1.62-5.16-3.8H.93v2.37A9 9 0 0 0 9 18Z" />
        <path fill="#FBBC05" d="M3.84 10.65A5.4 5.4 0 0 1 3.56 9c0-.57.1-1.12.28-1.65V4.98H.93A9 9 0 0 0 0 9c0 1.45.35 2.82.93 4.02l2.91-2.37Z" />
        <path fill="#EA4335" d="M9 3.55c1.32 0 2.5.45 3.44 1.36l2.58-2.58A8.6 8.6 0 0 0 9 0 9 9 0 0 0 .93 4.98l2.91 2.37c.73-2.18 2.76-3.8 5.16-3.8Z" />
      </svg>
      {label}
    </a>
  );
}
