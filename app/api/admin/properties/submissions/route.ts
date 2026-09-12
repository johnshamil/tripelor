import { propertyAdmin, propertyDB, propertyError, sameOrigin, managedProperties } from "@/lib/property-store";
import { validateProperty } from "@/lib/property-model";

function reviewNote(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) throw new Error("Keep the reviewer note under 2,000 characters.");
  return value.trim();
}

async function syncInventory(previousName: string, property: { status: string; data: any }) {
  const names = Array.from(new Set([previousName, property.data?.name].filter((name): name is string => Boolean(name))));
  for (const name of names) {
    await propertyDB(`property_inventory?property_name=eq.${encodeURIComponent(name)}&active=eq.true`, { method: "PATCH", body: JSON.stringify({ active: false }) });
  }
  if (property.status !== "published") return;
  const inventory = (Array.isArray(property.data?.rooms) ? property.data.rooms : []).map((room: any) => ({
    property_name: property.data.name,
    room_type: room.name,
    total_rooms: room.totalRooms,
    active: true,
  }));
  if (inventory.length) {
    await propertyDB("property_inventory", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(inventory),
    });
  }
}

export async function GET() {
  try {
    await propertyAdmin();
    const [rows, properties] = await Promise.all([
      propertyDB("property_partner_submissions?status=eq.pending&select=*&order=created_at.desc"),
      managedProperties(),
    ]);
    const byId = new Map(properties.map((property) => [property.id, property]));
    return Response.json({
      submissions: rows.map((row: any) => ({
        ...row,
        property: byId.get(row.property_id) || null,
      })).filter((row: any) => row.property),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return propertyError(error);
  }
}

export async function POST(request: Request) {
  try {
    await propertyAdmin();
    sameOrigin(request);
    const body = await request.text();
    if (body.length > 12000) throw new Error("Review details are too large.");
    const input = JSON.parse(body);
    if (typeof input?.id !== "string" || !/^[0-9a-f-]{36}$/.test(input.id)) throw new Error("Choose a valid partner submission.");
    if (!["approve", "reject"].includes(input.action)) throw new Error("Choose approve or reject.");
    const note = reviewNote(input.reviewerNote || "");
    const submissionRows = await propertyDB(`property_partner_submissions?id=eq.${input.id}&status=eq.pending&select=*&limit=1`);
    const submission = submissionRows[0];
    if (!submission) return Response.json({ error: "That partner submission is no longer pending." }, { status: 404 });
    const properties = await managedProperties();
    const property = properties.find((item) => item.id === submission.property_id);
    if (!property) return Response.json({ error: "The assigned property no longer exists." }, { status: 404 });

    if (input.action === "reject") {
      const rows = await propertyDB(`property_partner_submissions?id=eq.${submission.id}&status=eq.pending`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected", reviewed_at: new Date().toISOString(), reviewer_note: note }),
      });
      return Response.json({ submission: rows[0] });
    }

    const expectedUpdatedAt = typeof submission.base_updated_at === "string" && submission.base_updated_at ? submission.base_updated_at : property.updated_at;
    const value = validateProperty({
      ...(submission.data && typeof submission.data === "object" ? submission.data : {}),
      slug: property.slug,
      status: property.status,
      partnerEmail: property.partnerEmail,
    });
    const savedRows = await propertyDB(`managed_properties?id=eq.${property.id}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`, {
      method: "PATCH",
      body: JSON.stringify({ ...value, slug: property.slug, status: property.status, updated_at: new Date().toISOString() }),
    });
    if (!savedRows.length) return Response.json({ error: "The property changed while this submission was waiting. Reload it and ask the partner to submit again." }, { status: 409 });
    const saved = savedRows[0];
    await syncInventory(property.name, saved);
    const reviewedRows = await propertyDB(`property_partner_submissions?id=eq.${submission.id}&status=eq.pending`, {
      method: "PATCH",
      body: JSON.stringify({ status: "approved", reviewed_at: new Date().toISOString(), reviewer_note: note }),
    });
    return Response.json({
      submission: reviewedRows[0],
      property: { ...saved.data, id: saved.id, slug: saved.slug, status: saved.status, updated_at: saved.updated_at },
    });
  } catch (error) {
    return propertyError(error);
  }
}
