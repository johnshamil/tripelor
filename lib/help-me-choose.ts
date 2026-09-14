import type { PublicProperty } from "@/lib/property-model";
import { propertyRateForDate } from "@/lib/property-model";
export type HelpService="stay"|"transfer"|"holiday";
export type HelpSchedule={id:number;route:string;day_of_week:number;departure_time:string;operator:string;capacity?:number;price_per_person?:number};
export function helpDate(value:string) {
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)&&Number.isFinite(Date.parse(value+"T00:00:00Z"))&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
}
export function helpNights(arrival:string,departure:string) { return (Date.parse(departure+"T00:00:00Z")-Date.parse(arrival+"T00:00:00Z"))/86400000; }
export function chooseStays(properties:PublicProperty[],service:HelpService,arrival:string,departure:string,budget:number|null) {
  const nights=arrival&&departure?helpNights(arrival,departure):0;
  if((arrival||departure)&&(!helpDate(arrival)||!helpDate(departure)||nights<1||nights>60))return [];
  return properties.filter(p=>p.status==="published").flatMap(property=>{
    const choices=property.rooms.filter(room=>room.totalRooms>0 && room.sellingRate>0 && Number.isFinite(room.sellingRate)).flatMap(room=>{
      const dates=Array.from({length:nights},(_,i)=>{const date=new Date(arrival+"T00:00:00Z");date.setUTCDate(date.getUTCDate()+i);return date.toISOString().slice(0,10);});
      if(dates.some(date=>(property.inventoryRules||[]).some(rule=>rule.roomName.toLowerCase()===room.name.toLowerCase()&&date>=rule.startDate&&date<=rule.endDate&&(rule.stopSale||rule.roomsAvailable<1))))return [];
      const rates=dates.length?dates.map(date=>propertyRateForDate(property,room.name,room.mealPlan,date)):[room.sellingRate];
      if(rates.some(rate=>!Number.isFinite(rate)||rate<=0))return [];
      const total=rates.reduce((sum,rate)=>sum+rate,0),nightly=total/rates.length;
      if(budget!==null && (service==="stay"?Math.max(...rates)>budget:nights>0&&total>budget))return [];
      return [{property,room,nightly,total,nights}];
    }).sort((a,b)=>a.total-b.total||a.room.name.localeCompare(b.room.name));
    return choices.slice(0,1);
  }).sort((a,b)=>a.total-b.total||a.property.name.localeCompare(b.property.name)).slice(0,3);
}
export function chooseTransfers(schedule:HelpSchedule[],route:string,date:string,budget:number|null) {
  if(!route || (date&&!helpDate(date)))return [];
  const day=date?new Date(date+"T12:00:00Z").getUTCDay():null;
  return schedule.filter(item=>item.route===route&&(day===null||item.day_of_week===day)&&(item.capacity==null||item.capacity>0)&&Number.isFinite(Number(item.price_per_person))&&Number(item.price_per_person)>0&&(budget===null||Number(item.price_per_person)<=budget))
    .sort((a,b)=>Number(a.price_per_person)-Number(b.price_per_person)||a.day_of_week-b.day_of_week||a.departure_time.localeCompare(b.departure_time)).slice(0,3);
}
