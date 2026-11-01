"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, BedDouble, Check, MapPin, Users, Utensils } from "lucide-react";
import {
  nalaDefaultRoom, nalaMoney, nalaPhoto, nalaPrice, nalaProperties, nalaStartingPrice, nalaStay,
  type NalaProperty, type NalaRoom, type NalaStay,
} from "@/lib/nala-veli";
import styles from "./nala-booking-form.module.css";

function RoomPrice({ room, stay, today }: { room: NalaRoom; stay: NalaStay; today: string }) {
  const price = nalaPrice(room, stay);
  const startingPrice = stay.status === "unselected" ? nalaStartingPrice(room, today) : null;
  let label = "For your stay", amount = "Choose valid dates", note = "Tripelor will help with your quote";
  if (price) {
    label = "For your dates";
    amount = nalaMoney(price.nightly);
    note = "average per room / night";
  } else if (stay.status === "unselected" && startingPrice !== null) {
    label = "From";
    amount = nalaMoney(startingPrice);
    note = "per room / night";
  } else if (stay.status === "quote" || stay.status === "unselected") {
    amount = "Price on request";
  }
  return <div className={styles.roomPrice}>
    <p className={styles.priceLabel}>{label}</p>
    <p className={styles.price}>{amount}</p>
    <p className={styles.muted}>{note}</p>
    {price && <p className={styles.stayTotal}>{nalaMoney(price.total)} total · {stay.dates.length} {stay.dates.length === 1 ? "night" : "nights"}</p>}
  </div>;
}

