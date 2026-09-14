const fs=require("node:fs");
const {stripTypeScriptTypes}=require("node:module");
const {randomBytes,createHash}=require("node:crypto");
const assert=require("node:assert/strict");
function source(path){return stripTypeScriptTypes(fs.readFileSync(path,"utf8").replace(/^import .*;\n/gm,""),{mode:"transform"}).replace(/^export /gm,"");}
const model=new Function(source(require("node:path").join(__dirname,"../lib/couple-match.ts"))+";return {buildCoupleMatch,validateCouplePreferences,momentKey};")();
const property={status:"published",slug:"test",name:"Test Stay",island:"Test Island",photos:[],rooms:[{name:"Double",capacity:2,sellingRate:100,mealPlan:"Bed & Breakfast"},{name:"Single",capacity:1,sellingRate:50,mealPlan:"BB"}],experiences:[{id:"moment",enabled:true,name:"Test Activity",price:25,priceUnit:"per person"}]};
const properties=[property,{...property,slug:"hidden",status:"draft"}];
const pref={pace:"relax",setting:"quiet",meal:"BB",budget:150,moment:model.momentKey("test","moment")};
assert.equal(model.buildCoupleMatch(pref,pref,properties).candidates.length,1);
assert.equal(model.buildCoupleMatch({...pref,budget:80},pref,properties).candidates.length,0);
assert.equal(model.buildCoupleMatch(pref,pref,properties).moments[0].name,"Test Activity");
assert.throws(()=>model.validateCouplePreferences({...pref,budget:-1},properties));
assert.throws(()=>model.validateCouplePreferences({...pref,moment:"missing"},properties));
const A="11111111-1111-4111-8111-111111111111",B="22222222-2222-4222-8222-222222222222",C="33333333-3333-4333-8333-333333333333";
let actor=A,rows=[],counter=0;
const mockFetch=async(url,init={})=>{
  const q=new URL(url).searchParams;
  let found=rows.filter(r=>(!q.has("id")||q.get("id")==="eq."+r.id)&&(!q.has("version")||q.get("version")==="eq."+r.version)&&(!q.has("owner_id")||q.get("owner_id")==="eq."+r.owner_id)&&(!q.has("expires_at")||Date.parse(r.expires_at)>Date.parse(q.get("expires_at").slice(3))));
  let result;
  if(init.method==="POST"){const row={id:"aaaaaaaa-aaaa-4aaa-8aaa-"+String(++counter).padStart(12,"0"),partner_id:null,version:0,owner_preferences:null,partner_preferences:null,choice:null,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString(),...JSON.parse(init.body)};rows.push(row);result=[row];}
  else if(init.method==="PATCH"){const patch=JSON.parse(init.body);result=found.map(r=>Object.assign(r,patch));}
  else if(init.method==="DELETE"){result=found;rows=rows.filter(r=>!found.includes(r));}
  else result=found;
  return Response.json(result);
};
const api=new Function("requireUser","publishedProperties","propertyConfig","buildCoupleMatch","validateCouplePreferences","createHash","randomBytes","fetch",source(require("node:path").join(__dirname,"../app/api/couple-match/route.ts"))+";return {GET,POST};")(
  async()=>{if(!actor)throw new Error("UNAUTHORIZED");return {id:actor};},async()=>properties.filter(p=>p.status==="published"),()=>({url:"https://db.test",key:"test"}),model.buildCoupleMatch,model.validateCouplePreferences,createHash,randomBytes,mockFetch);
const post=async(body,origin="https://tripelor.test")=>{const r=await api.POST(new Request("https://tripelor.test/api/couple-match",{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(body)}));return {status:r.status,data:await r.json()};};
const get=async(id)=>{const r=await api.GET(new Request("https://tripelor.test/api/couple-match?id="+id));return {status:r.status,data:await r.json()};};
(async()=>{
  assert.equal((await post({action:"start"},"https://other.test")).status,403);
  const start=await post({action:"start"});assert.equal(start.status,200);
  const id=start.data.id,invite=start.data.invite;
  let r=await post({action:"preferences",id,version:0,preferences:pref});assert.equal(r.status,200);
  actor=C;assert.equal((await get(id)).status,403);
  actor=B;assert.equal((await post({action:"join",id,invite:"0".repeat(64)})).status,403);
  r=await post({action:"join",id,invite});assert.equal(r.status,200);assert.equal(r.data.own,null);assert.equal(r.data.result,null);assert.equal("owner_preferences" in r.data,false);assert.equal("invite_hash" in r.data,false);
  const version=r.data.version;
  r=await post({action:"preferences",id,version,preferences:{...pref,budget:120}});assert.equal(r.status,200);assert.equal(r.data.result.candidates.length,1);
  assert.equal(r.data.result.candidates[0].rate,100);
  actor=A;const view=await get(id);assert.equal(view.data.own.budget,150);assert.equal(JSON.stringify(view.data).includes('"budget":120'),false);
  assert.equal((await post({action:"choose",id,version:0,choice:view.data.result.candidates[0].key})).status,409);
  actor=C;assert.equal((await post({action:"join",id,invite})).status,403);
  actor=null;assert.equal((await get(id)).status,401);
  actor=A;rows[0].expires_at="2020-01-01T00:00:00Z";assert.equal((await get(id)).status,404);
  console.log("PASS: matching, budget/capacity filters, input validation, origin, authentication, membership, one-time invite, private response, stale edits and expiry.");
})().catch(e=>{console.error(e);process.exit(1);});
