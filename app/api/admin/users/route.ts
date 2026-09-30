import { isAdminEmail, requireUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase admin access is not configured.");

    const users: any[] = [];
    let page = 1;
    const perPage = 200;
    let totalFromApi = 0;

    while (page <= 10) {
      const response = await fetch(
        `${url}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          cache: "no-store",
        },
      );

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!response.ok) {
        throw new Error(data?.msg || data?.message || "Unable to load users.");
      }

      const pageUsers = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data)
          ? data
          : [];

      if (page === 1) {
        totalFromApi = Number(data?.total || data?.total_count || data?.count || 0);
      }

      users.push(...pageUsers);

      const hasMoreByCount = totalFromApi > users.length;
      const hasMoreByPage =
        Number(data?.next_page || 0) > page ||
        (pageUsers.length === perPage && (!totalFromApi || hasMoreByCount));

      if (!hasMoreByPage || pageUsers.length === 0) break;
      page += 1;
    }

    const normalized = users.map((account: any) => ({
      id: account.id,
      email: account.email || "",
      fullName: account.user_metadata?.full_name || account.user_metadata?.name || "",
      confirmedAt: account.email_confirmed_at || account.confirmed_at || null,
      createdAt: account.created_at || null,
      lastSignInAt: account.last_sign_in_at || null,
      isAdmin: isAdminEmail(account.email),
    }));

    const customers = normalized.filter(account => !account.isAdmin);

    return Response.json(
      {
        users: normalized,
        customers,
        counts: {
          registeredAccounts: normalized.length,
          customers: customers.length,
          confirmedCustomers: customers.filter(account => Boolean(account.confirmedAt)).length,
          signedInCustomers: customers.filter(account => Boolean(account.lastSignInAt)).length,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in." }, { status: 401 });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load users." },
      { status: 500 },
    );
  }
}
