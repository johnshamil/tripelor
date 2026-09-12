import { propertyAdmin, propertyDB, propertyError, sameOrigin, managedProperties, ensureLegacyProperties } from "@/lib/property-store";
import { validateProperty } from "@/lib/property-model";

export async function GET() {
  try {
    await propertyAdmin();
    await ensureLegacyProperties();
    return Response.json({ properties: await managedProperties() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return propertyError(e);
  }
}

export async function POST(r: Request) {
  try {
    await propertyAdmin();
    sameOrigin(r);
    const body = await r.text();
    if (body.length > 150000) throw new Error("Property details are too large.");

    const input = JSON.parse(body);
    const value = validateProperty(input);
    let rows: any[];

    if (input.id) {
      if (!/^[0-9a-f-]{36}$/.test(input.id) || typeof input.updated_at !== "string") {
        throw new Error("Invalid property version.");
      }

      // Compare timestamps as instants before updating by id. Supabase can return
      // equivalent timestamps with different ISO formatting (for example, +00:00
      // versus Z), which previously caused a false conflict.
      const currentRows = await propertyDB(
        `managed_properties?id=eq.${input.id}&select=id,updated_at&limit=1`,
      ) as Array<{ id: string; updated_at: string }>;
      if (!currentRows.length) {
        throw new Error("That property could not be found. Reload the property list and try again.");
      }

      const submittedTime = Date.parse(input.updated_at);
      const currentTime = Date.parse(currentRows[0].updated_at);
      if (!Number.isFinite(submittedTime) || !Number.isFinite(currentTime) || submittedTime !== currentTime) {
        return Response.json(
          { error: "This property was updated in another session. Reload it before saving your changes." },
          { status: 409 },
        );
      }

      rows = await propertyDB(`managed_properties?id=eq.${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...value, updated_at: new Date().toISOString() }),
      }) as any[];
    } else {
      rows = await propertyDB("managed_properties", {
        method: "POST",
        body: JSON.stringify(value),
      }) as any[];
    }

    const saved = rows[0];
    if (input.status === "published") {
      await propertyDB(
        `property_inventory?property_name=eq.${encodeURIComponent(saved.data.name)}&active=eq.true`,
        { method: "PATCH", body: JSON.stringify({ active: false }) },
      );
      const inventory = saved.data.rooms.map((room: any) => ({
        property_name: saved.data.name,
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
    } else {
      await propertyDB(
        `property_inventory?property_name=eq.${encodeURIComponent(saved.data.name)}&active=eq.true`,
        { method: "PATCH", body: JSON.stringify({ active: false }) },
      );
    }

    return Response.json({
      property: {
        ...saved.data,
        id: saved.id,
        slug: saved.slug,
        status: saved.status,
        updated_at: saved.updated_at,
      },
    });
  } catch (e) {
    return propertyError(e);
  }
}
