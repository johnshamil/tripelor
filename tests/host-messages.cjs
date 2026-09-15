const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const crypto=require('node:crypto');
const compile=path=>stripTypeScriptTypes(fs.readFileSync(path,'utf8'),{mode:'transform'}).replace(/^import .*?;\n/gm,'').replace(/^export /gm,'');
const moduleFor=(path,deps,names)=>new Function(...Object.keys(deps),compile(path)+';return {'+names.join(',')+'}')( ...Object.values(deps));
const model=moduleFor('lib/property-model.ts',{},['normalizePropertyHost','publicProperty','validateProperty']);
const common=moduleFor('lib/host-questions.ts',{},['hostMediaUrl','hostTopics','validHostId','hostText','validateHostQuestion','validateHostReply','customerHostQuestion']);
const id=crypto.randomUUID(),otherId=crypto.randomUUID(),propertyId=crypto.randomUUID(),questionId=crypto.randomUUID();
const publicAudio='profiles/'+crypto.randomUUID()+'.mp3',publicPhoto='profiles/'+crypto.randomUUID()+'.jpg';
const host={enabled:true,name:'Island Host',introduction:'A real introduction',photo:publicPhoto,audio:publicAudio,transcript:'Spoken words'};
assert.equal(model.normalizePropertyHost(undefined).enabled,false);
assert.throws(()=>model.normalizePropertyHost({...host,photo:'https://external.test/private'}));
assert.throws(()=>model.normalizePropertyHost({...host,audio:'replies/'+questionId+'/'+crypto.randomUUID()+'.mp3'}));
const property={id:propertyId,slug:'sample-stay',status:'published',name:'Sample Stay',island:'Island',description:'Sample',photos:[crypto.randomUUID()+'.jpg'],rooms:[{name:'Room',capacity:2,totalRooms:1,amenities:'',mealPlan:'BB',sellingRate:70,contractedRate:50,photos:[],bathroomPhotos:[]}],seasonalRates:[],inventoryRules:[],amenities:'',taxes:'Ask',transfers:'Ask',cancellation:'Ask',payment:'Ask',partnerName:'Private partner',partnerPhone:'Private',partnerEmail:'private@example.com',host};
assert.throws(()=>model.validateProperty({...property,host:{...host,transcript:''}}));
assert.equal(model.validateProperty({...property,host:{...host,enabled:false,transcript:''}}).data.host.enabled,false);
const safe=model.publicProperty({...property,host:{...host,secret:'never-public'}});assert.equal(safe.host.secret,undefined);assert.equal(safe.partnerEmail,undefined);
assert.equal(model.publicProperty({...property,host:{...host,enabled:false}}).host,undefined);
assert.throws(()=>common.validateHostQuestion({propertyId,topic:'Room',question:''}));
assert.throws(()=>common.validateHostReply({name:'Host',text:'',audio:publicAudio,transcript:'Words'},questionId,true));
assert.throws(()=>common.validateHostReply({name:'Host',text:'',audio:'replies/'+questionId+'/'+crypto.randomUUID()+'.mp3',transcript:''},questionId,true));
let user={id,email:'guest@example.test',user_metadata:{full_name:'Test Guest'}},admin=false,propertyEnabled=true,conflict=false,stored=[];
const auth={requireUser:async()=>{if(!user)throw new Error('UNAUTHORIZED');return user;},currentUser:async()=>user,isAdminEmail:()=>admin};
const store={propertyConfig:()=>({url:'https://storage.test',key:'server-secret'}),propertyAdmin:async()=>{if(!user)throw new Error('UNAUTHORIZED');if(!admin)throw new Error('FORBIDDEN');return user;},propertyDB:async query=>{
  if(query.includes('data->host'))return propertyEnabled&&query.includes(encodeURIComponent(publicAudio))?[{id:propertyId}]:[];
  return propertyEnabled?[{id:propertyId,slug:'sample-stay',data:{name:'Sample Stay',host:{enabled:true}}}]:[];
}};
let signed=0;
async function fetchMock(url,init){
  if(url.includes('/storage/v1/')){signed++;return Response.json(url.includes('/upload/sign/')?{url:'/object/upload/sign/host-media/file?token=test'}:{signedURL:'/object/sign/host-media/file?token=test'});}
  const params=new URL(url).searchParams;
  let matches=stored.filter(row=>[...params].every(([key,v])=>{
    if(['order','limit','offset','select'].includes(key))return true;
    const [op,...values]=v.split('.'),value=values.join('.');
    return op==='eq'?String(row[key])===value:op==='gt'?row[key]>value:op==='is'?row[key]===null:op==='not'?row[key]!==null:true;
  }));
  if(init.method==='POST'){
    const row={id:questionId,created_at:new Date().toISOString(),version:1,replied_at:null,reply_name:'',reply_text:'',reply_audio:'',reply_transcript:'',draft_name:'',draft_text:'',draft_audio:'',draft_transcript:'',...JSON.parse(init.body)};stored.push(row);matches=[row];
  }else if(init.method==='PATCH'){
    if(conflict){conflict=false;matches=[];}else matches.forEach(row=>Object.assign(row,JSON.parse(init.body)));
  }
  const offset=Number(params.get('offset')||0),limit=Number(params.get('limit')||1000);
  return Response.json(JSON.parse(JSON.stringify(matches.slice(offset,offset+limit))));
}
const server=moduleFor('lib/host-question-server.ts',{...store,fetch:fetchMock},['HostProblem','hostBody','hostDB','hostError','hostResponse','validateHostInput','hostStorage','hostSignedUrl']);
const deps={...auth,...store,...common,...server};
const guestApi=moduleFor('app/api/host-questions/route.ts',deps,['GET','POST']);
const adminApi=moduleFor('app/api/admin/host-questions/route.ts',deps,['GET','POST']);
const mediaApi=moduleFor('app/api/host-media/route.ts',deps,['GET']);
const uploadApi=moduleFor('app/api/admin/host-media/sign/route.ts',{...deps,randomUUID:crypto.randomUUID},['POST']);
const request=async(api,method,body,query='',origin='https://tripelor.com')=>{const res=await api[method](new Request('https://tripelor.com/api/test'+query,{method,headers:{origin,'content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})}));return {status:res.status,body:res.status===307?null:await res.json(),headers:res.headers};};
(async()=>{
  const question={propertyId,topic:'Room',question:'Is there a cot?',userId:otherId};
  user=null;assert.equal((await request(guestApi,'POST',question)).status,401);assert.equal((await request(adminApi,'GET')).status,401);
  user={id,email:'guest@example.test',user_metadata:{full_name:'Guest'}};
  assert.equal((await request(guestApi,'POST',question,'','https://evil.test')).status,403);
  propertyEnabled=false;assert.equal((await request(guestApi,'POST',question)).status,404);propertyEnabled=true;
  let r=await request(guestApi,'POST',question);assert.equal(r.status,200);assert.equal(stored[0].user_id,id);assert.equal(r.body.question.draft_text,undefined);assert.equal(r.body.question.guest_email,undefined);
  assert.equal((await request(adminApi,'GET')).status,403);
  const replyFile='replies/'+questionId+'/'+crypto.randomUUID()+'.mp3';
  const answer={id:questionId,version:1,action:'draft',name:'Host',text:'The answer',audio:replyFile,transcript:'Spoken reply'};
  assert.equal((await request(adminApi,'POST',answer)).status,403);
  admin=true;r=await request(adminApi,'POST',answer);assert.equal(r.status,200);assert.equal(r.body.question.draft_text,'The answer');
  admin=false;r=await request(guestApi,'GET');assert.equal(r.body.questions[0].reply_text,'');assert.equal(JSON.stringify(r.body).includes('The answer'),false);
  const audioQuery='?file='+encodeURIComponent(replyFile);
  assert.equal((await request(mediaApi,'GET',null,audioQuery)).status,404);
  admin=true;assert.equal((await request(mediaApi,'GET',null,audioQuery)).status,307);
  r=await request(adminApi,'POST',{...answer,action:'publish',version:2});assert.equal(r.status,200);
  admin=false;r=await request(guestApi,'GET');assert.equal(r.body.questions[0].reply_text,'The answer');assert.equal((await request(mediaApi,'GET',null,audioQuery)).status,307);
  user={id:otherId};assert.equal((await request(guestApi,'GET')).body.questions.length,0);assert.equal((await request(mediaApi,'GET',null,audioQuery)).status,404);
  user=null;assert.equal((await request(mediaApi,'GET',null,audioQuery)).status,404);assert.equal((await request(mediaApi,'GET',null,'?file='+encodeURIComponent(publicAudio))).status,307);
  assert.equal((await request(mediaApi,'GET',null,'?file=profiles/../secret')).status,404);
  user={id};admin=true;assert.equal((await request(adminApi,'POST',{...answer,version:1})).status,409);conflict=true;assert.equal((await request(adminApi,'POST',{...answer,version:3})).status,409);
  await request(adminApi,'POST',{...answer,text:'Unpublished changes',version:3});admin=false;assert.equal((await request(guestApi,'GET')).body.questions[0].reply_text,'The answer');
  assert.equal((await request(uploadApi,'POST',{kind:'profile',section:'audio',contentType:'audio/mpeg',size:10})).status,403);
  admin=true;r=await request(uploadApi,'POST',{kind:'reply',section:'audio',questionId,contentType:'audio/mp4',size:10485760});assert.equal(r.status,200);assert.ok(r.body.file.startsWith('replies/'+questionId+'/'));assert.ok(r.body.file.endsWith('.m4a'));
  assert.equal((await request(uploadApi,'POST',{kind:'profile',section:'audio',contentType:'audio/mpeg',size:10485761})).status,400);
  assert.equal((await request(uploadApi,'POST',{kind:'profile',section:'photo',contentType:'text/html',size:10})).status,400);
  assert.equal((await request(uploadApi,'POST',{kind:'reply',section:'audio',questionId:otherId,contentType:'audio/mpeg',size:10})).status,404);
  admin=false;stored=Array.from({length:10},()=>({...stored[0]}));assert.equal((await request(guestApi,'POST',question)).status,429);
  console.log('PASS: profile validation/privacy; authenticated questions; admin-only replies/uploads; guest isolation; draft/publish separation; public/private audio checks; conflicts; 10 MB limit; rate limiting.');
})().catch(e=>{console.error(e);process.exit(1);});
