export async function DELETE(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = request.headers.get("authorization");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Account deletion is not configured." }, { status: 500 });
  }
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "You must be signed in to delete this account." }, { status: 401 });
  }

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: authorization,
      },
      cache: "no-store",
    });
    if (!userResponse.ok) {
      return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    }

    const user = await userResponse.json() as { id?: string };
    if (!user.id) {
      return Response.json({ error: "Unable to identify this account." }, { status: 401 });
    }

    const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });

    if (!deleteResponse.ok) {
      const result = await deleteResponse.json().catch(() => ({})) as { message?: string; error?: string };
      return Response.json(
        { error: result.message || result.error || "Unable to delete the account." },
        { status: deleteResponse.status },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Account deletion error", error);
    return Response.json({ error: "Unable to delete the account right now." }, { status: 500 });
  }
}
