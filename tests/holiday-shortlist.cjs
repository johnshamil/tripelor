const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {stripTypeScriptTypes}=require('node:module');
const compile=path=>stripTypeScriptTypes(fs.readFileSync(path,'utf8'),{mode:'transform'}).replace(/^import .*?;\n/gm,'').replace(/^export /gm,'');
const model=new Function(compile('lib/holiday-shortlist.ts')+';return {shortlistSlugs,shortlistVote,shortlistText,shortlistQuote}')();
let properties=[{slug:'stay-one',status:'published',name:'One',island:'Island'},{slug:'stay-two',status:'published',name:'Two',island:'Island'},{slug:'draft',status:'draft'}];
assert.throws(()=>model.shortlistSlugs(['draft'],properties));
assert.throws(()=>model.shortlistSlugs(['stay-one','stay-one'],properties));
assert.throws(()=>model.shortlistSlugs([],properties));
assert.throws(()=>model.shortlistSlugs(['1','2','3','4'],properties));
assert.throws(()=>model.shortlistVote({slug:'stay-one',choice:'question',question:' '},['stay-one']));
assert.throws(()=>model.shortlistVote({slug:'not-selected',choice:'favourite'},['stay-one']));
assert.equal(model.shortlistVote({slug:'stay-one',choice:'happy',question:'discard'},['stay-one']).question,'');
let rows=[],forceConflict=false,dbCalls=0;
async function fetchMock(url,init){
  dbCalls++;
  const params=new URL(url).searchParams;
  let matches=rows.filter(row=>[...params].every(([k,v])=>{
    if(['select','limit'].includes(k))return true;
    if(k==='or'){return v.slice(1,-1).split(',').some(c=>{const [field,op,value]=c.split('.');return row[field]===value;});}
    const [op,...rest]=v.split('.');const val=rest.join('.');
    return op==='eq'?String(row[k])===val:op==='gt'?row[k]>val:true;
  }));
  if(init.method==='POST'){
    const row={...JSON.parse(init.body),id:crypto.randomUUID(),created_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString(),participants:[],version:1,closed:false};rows.push(row);matches=[row];
  }else if(init.method==='PATCH'){
    if(forceConflict){forceConflict=false;matches=[];}
    else matches.forEach(row=>Object.assign(row,JSON.parse(init.body)));
  }
  return Response.json(JSON.parse(JSON.stringify(matches.slice(0,Number(params.get('limit')||999)))));
}
const api=new Function('createHash','createHmac','randomBytes','propertyConfig','publishedProperties','shortlistSlugs','shortlistText','shortlistVote','fetch',compile('app/api/holiday-shortlist/route.ts')+';return {POST}')(crypto.createHash,crypto.createHmac,crypto.randomBytes,()=>({url:'https://database.test',key:'server-secret'}),async()=>properties.filter(p=>p.status==='published'),model.shortlistSlugs,model.shortlistText,model.shortlistVote,fetchMock);
const request=async(body,cookie='',origin='https://tripelor.com')=>{
  const res=await api.POST(new Request('https://tripelor.com/api/holiday-shortlist',{method:'POST',headers:{origin,cookie,'content-type':'application/json','x-forwarded-for':'203.0.113.1'},body:JSON.stringify(body)}));
  return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0],headers:res.headers};
};
(async()=>{
  let r=await request({action:'start',title:'Holiday',slugs:['stay-one']},'','https://evil.test');assert.equal(r.status,403);assert.equal(dbCalls,0);
  r=await request({action:'start',title:'Holiday',slugs:['stay-one','stay-two']});assert.equal(r.status,200);
  const owner=r.cookie, token=r.body.token;
  assert.equal(r.body.isOwner,true);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);assert.match(r.headers.get('set-cookie'),/Secure/);
  assert.equal(rows[0].share_hash,crypto.createHash('sha256').update(token).digest('hex'));
  assert.equal(JSON.stringify(r.body).includes('owner_hash'),false);assert.equal(JSON.stringify(r.body).includes('network_hash'),false);
  r=await request({action:'read',token});assert.equal(r.status,200);assert.equal(r.body.isOwner,false);const guest=r.cookie;
  assert.equal((await request({action:'read',token:'f'.repeat(64)},guest)).status,404);
  assert.equal((await request({action:'close',token,version:1},guest)).status,403);
  r=await request({action:'vote',token,version:1,slug:'stay-one',choice:'favourite',name:'Alex'},owner);assert.equal(r.status,200);assert.equal(r.body.mine.votes[0].choice,'favourite');
  assert.equal((await request({action:'vote',token,version:1,slug:'stay-one',choice:'happy',name:'Sam'},guest)).status,409);
  r=await request({action:'vote',token,version:2,slug:'stay-one',choice:'question',question:'Cot available?',name:'Sam'},guest);assert.equal(r.status,200);assert.equal(r.body.people.length,2);assert.equal(r.body.mine.name,'Sam');assert.equal(JSON.stringify(r.body).includes('"key"'),false);
  r=await request({action:'vote',token,version:3,slug:'stay-one',choice:'happy',name:'Sam'},guest);assert.equal(r.body.people.length,2);assert.equal(r.body.mine.votes[0].question,'');
  const quote=model.shortlistQuote(r.body,['stay-one']);assert.ok(quote.includes('One'));assert.ok(!quote.includes('Two —'));assert.ok(!quote.includes('draft'));
  forceConflict=true;assert.equal((await request({action:'vote',token,version:4,slug:'stay-two',choice:'happy',name:'Sam'},guest)).status,409);
  r=await request({action:'clear',token,version:4,slug:'stay-one',name:'Sam'},guest);assert.equal(r.body.people.length,1);assert.equal(r.body.mine,null);
  properties=properties.filter(p=>p.slug!=='stay-two');r=await request({action:'read',token},owner);assert.equal(r.body.properties.length,1);
  rows[0].expires_at=new Date(Date.now()-1000).toISOString();assert.equal((await request({action:'read',token},owner)).status,404);rows[0].expires_at=new Date(Date.now()+86400000).toISOString();
  r=await request({action:'close',token,version:5},owner);assert.equal(r.body.closed,true);assert.equal(rows[0].participants.length,0);assert.equal((await request({action:'read',token},guest)).status,404);
  rows=Array.from({length:10},()=>({...rows[0],created_at:new Date().toISOString()}));assert.equal((await request({action:'start',title:'Again',slugs:['stay-one']},owner)).status,429);
  console.log('PASS: no-login creation, cookie ownership, CSRF, bearer validation, separate editable votes, CAS conflicts, removal, unpublished filtering, expiry, creator close and creation limits.');
})().catch(e=>{console.error(e);process.exit(1);});