export default function NalaBookingForm({ today, initialStart = "", initialEnd = "" }: {
  today: string; initialStart?: string; initialEnd?: string;
}) {
  const [property, setProperty] = useState(nalaProperties[0].name);
  const [room, setRoom] = useState(nalaDefaultRoom(nalaProperties[0]).name);
  const [roomChoices, setRoomChoices] = useState<Record<string, string>>({});
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const selectedProperty = nalaProperties.find(item => item.name === property)!;
  const selectedRoom = selectedProperty.rooms.find(item => item.name === room)!;
  const stay = start && start < today ? { status: "invalid" as const, dates: [] } : nalaStay(start, end);
  const price = nalaPrice(selectedRoom, stay);

  function selectRoom(nextProperty: NalaProperty, nextRoom: NalaRoom) {
    setProperty(nextProperty.name);
    setRoom(nextRoom.name);
    setRoomChoices(current => ({ ...current, [`${nextProperty.id}-${nextRoom.type}`]: nextRoom.name }));
    setStatus("");
  }

  function changeStart(value: string) {
    setStart(value);
    if (end && end <= value) setEnd("");
    setStatus("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    if (!["priced", "quote"].includes(stay.status) || !name.trim() || !email.includes("@") || !phone.trim()) {
      setStatus("Please complete your contact details and choose a stay of 1–44 nights.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/nala-veli-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property, room, start, end, name, email, phone, requests }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit your request.");
      setStatus(`Booking request received. Reference: ${result.reference}. Tripelor will confirm availability and final terms before payment.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send your request.");
    } finally {
      setSending(false);
    }
  }

  return <>
    <section id="choose-room" className="container" aria-labelledby="nala-choose-room">
      <div className={styles.datePanel}>
        <div><p className="eyebrow">Choose your room</p><h2 id="nala-choose-room">Your island stay, made simple.</h2><p className={styles.muted}>Add your dates to see the price for your stay.</p></div>
        <div className={styles.dates}>
          <label htmlFor="nala-check-in">Check-in<input id="nala-check-in" type="date" min={today} value={start} onChange={event => changeStart(event.target.value)}/></label>
          <label htmlFor="nala-check-out">Check-out<input id="nala-check-out" type="date" min={start || today} value={end} onChange={event => { setEnd(event.target.value); setStatus(""); }}/></label>
        </div>
        <p className={`${styles.dateNote} ${stay.status === "invalid" ? styles.error : ""}`} role="status">
          {stay.status === "unselected" ? "Starting prices include breakfast and accommodation taxes. Select dates for your stay total."
            : stay.status === "invalid" ? "Choose a check-out after check-in, for a stay of 1–44 nights. Check-in cannot be in the past."
            : stay.status === "quote" ? "Your dates include 15 Dec–10 Jan or nights after 30 Apr 2027. Send a request for a personal quote."
            : `${stay.dates.length} ${stay.dates.length === 1 ? "night" : "nights"} · Breakfast and accommodation taxes included · Availability confirmed by Tripelor`}
        </p>
      </div>
      <div className={styles.properties}>
        {nalaProperties.map(item => {
          const roomTypes = Array.from(new Set(item.rooms.map(option => option.type)));
          return <section key={item.id} className={styles.property} aria-labelledby={`nala-${item.id}`}>
            <div className={styles.propertyHeading}>
              <div><p className={styles.location}><MapPin size={15} aria-hidden="true"/>Ukulhas, Maldives</p><h2 id={`nala-${item.id}`}>{item.name}</h2></div>
              <span className={styles.included}><Utensils size={16} aria-hidden="true"/>Breakfast included</span>
            </div>
            <div className={styles.gallery}>
              {item.photos.map((id, index) => <a key={id} href={`https://drive.google.com/file/d/${id}/view`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.name} property photo ${index + 1} (new tab)`}>
                <img src={nalaPhoto(id)} alt={`${item.name} property photo ${index + 1}`} width={600} height={450} loading="lazy" decoding="async"/>
              </a>)}
            </div>
            <div className={styles.rooms}>
              {roomTypes.map(type => {
                const variants = item.rooms.filter(option => option.type === type);
                const key = `${item.id}-${type}`;
                const choice = variants.find(option => option.name === roomChoices[key]) || variants.find(option => option.guests === 2) || variants[0];
                const selected = property === item.name && room === choice.name;
                return <article key={type} className={`${styles.room} ${selected ? styles.selected : ""}`} aria-labelledby={`room-${key}`}>
                  <div className={styles.roomTitle}><BedDouble aria-hidden="true"/><h3 id={`room-${key}`}>{type} Room</h3></div>
                  <p className={styles.muted}>Choose the occupancy for your room.</p>
                  <label className={styles.occupancy} htmlFor={`occupancy-${key}`}><span><Users size={15} aria-hidden="true"/>Guests in this room</span>
                    <select id={`occupancy-${key}`} value={choice.name} onChange={event => {
                      const next = variants.find(option => option.name === event.target.value)!;
                      if (property === item.name && selectedRoom.type === type) selectRoom(item, next);
                      else setRoomChoices(current => ({ ...current, [key]: next.name }));
                    }}>
                      {variants.map(option => <option key={option.name} value={option.name}>{option.guests} {option.guests === 1 ? "guest" : "guests"} · {option.name.replace(`${type} `, "")}</option>)}
                    </select>
                  </label>
                  <p className={styles.mealPlan}><Check size={16} aria-hidden="true"/>BB · Bed &amp; Breakfast</p>
                  <RoomPrice room={choice} stay={stay} today={today}/>
                  <a href="#nala-booking" className={`btn-gold ${styles.selectRoom}`} onClick={() => selectRoom(item, choice)} aria-label={`Select ${choice.name} at ${item.name}`}>Select room<ArrowRight size={17} aria-hidden="true"/></a>
                </article>;
              })}
            </div>
          </section>;
        })}
      </div>
    </section>
    <section className={`container ${styles.bookingSection}`}>
      <form id="nala-booking" onSubmit={submit} className={styles.booking} aria-labelledby="nala-booking-title">
        <div className={styles.bookingHeading}><div><p className="eyebrow">Book with Tripelor</p><h2 id="nala-booking-title">Request your island stay.</h2></div><p className={styles.muted}>We’ll confirm availability and final terms with Nala Veli before payment.</p></div>
        <div className={styles.bookingGrid}>
          <div className={styles.fields}>
            <label htmlFor="nala-property">Property<select id="nala-property" value={property} onChange={event => {
              const next = nalaProperties.find(item => item.name === event.target.value)!;
              selectRoom(next, nalaDefaultRoom(next));
            }}>{nalaProperties.map(item => <option key={item.id}>{item.name}</option>)}</select></label>
            <label htmlFor="nala-room">Room / occupancy<select id="nala-room" value={room} onChange={event => selectRoom(selectedProperty, selectedProperty.rooms.find(item => item.name === event.target.value)!)}>{selectedProperty.rooms.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
            <label htmlFor="nala-booking-start">Check-in<input id="nala-booking-start" required type="date" min={today} value={start} onChange={event => changeStart(event.target.value)}/></label>
            <label htmlFor="nala-booking-end">Check-out<input id="nala-booking-end" required type="date" min={start || today} value={end} onChange={event => { setEnd(event.target.value); setStatus(""); }}/></label>
            <label htmlFor="nala-name">Full name<input id="nala-name" autoComplete="name" required maxLength={120} value={name} onChange={event => setName(event.target.value)}/></label>
            <label htmlFor="nala-email">Email<input id="nala-email" autoComplete="email" required type="email" maxLength={200} value={email} onChange={event => setEmail(event.target.value)}/></label>
            <label htmlFor="nala-phone">Phone / WhatsApp<input id="nala-phone" autoComplete="tel" required type="tel" maxLength={50} value={phone} onChange={event => setPhone(event.target.value)}/></label>
            <label htmlFor="nala-requests"><span>Special requests <span className={styles.optional}>(optional)</span></span><textarea id="nala-requests" rows={3} maxLength={800} value={requests} onChange={event => setRequests(event.target.value)}/></label>
          </div>
          <aside className={styles.summary} aria-label="Your stay summary">
            <p className="eyebrow">Your stay</p><h3>{property}</h3><p>{selectedRoom.name} · {selectedRoom.guests} {selectedRoom.guests === 1 ? "guest" : "guests"}</p>
            <p className={styles.mealPlan}><Check size={16} aria-hidden="true"/>Breakfast included</p>
            <div className={styles.summaryTotal} aria-live="polite"><p className={styles.priceLabel}>Estimated accommodation total</p><p className={styles.price}>{price ? nalaMoney(price.total) : stay.status === "quote" ? "Quote on request" : "Select your dates"}</p>
              {price && <p>{stay.dates.length} {stay.dates.length === 1 ? "night" : "nights"} · {nalaMoney(price.nightly)} average / night</p>}
            </div>
            <p className={styles.muted}>Includes breakfast and accommodation taxes. Transfers, extra beds and special supplements are extra.</p>
            <button type="submit" disabled={sending} className="btn-gold">{sending ? "Sending request…" : "Submit booking request"}<ArrowRight size={17} aria-hidden="true"/></button>
            <p className={styles.small}>No payment is due until your stay is confirmed.</p>
          </aside>
        </div>
        {status && <p role="status" className={styles.feedback}>{status}</p>}
      </form>
    </section>
  </>;
}
