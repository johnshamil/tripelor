import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { addDays, checkAvailability, dateToLong, nightsBetween, parseISODate, submitBooking } from "../api";
import { getPackage, getProperty, properties } from "../data";
import { colors } from "../theme";
import type { Navigate, TravelerProfile } from "../types";
import { Body, Card, ChoiceRow, DateField, Eyebrow, Field, GoldButton, H1, H2, Notice, OutlineButton, Screen, Stepper } from "../components/ui";

type Status = { type: "info" | "success" | "error"; message: string } | null;
type BookingStep = 1 | 2 | 3;

const stepLabels = ["Trip", "Guest", "Confirm"];

function Progress({ step }: { step: BookingStep }) {
  return (
    <View style={styles.progress}>
      {stepLabels.map((label, index) => {
        const number = index + 1;
        const active = number <= step;
        return (
          <React.Fragment key={label}>
            {index > 0 ? <View style={[styles.progressLine, active && styles.progressLineActive]} /> : null}
            <View style={styles.progressItem}>
              <View style={[styles.progressCircle, active && styles.progressCircleActive]}>
                {number < step ? <Ionicons name="checkmark" size={17} color={colors.black} /> : <Text style={[styles.progressNumber, active && styles.progressNumberActive]}>{number}</Text>}
              </View>
              <Text style={[styles.progressLabel, active && styles.progressLabelActive]}>{label}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

function localMidnight(value: string) {
  const parsed = parseISODate(value);
  if (!parsed) return undefined;
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

export function BookingScreen({
  propertyId,
  packageId,
  navigate,
  traveler,
}: {
  propertyId?: string;
  packageId?: string;
  navigate: Navigate;
  traveler?: TravelerProfile;
}) {
  const selectedPackage = getPackage(packageId);
  const initialProperty = selectedPackage ? getProperty("uhoos") : getProperty(propertyId);
  const scrollRef = useRef<ScrollView>(null);
  const transition = useRef(new Animated.Value(1)).current;
  const [step, setStep] = useState<BookingStep>(1);
  const [property, setProperty] = useState(initialProperty);
  const [roomType, setRoomType] = useState(initialProperty.roomTypes[0] ?? "Deluxe Room");
  const [mealPlan, setMealPlan] = useState(selectedPackage?.mealPlan ?? "Bed & Breakfast");
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [fullName, setFullName] = useState(traveler?.fullName ?? "");
  const [email, setEmail] = useState(traveler?.email ?? "");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const today = useMemo(() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }, []);

  useEffect(() => {
    if (selectedPackage && checkIn) setCheckOut(addDays(checkIn, selectedPackage.nights));
  }, [checkIn, selectedPackage]);

  useEffect(() => {
    setRooms((current) => Math.min(current, property.maxRooms));
  }, [property]);

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    const timer = setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 30);
    return () => clearTimeout(timer);
  }, [step, transition]);

  const nights = selectedPackage?.nights ?? nightsBetween(checkIn, checkOut);
  const nightlyRate = property.rates[mealPlan] ?? 0;
  const total = selectedPackage?.price ?? nightlyRate * nights * rooms;
  const checkOutMinimum = checkIn ? localMidnight(addDays(checkIn, 1)) : today;

  function validateTravel() {
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (!parseISODate(checkIn)) return "Please select your check-in date.";
    if (checkIn < todayISO) return "Check-in cannot be in the past.";
    if (!parseISODate(checkOut)) return "Please select your check-out date.";
    if (nights <= 0) return "Check-out must be after check-in.";
    return null;
  }

  function validateGuest() {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Please enter a valid email address.";
    if (!phone.trim()) return "Please enter your phone or WhatsApp number.";
    return null;
  }

  function moveTo(next: BookingStep) {
    setStatus(null);
    if (next > step) {
      const error = step === 1 ? validateTravel() : validateGuest();
      if (error) return setStatus({ type: "error", message: error });
    }
    setStep(next);
  }

  async function sendRequest() {
    setStatus(null);
    const validationError = validateTravel() || validateGuest();
    if (validationError) return setStatus({ type: "error", message: validationError });
    setSending(true);
    try {
      if (!selectedPackage) {
        setStatus({ type: "info", message: "Checking live room availability…" });
        const result = await checkAvailability({ propertyName: property.name, roomType, checkIn, checkOut, rooms });
        if (!result.available) throw new Error("Sorry, this room is not available for the selected dates. Please choose different dates.");
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
      const message = "Booking request sent successfully. A confirmation email has also been sent to you.";
      setStatus({ type: "success", message });
      Alert.alert("Request received", message);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to send your booking request." });
    } finally {
      setSending(false);
    }
  }

  function chooseProperty(name: string) {
    const next = properties.find((item) => item.name === name);
    if (!next) return;
    setProperty(next);
    setRoomType(next.roomTypes[0] ?? "Deluxe Room");
    setRooms(1);
    setStatus(null);
  }

  function chooseCheckIn(value: string) {
    setCheckIn(value);
    if (!selectedPackage && checkOut && nightsBetween(value, checkOut) <= 0) setCheckOut("");
    setStatus(null);
  }

  return (
    <Screen scrollRef={scrollRef}>
      <Eyebrow>Quick Tripelor Booking</Eyebrow>
      <H1>{selectedPackage?.name ?? "Your Maldives escape"}</H1>
      <View style={styles.intro}><Body muted>Three simple steps. Tripelor checks availability before your request is sent.</Body></View>
      <Progress step={step} />

      <Animated.View style={{ opacity: transition, transform: [{ translateX: transition.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
        {step === 1 ? (
          <View style={styles.stepContent}>
            {selectedPackage ? (
              <Card style={styles.packageCard}>
                <View style={styles.packageIcon}><Ionicons name="heart" size={22} color={colors.black} /></View>
                <View style={styles.packageCopy}>
                  <Text style={styles.packageLabel}>Selected couple package</Text>
                  <Text style={styles.packageName}>{selectedPackage.name}</Text>
                  <Text style={styles.packageMeta}>{selectedPackage.nights} nights · {selectedPackage.mealPlan} · USD {selectedPackage.price}</Text>
                </View>
              </Card>
            ) : <ChoiceRow label="Choose your stay" options={properties.map((item) => item.name)} value={property.name} onChange={chooseProperty} />}

            <Card style={styles.formCard}>
              <H2>Tap your dates</H2>
              <DateField label="Check-in" value={checkIn} onChange={chooseCheckIn} minimumDate={today} />
              <DateField label="Check-out" value={checkOut} onChange={setCheckOut} minimumDate={checkOutMinimum} disabled={!!selectedPackage} placeholder={selectedPackage ? "Set automatically" : "Select date"} />
              {selectedPackage ? <Notice>Check-out is automatically fixed to exactly {selectedPackage.nights} nights after check-in.</Notice> : null}
            </Card>

            {!selectedPackage ? (
              <Card style={styles.formCard}>
                <H2>Stay preferences</H2>
                <ChoiceRow label="Meal plan" options={Object.keys(property.rates)} value={mealPlan} onChange={setMealPlan} />
                {property.roomTypes.length > 1 ? <ChoiceRow label="Room" options={property.roomTypes} value={roomType} onChange={setRoomType} /> : null}
                <Stepper label="Rooms" value={rooms} min={1} max={property.maxRooms} onChange={setRooms} />
                <Stepper label="Adults" value={adults} min={1} max={8} onChange={setAdults} />
                <Stepper label="Children" value={children} min={0} max={6} onChange={setChildren} />
              </Card>
            ) : null}

            {total > 0 ? <Notice>{nights} night{nights === 1 ? "" : "s"} · Estimated total <Text style={styles.inlineGold}>USD {total}</Text></Notice> : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepContent}>
            {traveler?.email ? (
              <Notice type="success">Your Tripelor account details have been added. Just enter your phone number to continue.</Notice>
            ) : null}
            <Card style={styles.formCard}>
              <H2>Guest details</H2>
              <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoCapitalize="words" autoComplete="name" />
              <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Field label="Phone / WhatsApp" value={phone} onChangeText={setPhone} placeholder="Include country code" keyboardType="phone-pad" autoComplete="tel" />
              <Field label="Special requests (optional)" value={specialRequests} onChangeText={setSpecialRequests} placeholder="Transfer, honeymoon setup, excursions…" multiline numberOfLines={4} />
            </Card>
            <Notice>Your contact details are used only to process and respond to this booking request.</Notice>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepContent}>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View style={styles.summaryCopy}>
                  <Text style={styles.summaryLabel}>Ready to send</Text>
                  <Text style={styles.summaryTitle}>{selectedPackage?.name ?? property.name}</Text>
                  <Text style={styles.summaryMeta}>{dateToLong(checkIn)} → {dateToLong(checkOut)}</Text>
                </View>
                <Ionicons name="checkmark-done-circle" size={31} color={colors.gold} />
              </View>
              <View style={styles.summaryRows}>
                <View style={styles.summaryRow}><Text style={styles.summaryKey}>Stay</Text><Text style={styles.summaryValue}>{property.name}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryKey}>Guests</Text><Text style={styles.summaryValue}>{selectedPackage ? "2 adults" : `${adults} adult${adults === 1 ? "" : "s"}${children ? `, ${children} child${children === 1 ? "" : "ren"}` : ""}`}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryKey}>Room</Text><Text style={styles.summaryValue}>{selectedPackage ? "1 Couple Room" : `${rooms} × ${roomType}`}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryKey}>Meal plan</Text><Text style={styles.summaryValue}>{mealPlan}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryKey}>Guest</Text><Text style={styles.summaryValue}>{fullName}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryKey}>Email</Text><Text style={styles.summaryValue}>{email}</Text></View>
              </View>
              <View style={styles.totalRow}><Text style={styles.totalLabel}>{selectedPackage ? "Package total" : "Estimated room total"}</Text><Text style={styles.total}>USD {total}</Text></View>
            </Card>
            <Notice>Submitting this form sends a request only. Your reservation becomes final after Tripelor confirms availability, terms and payment.</Notice>
          </View>
        ) : null}
      </Animated.View>

      {status ? <View style={styles.status}><Notice type={status.type}>{status.message}</Notice></View> : null}

      <View style={styles.actions}>
        {step > 1 ? <View style={styles.actionButton}><OutlineButton title="Back" icon="arrow-back" onPress={() => moveTo((step - 1) as BookingStep)} /></View> : null}
        {step < 3 ? <View style={styles.actionButton}><GoldButton title="Continue" icon="arrow-forward" onPress={() => moveTo((step + 1) as BookingStep)} /></View> : <View style={styles.actionButton}><GoldButton title="Send Booking Request" icon="send" loading={sending} onPress={sendRequest} /></View>}
      </View>
      <OutlineButton title="Need Help? Contact Tripelor" icon="chatbubble-outline" onPress={() => navigate("contact")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 13, marginBottom: 22 },
  progress: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center", marginBottom: 26 },
  progressItem: { alignItems: "center", width: 62, gap: 6 },
  progressLine: { flex: 1, height: 2, backgroundColor: colors.border, marginTop: 17, marginHorizontal: -8 },
  progressLineActive: { backgroundColor: colors.gold },
  progressCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  progressCircleActive: { borderColor: colors.gold, backgroundColor: colors.gold },
  progressNumber: { color: colors.faint, fontWeight: "900" },
  progressNumberActive: { color: colors.black },
  progressLabel: { color: colors.faint, fontSize: 10, fontWeight: "700" },
  progressLabelActive: { color: colors.gold },
  stepContent: { gap: 17 },
  packageCard: { flexDirection: "row", gap: 13, alignItems: "flex-start", borderColor: colors.goldBorder },
  packageIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  packageCopy: { flex: 1 },
  packageLabel: { color: colors.gold, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "900" },
  packageName: { color: colors.text, fontSize: 19, fontWeight: "900", marginTop: 5 },
  packageMeta: { color: colors.muted, marginTop: 6, lineHeight: 19 },
  formCard: { gap: 18 },
  inlineGold: { color: colors.gold, fontWeight: "900" },
  summaryCard: { gap: 17, borderColor: colors.goldBorder, backgroundColor: "rgba(210,168,74,0.07)" },
  summaryTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  summaryCopy: { flex: 1 },
  summaryLabel: { color: colors.gold, textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontWeight: "900" },
  summaryTitle: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: "900", marginTop: 6 },
  summaryMeta: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  summaryRows: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.goldBorder, paddingTop: 8 },
  summaryRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingVertical: 8 },
  summaryKey: { color: colors.muted, fontSize: 12, width: 70 },
  summaryValue: { color: colors.text, fontWeight: "700", fontSize: 13, textAlign: "right", flex: 1 },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.goldBorder, paddingTop: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  totalLabel: { color: colors.muted, fontSize: 12, flex: 1 },
  total: { color: colors.gold, fontSize: 27, fontWeight: "900" },
  status: { marginTop: 18 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18, marginBottom: 12 },
  actionButton: { flex: 1 },
});
