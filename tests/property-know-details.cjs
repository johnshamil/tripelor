const assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const fs = require("node:fs");
const source=stripTypeScriptTypes(fs.readFileSync(process.argv[2] || "lib/property-model.ts","utf8")).replace(/^export /gm,"");
const {normalizePropertyKnowDetails,validateProperty,publicProperty,propertyKnowFields}=new Function(source+";return {normalizePropertyKnowDetails,validateProperty,publicProperty,propertyKnowFields}")();
const blank=normalizePropertyKnowDetails(undefined);
assert.equal(Object.keys(blank).length,7);
assert.ok(Object.values(blank).every(v=>v===""));
assert.deepEqual(normalizePropertyKnowDetails(null),blank);
for(const {key} of propertyKnowFields){
  assert.equal(normalizePropertyKnowDetails({[key]:"  Confirmed detail  "})[key],"Confirmed detail");
  assert.throws(()=>normalizePropertyKnowDetails({[key]:false}));
  assert.throws(()=>normalizePropertyKnowDetails({[key]:"x".repeat(2001)}));
}
assert.throws(()=>normalizePropertyKnowDetails([]));
const base={name:"Example",slug:"example",status:"draft",island:"",description:"",photos:[],rooms:[],seasonalRates:[],inventoryRules:[],amenities:"",taxes:"",transfers:"",cancellation:"",payment:"",partnerName:"Private manager",partnerEmail:"private@example.com",partnerPhone:"private"};
const values=Object.fromEntries(propertyKnowFields.map(({key})=>[key,key+" details"]));
const saved=validateProperty({...base,knowBeforeBooking:{...values,secret:"private"}});
const output=publicProperty({...saved.data,id:"id",slug:"example",status:"draft",updated_at:""});
assert.deepEqual(output.knowBeforeBooking,values);
assert.equal(JSON.stringify(output).includes("private"),false);
assert.deepEqual(validateProperty(base).data.knowBeforeBooking,blank);
assert.deepEqual(validateProperty({...base,knowBeforeBooking:{beach:" "}}).data.knowBeforeBooking,blank);
console.log("PASS: all seven fields validate, trim, save and expose only allowed data; legacy properties and cleared details remain unknown.");
