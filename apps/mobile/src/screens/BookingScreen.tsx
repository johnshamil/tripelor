import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { addDays, checkAvailability, dateToLong, nightsBetween, parseISODate, submitBooking } from "../api";
import { getPackage, getProperty, properties } from "../data";
import { colors } from "../theme";
import type { Navigate } from "../types";
import { Body, Card, ChoiceRow, Eyebrow, Field, GoldButton, H1, H2, Notice, OutlineButton, Screen, Stepper } from "../components/ui";

type Status = { type: "info" | "success" | "error"; message: string } | null;

export function BookingScreen({
  propertyId,
  packageId,
  navigate,
}: {
  propertyId?: string;
  packageId?: string;
  navigate: Navigate;
}) {
  const selectedPackage = getPackage(packageId);
  const initialProperty = selectedPackage ? getProperty("uhoos") : getProperty(propertyId);
  const [property, setProperty] = useState(initialProperty);
  const [roomType, setRoomType] = useState(initialProperty.roomTypes[0] ?? "Deluxe Room");
  const [mealPlan, setMealPlan] = useState(selectedPackage?.mealPlan ?? "Bed & Breakfast");
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (selectedPackage && checkIn) setCheckOut(addDays(checkIn, selectedPackage.nights));
  }, [checkIn, selectedPackage]);

  useEffect(() => {
    setRooms((current) => Math.min(current, property.maxRooms));
  }, [property]);

  const nights = selectedPackage?.nights ?? nightsBetween(checkIn, checkOut);
  const nightlyRate = property.rates[mealPlan] ?? 0;
  const total = selectedPackage?.price ?? nightlyRate * nights * rooms;

  const summary = useMemo(() => {
    if (selectedPackage) return `${selectedPackage.nights} nights · 2 adults · 1 room · ${selectedPackage.mealPlan}`;
    if (!nights) return "Select valid travel dates to calculate your stay.";
    return `${nights} night${nights === 1 ? "" : "s"} · ${rooms} room${rooms === 1 ? "" : "s"} · ${mealPlan}`;
  }, [mealPlan, nights, rooms, selectedPackage]);

  function validate() {
    const today = new Date().toISOString().slice(0, 10);
    if (!parseISODate(checkIn)) return "Enter the check-in date as YYYY-MM-DD.";
    if (checkIn < today) return "Check-in cannot be in the past.";
    if (!parseISODate(checkOut)) return "Enter the check-out date as YYYY-MM-DD.";
    if (nights <= 0) return "Check-out must be after check-in.";
    if (!fullName.trim()) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Please enter a valid email address.";
    if (!phone.trim()) return "Please enter your phone or WhatsApp number.";
    return null;
  }

  async function sendRequest() {
    setStatus(null);
    const validationError = validate();
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    setSending(true);
    try {
      if (!selectedPackage) {
        setStatus({ type: "info", message: "Checking live room availability…" });
        const result = await checkAvailability({
          propertyName: property.name,
          roomType,
          checkIn,
          checkOut,
          rooms,
        });
        if (!result.available) {
          throw new Error("Sorry, this room is not available for the selected dates. Please choose different dates.");
        }
      }

      setStatus({ type: "info", message: "Sending your booking request…" });
      await submitBooking({
        packageName: selectedPackage?.name ?? null,
        packagePrice: selectedPackage?.price ?? null,
        propertyName: property.name,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        destination: property.location,
        checkIn: dateToLong(checkIn),
        checkOut: dateToLong(checkOut),
        checkInISO: checkIn,
        checkOutISO: checkOut,
        nights,
        adults: selectedPackage ? 2 : adults,
        children: selectedPackage ? 0 : children,
        roomType: selectedPackage ? "Couple Room" : roomType,
        rooms: selectedPackage ? 1 : rooms,
        mealPlan,
        nightlyRate: selectedPackage ? null : nightlyRate,
        estimatedTotal: total || null,
        specialRequests: selectedPackage
          ? `Couple package for 2 adults sharing 1 room at ${property.name}. ${specialRequests.trim()}`.trim()
          : specialRequests.trim(),
        bookingSource: "mobile-app",
      });
      const successMessage = "Booking request sent successfully. A confirmation email has also been sent to you.";
      setStatus({ type: "success", message: successMessage });
      Alert.alert("Request received", successMessage);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to send your booking request." });
    } finally {
      setSending(false);
    }
  }

  function chooseProperty(name: string) {
    const next = properties.find((item) => item.name === name);
    if (next) {
      setProperty(next);
      setRoomType(next.roomTypes[0] ?? "Deluxe Room");
      setRooms(1);
      setStatus(null);
    }
  }

  return (
    <Screen>
      <Eyebrow>{selectedPackage ? "Book This Couple Package" : "Book Your Stay"}</Eyebrow>
      <H1>{selectedPackage?.name ?? "Plan your island stay"}</H1>
      <View style={styles.intro}>
        <Body muted>{selectedPackage ? `Designed for 2 adults sharing 1 room at Uhoo's Lavish Oasis.` : "Choose your guesthouse, dates and meal plan. Tripelor will check the live room inventory before sending your request."}</Body>
      </View>

      {selectedPackage ? (
        <Card style={styles.packageCard}>
          <View style={styles.packageIcon}><Ionicons name="heart" size={22} color={colors.black} /></View>
          <View style={styles.packageCopy}>
            <Text style={styles.packageLabel}>Selected couple package</Text>
            <Text style={styles.packageName}>{selectedPackage.name}</Text>
            <Text style={styles.packageMeta}>{selectedPackage.nights} nights · {selectedPackage.mealPlan} · USD {selectedPackage.price}</Text>
          </View>
        </Card>
      ) : (
        <ChoiceRow label="Stay / Hotel" options={properties.map((item) => item.name)} value={property.name} onChange={chooseProperty} />
      )}

      <Card style={styles.formCard}>
        <H2>Travel details</H2>
        <View style={styles.formGap}>
          <Field
            label="Check-in date"
            value={checkIn}
            onChangeText={(value) => { setCheckIn(value); setStatus(null); }}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            maxLength={10}
          />
          <Field
            label="Check-out date"
            value={checkOut}
            editable={!selectedPackage}
            onChangeText={(value) => { setCheckOut(value); setStatus(null); }}
            placeholder={selectedPackage ? "Set automatically" : "YYYY-MM-DD"}
            autoCapitalize="none"
            maxLength={10}
          />
          {selectedPackage ? <Notice>Check-out is fixed automatically to exactly {selectedPackage.nights} nights after check-in.</Notice> : null}
          {!selectedPackage ? (
            <>
              <ChoiceRow label="Meal plan" options={Object.keys(property.rates)} value={mealPlan} onChange={setMealPlan} />
              {property.roomTypes.length > 1 ? <ChoiceRow label="Room" options={property.roomTypes} value={roomType} onChange={setRoomType} /> : null}
              <Stepper label="Rooms" value={rooms} min={1} max={property.maxRooms} onChange={setRooms} />
              <Stepper label="Adults" value={adults} min={1} max={8} onChange={setAdults} />
              <Stepper label="Children" value={children} min={0} max={6} onChange={setChildren} />
            </>
          ) : null}
        </View>
      </Card>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Your booking summary</Text>
            <Text style={styles.summaryTitle}>{property.name}</Text>
            <Text style={styles.summaryMeta}>{summary}</Text>
          </View>
          <Ionicons name="receipt" size={28} color={colors.gold} />
        </View>
        {total > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{selectedPackage ? "Package total" : "Estimated room total"}</Text>
            <Text style={styles.total}>USD {total}</Text>
          </View>
        ) : null}
      </Card>

      <Card style={styles.formCard}>
        <H2>Your contact details</H2>
        <View style={styles.formGap}>
          <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoCapitalize="words" />
          <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone / WhatsApp" value={phone} onChangeText={setPhone} placeholder="Include country code" keyboardType="phone-pad" />
          <Field label="Special requests" value={specialRequests} onChangeText={setSpecialRequests} placeholder="Transfer, honeymoon setup, excursions…" multiline numberOfLines={4} />
        </View>
      </Card>

      {status ? <Notice type={status.type}>{status.message}</Notice> : null}
      <GoldButton title={selectedPackage ? "Book This Package" : "Send Booking Request"} icon="mail" loading={sending} onPress={sendRequest} />
      <OutlineButton title="Need Help? Contact Tripelor" icon="chatbubble-outline" onPress={() => navigate("contact")} />
      <Text style={styles.terms}>Submitting this form sends a booking request only. Your reservation is final after Tripelor confirms availability, terms and payment.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 14, marginBottom: 22 },
  packageCard: { flexDirection: "row", gap: 13, alignItems: "flex-start", borderColor: colors.goldBorder },
  packageIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  packageCopy: { flex: 1 },
  packageLabel: { color: colors.gold, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "900" },
  packageName: { color: colors.text, fontSize: 18, fontWeight: "900", marginTop: 5 },
  packageMeta: { color: colors.muted, marginTop: 6, lineHeight: 19 },
  formCard: { gap: 18, marginTop: 18 },
  formGap: { gap: 17 },
  summaryCard: { marginTop: 18, gap: 16, borderColor: colors.goldBorder, backgroundColor: "rgba(212,175,55,0.07)" },
  summaryTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  summaryCopy: { flex: 1 },
  summaryLabel: { color: colors.gold, textTransform: "uppercase", fontSize: 10, letterSpacing: 1.3, fontWeight: "900" },
  summaryTitle: { color: colors.text, fontSize: 19, fontWeight: "900", marginTop: 6 },
  summaryMeta: { color: colors.muted, marginTop: 5, lineHeight: 20 },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.goldBorder, paddingTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  totalLabel: { color: colors.muted, fontSize: 12, flex: 1 },
  total: { color: colors.gold, fontSize: 25, fontWeight: "900" },
  terms: { color: colors.faint, textAlign: "center", lineHeight: 18, fontSize: 11, marginTop: 11 },
});
