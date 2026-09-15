export const hostTopics=["Room","Food","Beach","Children & family","Other"] as const;
export type HostQuestion={id:string;property_id:string;property_name:string;property_slug:string;topic:string;question:string;created_at:string;version:number;reply_name:string;reply_text:string;reply_audio:string;reply_transcript:string;replied_at:string|null};
export type AdminHostQuestion=HostQuestion & {guest_name:string;guest_email:string;draft_name:string;draft_text:string;draft_audio:string;draft_transcript:string};
export const hostMediaUrl=(file:string)=>"/api/host-media?file="+encodeURIComponent(file);
export const validHostId=(v:unknown):v is string=>typeof v==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
export function hostText(value:unknown,max:number,label:string) {if(typeof value!=="string"||value.length>max)throw new Error(label+" must be text with up to "+max+" characters.");return value.trim();}
export function validateHostQuestion(input:any){
  if(!input || !validHostId(input.propertyId) || !hostTopics.includes(input.topic))throw new Error("Choose a property and question topic.");
  const question=hostText(input.question,1500,"Your question");if(!question)throw new Error("Enter your question.");
  return {propertyId:input.propertyId as string,topic:input.topic as string,question};
}
export function validateHostReply(input:any,id:string,publish:boolean){
  const name=hostText(input.name,120,"Reply author"),text=hostText(input.text,5000,"Your reply"),audio=hostText(input.audio,200,"Voice file"),transcript=hostText(input.transcript,5000,"Transcript");
  if(audio && (!audio.startsWith("replies/"+id+"/") || !/^replies\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp3|m4a|ogg|webm|wav)$/.test(audio)))throw new Error("Use a voice message uploaded for this enquiry.");
  if(publish && (!name || (!text&&!audio) || (audio&&!transcript)))throw new Error("Add the reply author's name and a reply. Voice replies also need a transcript.");
  return {name,text,audio,transcript};
}
export function customerHostQuestion(row:any):HostQuestion {
  return {id:row.id,property_id:row.property_id,property_name:row.property_name,property_slug:row.property_slug,topic:row.topic,question:row.question,created_at:row.created_at,version:row.version,reply_name:row.replied_at?row.reply_name:"",reply_text:row.replied_at?row.reply_text:"",reply_audio:row.replied_at?row.reply_audio:"",reply_transcript:row.replied_at?row.reply_transcript:"",replied_at:row.replied_at};
}
