import { propertyAdmin, propertyDB, propertyError, sameOrigin, managedProperties } from "@/lib/property-store";
import { validateProperty } from "@/lib/property-model";
export async function GET(){try{await propertyAdmin();return Response.json({properties:await managedProperties()},{headers:{"Cache-Control":"no-store"}});}catch(e){return propertyError(e);}}
export async function POST(r:Request){try{await propertyAdmin();sameOrigin(r);const body=await r.text();if(body.length>150000)throw new Error("Property details are too large.");const input=JSON.parse(body), value=validateProperty(input);let rows;
if(input.id){if(!/^[0-9a-f-]{36}$/.test(input.id)||typeof input.updated_at!=="string")throw new Error("Invalid property version."); rows=await propertyDB(`managed_properties?id=eq.${input.id}&updated_at=eq.${encodeURIComponent(input.updated_at)}`,{method:"PATCH",body:JSON.stringify({...value,updated_at:new Date().toISOString()})}); if(!rows.length)return Response.json({error:"This property changed in another session. Reload before saving."},{status:409});}
else rows=await propertyDB("managed_properties",{method:"POST",body:JSON.stringify(value)});
const saved=rows[0];
if(input.status==="published"){
  await propertyDB(`property_inventory?property_name=eq.${encodeURIComponent(saved.data.name)}&active=eq.true`,{method:"PATCH",body:JSON.stringify({active:false})});
  const inventory=saved.data.rooms.map((room:any)=>({property_name:saved.data.name,room_type:room.name,total_rooms:room.totalRooms,active:true}));
  if(inventory.length) await propertyDB("property_inventory",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(inventory)});
} else await propertyDB(`property_inventory?property_name=eq.${encodeURIComponent(saved.data.name)}&active=eq.true`,{method:"PATCH",body:JSON.stringify({active:false})});
return Response.json({property:{...saved.data,id:saved.id,slug:saved.slug,status:saved.status,updated_at:saved.updated_at}});
}catch(e){return propertyError(e);}}
