const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const ts = require('typescript');
function moduleFor(path, deps = {}) {
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports','fetch',js)(name=>{if(name==='node:crypto')return crypto;if(name in deps)return deps[name];throw Error('Unexpected import: '+name)},module,module.exports,fetchMock);
  return module.exports;
}
const packages=moduleFor('lib/island-packages.ts');
const escape=moduleFor('lib/vaavu-blue-escape.ts');
const excursions=moduleFor('lib/vaavu-excursions.ts');
const cart=moduleFor('lib/trip-cart.ts',{'./island-packages':packages,'./vaavu-blue-escape':escape,'./vaavu-excursions':excursions});
const date='2090-02-27';
const line=(productId,quantity=1)=>({productId,quantity,date});
const mixed=[line('package:vaavu-blue-escape',2),line('excursion:night-fishing',2),line('stay:reef-relax-escape:3')];
let quote=cart.quoteCart(mixed,'2026-09-17');
assert.equal(quote.total,780); // 2×100 + 2×15 + 550, stay total is not multiplied by nights.
assert.equal(quote.items[2].checkOut,'2090-03-02');
assert.equal(cart.CART_PRODUCTS.length,21);
assert.equal(new Set(cart.CART_PRODUCTS.map(p=>p.id)).size,21);
assert.equal(cart.quoteCart([{...mixed[0],price:1,name:'Tampered',lineTotal:1}]).total,200);
assert.equal(cart.maldivesToday(new Date('2026-09-17T20:30:00Z')),'2026-09-18');
for(const bad of [[],[line('unknown')],[mixed[0],mixed[0]],[line(mixed[0].productId,0)],[line(mixed[0].productId,1.5)],[line(mixed[0].productId,101)],[{...mixed[0],date:'2026-02-30'}],[{...mixed[0],date:'2020-01-01'}]]) assert.throws(()=>cart.quoteCart(bad));
assert.deepEqual(cart.cleanStoredCart([mixed[0],mixed[0],line('unknown'),{...mixed[1],date:'bad'}]),[mixed[0],{...mixed[1],date:''}]);
assert.deepEqual(cart.cleanStoredCart({items:mixed}),[]);
let rows=[],emailCalls=0,failEmail=false,failDB=false,user=null,admin=false,race=false;
const emailKeys=new Set();
async function fetchMock(url,init={}) {
  if(url==='https://api.resend.com/emails'){
    emailCalls++;const key=init.headers['Idempotency-Key'];emailKeys.add(key);
    assert.ok(key.startsWith('cart-booking/'));
    return Response.json({}, {status:failEmail?503:200});
  }
  assert.ok(url.startsWith('https://db.test/rest/v1/cart_booking_requests'));
  if(failDB)throw Error('Simulated network failure');
  assert.equal(init.headers.Authorization,'Bearer test-service-key');
  const params=new URL(url).searchParams;
  let matches=rows.filter(row=>[...params].every(([key,value])=>['select','order','offset','limit'].includes(key)||String(row[key])===value.slice(3)));
  if(init.method==='POST') {
    const payload=JSON.parse(init.body);
    if(rows.some(r=>r.user_id===payload.user_id&&r.submission_id===payload.submission_id)) return Response.json({}, {status:409});
    const row={...payload,id:crypto.randomUUID(),created_at:new Date().toISOString(),notification_sent_at:null};
    rows.push(row);matches=[row];
    if(race){race=false;return Response.json({}, {status:409});}
  } else if(init.method==='PATCH') matches.forEach(row=>Object.assign(row,JSON.parse(init.body)));
  const offset=Number(params.get('offset')||0),limit=Number(params.get('limit')||1000);
  return Response.json(matches.slice(offset,offset+limit));
}
process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-key';process.env.RESEND_API_KEY='test-email-key';
const server=moduleFor('lib/cart-booking-server.ts',{'@/lib/trip-cart':cart});
const auth={requireUser:async()=>{if(!user)throw Error('UNAUTHORIZED');return user},isAdminEmail:()=>admin};
const deps={'@/lib/auth-server':auth,'@/lib/cart-booking-server':server};
const api=moduleFor('app/api/cart-booking/route.ts',deps),adminApi=moduleFor('app/api/admin/cart-bookings/route.ts',deps);
const guest={id:crypto.randomUUID(),email:'guest@example.test'};
const payload=()=>({items:mixed,guestName:'Test Guest',phone:'+9601234567',notes:'Test only',expectedTotal:780,submissionId:crypto.randomUUID()});
async function request(handler,method,body,options={}) {
  const response=await handler[method](new Request('https://www.tripelor.com/api/cart-booking'+(options.query||''),{method,headers:{origin:options.origin||'https://www.tripelor.com','content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})}));
  return {status:response.status,body:await response.json(),headers:response.headers};
}
(async()=>{
 assert.equal((await request(api,'POST',payload())).status,401);
 assert.equal(rows.length,0);
 user=guest;
 assert.equal((await request(api,'POST',payload(),{origin:'https://evil.test'})).status,403);
 assert.equal((await request(adminApi,'GET')).status,403);
 assert.equal((await request(api,'POST',{...payload(),expectedTotal:1})).status,409);
 assert.equal((await request(api,'POST',{...payload(),phone:'invalid number'})).status,400);
 assert.equal(rows.length,0);
 const body={...payload(),user_id:'attacker',guestEmail:'spoof@example.test'};
 let r=await request(api,'POST',body);assert.equal(r.status,200);assert.equal(r.body.total,780);
 assert.equal(rows.length,1);assert.equal(rows[0].user_id,guest.id);assert.equal(rows[0].guest_email,guest.email);assert.equal(rows[0].status,'pending');
 assert.equal(rows[0].items[0].unitPrice,15);assert.equal(rows[0].items[2].unitPrice,550);
 const ref=r.body.bookingReference;assert.match(ref,/^TRIP-/);assert.equal(emailCalls,1);
 r=await request(api,'POST',body);assert.equal(r.body.bookingReference,ref);assert.equal(rows.length,1);assert.equal(emailCalls,1);
 r=await request(api,'POST',{...body,notes:'Changed'});assert.equal(r.status,409);assert.equal(rows.length,1);
 r=await request(api,'GET');assert.equal(r.body.requests.length,1);assert.equal(r.body.requests[0].request_hash,undefined);assert.equal(r.headers.get('cache-control'),'no-store');
 user={id:crypto.randomUUID(),email:'other@example.test'};assert.equal((await request(api,'GET')).body.requests.length,0);
 user=guest;admin=true;assert.equal((await request(adminApi,'GET')).body.requests.length,1);admin=false;
 failEmail=true;r=await request(api,'POST',payload());assert.equal(r.status,200);assert.equal(rows.length,2);assert.equal(rows[1].notification_sent_at,null);failEmail=false;
 race=true;r=await request(api,'POST',payload());assert.equal(r.status,200);assert.equal(rows.length,3);
 failDB=true;r=await request(api,'POST',payload());assert.equal(r.status,500);assert.equal(rows.length,3);failDB=false;
 assert.equal((await request(api,'GET',null,{query:'?offset=-1'})).status,400);
 console.log('PASS: mixed per-person/per-couple pricing, dates, invalid cart recovery, server price verification, auth, CSRF, customer isolation, admin-only history, duplicate/retry protection, email failure recovery and DB failure handling. No live services called.');
})().catch(error=>{console.error(error);process.exit(1)});
