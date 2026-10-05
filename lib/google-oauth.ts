export const GOOGLE_VERIFIER_COOKIE = "tripelor_google_verifier";
export const GOOGLE_NEXT_COOKIE = "tripelor_google_next";

export const googleFlowCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 10,
};

export function customerDestination(value: string | null | undefined) {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) {
    return "/account";
  }
  if (["/partner", "/admin", "/api"].some((prefix) => value === prefix || value.startsWith(`${prefix}/`))) {
    return "/account";
  }
  return value;
}
