const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {stripTypeScriptTypes}=require("node:module");
function source(file){return stripTypeScriptTypes(fs.readFileSync(file,"utf8").replace(/^import .*;\n/gm,""),{mode:"transform"}).replace(/^export /gm,"");}
const model=new Function(source(path.join(__dirname,"../lib/property-model.ts"))+";return {validateProperty,publicProperty};")();
const engine=new Function(source(path.join(__dirname,"../lib/wishlist.ts"))+";return {tagKey,wishlistMatches,wishlistCatalog};")();
assert.equal(engine.tagKey(" Quiet   BEACH "),"quiet beach");
const draft={name:"Test stay",slug:"test-stay",status:"draft",island:"Test island",description:"Test",photos:[],rooms:[],seasonalRates:[],inventoryRules:[],amenities:"",taxes:"",transfers:"",cancellation:"",payment:"",partnerName:"",partnerEmail:"",partnerPhone:""};
assert.deepEqual(model.validateProperty(draft).data.wishlistTags,[]);
const tagged=model.validateProperty({...draft,wishlistTags:[" Quiet beach ","quiet BEACH","Local food"]});
assert.deepEqual(tagged.data.wishlistTags.map(engine.tagKey),["quiet beach","local food"]);
assert.throws(()=>model.validateProperty({...draft,wishlistTags:["x".repeat(41)]}));
assert.throws(()=>model.validateProperty({...draft,wishlistTags:Array(13).fill("Tag")}));
assert.throws(()=>model.validateProperty({...draft,wishlistTags:"not-an-array"}));
const pub={...tagged.data,id:"test",slug:"test-stay",status:"published",updated_at:"now",experiences:[
{id:"visible",name:"Ocean",enabled:true,wishlistTags:["Watch dolphins"],photos:[]},
{id:"hidden",name:"Hidden",enabled:false,wishlistTags:["Private test tag"],photos:[]}]};
const safe=model.publicProperty(pub);
assert.equal(safe.experiences.length,1);
assert.deepEqual(safe.experiences[0].wishlistTags,["Watch dolphins"]);
assert.equal("partnerEmail" in safe,false);
const catalog=engine.wishlistCatalog([pub,{...pub,status:"draft",wishlistTags:["Draft-only"]}]);
assert.equal(catalog.includes("Private test tag"),false);
assert.equal(catalog.includes("Draft-only"),false);
let result=engine.wishlistMatches([pub,{...pub,slug:"draft",status:"draft"}],["quiet BEACH","Watch dolphins","Visit a sandbank"]);
assert.equal(result.length,1);assert.equal(result[0].tags.length,2);assert.equal(result[0].activities.length,1);assert.equal(result[0].direct.length,1);
assert.equal(engine.wishlistMatches([pub],["Private test tag"]).length,0);
assert.equal(engine.wishlistMatches([pub],[]).length,0);
console.log("PASS: legacy compatibility, tag normalization/limits, public serialization, draft and hidden exclusion, partial matches and missing matches.");
