import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { getReviews, parseISODate, submitContact, submitReview, submitSpeedboat } from "../api";
import { faqs, properties } from "../data";
import { colors } from "../theme";
import type { Navigate, PublicReview, TravelerProfile } from "../types";
import { Body, Card, ChoiceRow, Eyebrow, Feature, Field, GoldButton, H1, H2, Notice, OutlineButton, Screen, Stepper } from "../components/ui";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Status = { type: "info" | "success" | "error"; message: string } | null;

function MenuCard({ icon, title, text, onPress }: { icon: IconName; title: string; text: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}>
      <View style={styles.menuIcon}><Ionicons name={icon} size={24} color={colors.gold} /></View>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuText}>{text}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.faint} />
    </Pressable>
  );
}

export function MoreScreen({
  navigate,
  traveler,
  signedIn,
  onOpenAuth,
  onSignOut,
  onDeleteAccount,
}: {
  navigate: Navigate;
  traveler: TravelerProfile;
  signedIn: boolean;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [accountStatus, setAccountStatus] = useState<Status>(null);
  const accountName = traveler.fullName?.trim() || traveler.email?.split("@")[0] || "Traveler";
  const initial = accountName.charAt(0).toUpperCase();

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete Tripelor account?",
      "Your sign-in account will be permanently deleted. Existing booking requests may still be retained where needed for service, legal or accounting records.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            setAccountStatus(null);
            try {
              await onDeleteAccount();
            } catch (error) {
              setAccountStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to delete your account." });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Eyebrow>Your Tripelor</Eyebrow>
      <H1>{signedIn ? `Welcome, ${accountName}` : "Travel your way"}</H1>
      <View style={styles.intro}><Body muted>{signedIn ? "Your contact details are ready for quicker booking requests." : "Sign in for faster booking, or continue exploring freely as a guest."}</Body></View>
      <Card style={styles.accountCard}>
        <View style={styles.accountTop}>
          <View style={[styles.avatar, !signedIn && styles.avatarGuest]}>
            {signedIn ? <Text style={styles.avatarText}>{initial}</Text> : <Ionicons name="person-outline" size={25} color={colors.lagoon} />}
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountEyebrow}>{signedIn ? "TRIPELOR ACCOUNT" : "OPTIONAL ACCOUNT"}</Text>
            <Text style={styles.accountTitle}>{signedIn ? accountName : "Make booking even easier"}</Text>
            <Text numberOfLines={1} style={styles.accountEmail}>{signedIn ? traveler.email : "Save your name and email securely."}</Text>
          </View>
          <Ionicons name={signedIn ? "shield-checkmark" : "sparkles"} size={25} color={colors.lagoon} />
        </View>
        {signedIn ? (
          <View style={styles.accountActions}>
            <OutlineButton title="Sign out" icon="log-out-outline" onPress={onSignOut} />
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={confirmDeleteAccount}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, deleting && styles.deleteButtonDisabled]}
            >
              {deleting ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash-outline" size={18} color={colors.danger} />}
              <Text style={styles.deleteText}>{deleting ? "Deleting…" : "Delete account"}</Text>
            </Pressable>
          </View>
        ) : (
          <GoldButton title="Sign In or Create Account" icon="person-circle-outline" onPress={onOpenAuth} />
        )}
        {accountStatus ? <Notice type={accountStatus.type}>{accountStatus.message}</Notice> : null}
      </Card>

      <View style={styles.supportHeading}>
        <Eyebrow>Travel Support</Eyebrow>
        <H2>Everything you need</H2>
      </View>
      <View style={styles.menuList}>
        <MenuCard icon="boat" title="Speedboat Transfer" text="Request airport-to-Felidhoo seats at least 24 hours ahead." onPress={() => navigate("transfers")} />
        <MenuCard icon="mail" title="Contact Tripelor" text="Ask about stays, packages, activities or an existing booking." onPress={() => navigate("contact")} />
        <MenuCard icon="information-circle" title="Travel Information" text="Transfer guide, package terms, cancellation and FAQs." onPress={() => navigate("travel-info")} />
        <MenuCard icon="star" title="Guest Reviews" text="Read real guest experiences or share your stay." onPress={() => navigate("reviews")} />
      </View>
      <Card style={styles.aboutCard}>
        <Ionicons name="shield-checkmark" size={30} color={colors.gold} />
        <H2>About Tripelor</H2>
        <Body muted>Tripelor helps travelers discover local-island stays and memorable Maldives experiences, with personal support from enquiry through confirmation.</Body>
        <View style={styles.aboutLine}><Ionicons name="location" size={18} color={colors.gold} /><Text style={styles.aboutText}>Maldives</Text></View>
        <View style={styles.aboutLine}><Ionicons name="mail" size={18} color={colors.gold} /><Text style={styles.aboutText}>bookings@tripelor.com</Text></View>
        <OutlineButton title="Open tripelor.com" icon="globe-outline" onPress={() => Linking.openURL("https://tripelor.com")} />
      </Card>
    </Screen>
  );
}

export function ContactScreen({ goBack }: { goBack: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [enquiryType, setEnquiryType] = useState("Guesthouse stay");
  const [travelDate, setTravelDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function send() {
    setStatus(null);
    if (!fullName.trim()) return setStatus({ type: "error", message: "Please enter your full name." });
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setStatus({ type: "error", message: "Please enter a valid email address." });
    if (!message.trim()) return setStatus({ type: "error", message: "Please enter your enquiry message." });
    if (travelDate && !parseISODate(travelDate)) return setStatus({ type: "error", message: "Enter the travel date as YYYY-MM-DD." });
    setSending(true);
    try {
      await submitContact({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), enquiryType, travelDate, guests, message: message.trim() });
      const success = "Thank you. Your enquiry has been sent to Tripelor.";
      setStatus({ type: "success", message: success });
      Alert.alert("Enquiry sent", success);
      setMessage("");
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to send your enquiry." });
    } finally { setSending(false); }
  }

  return (
    <Screen title="Contact Tripelor" onBack={goBack}>
      <Eyebrow>We Are Here To Help</Eyebrow>
      <H1>Plan your Maldives holiday with us</H1>
      <View style={styles.intro}><Body muted>Ask about guesthouses, packages, meal plans, transfers or activities. Your message goes directly to Tripelor.</Body></View>
      <Card style={styles.formCard}>
        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoCapitalize="words" />
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="Include country code" keyboardType="phone-pad" />
        <ChoiceRow label="Enquiry type" options={["Guesthouse stay", "Island package", "Transfer", "Activities / excursions", "Existing booking", "Other"]} value={enquiryType} onChange={setEnquiryType} />
        <Field label="Travel date (optional)" value={travelDate} onChangeText={setTravelDate} placeholder="YYYY-MM-DD" maxLength={10} />
        <Stepper label="Number of guests" value={guests} min={1} max={20} onChange={setGuests} />
        <Field label="How can we help?" value={message} onChangeText={setMessage} placeholder="Tell us what you would like to arrange…" multiline numberOfLines={6} />
      </Card>
      {status ? <Notice type={status.type}>{status.message}</Notice> : null}
      <GoldButton title="Send Enquiry" icon="send" loading={sending} onPress={send} />
      <Notice>Please do not send passport numbers, payment-card details or other sensitive information through this form.</Notice>
    </Screen>
  );
}

export function TransfersScreen({ goBack }: { goBack: () => void }) {
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const total = seats * 50;

  async function send() {
    setStatus(null);
    if (!parseISODate(arrivalDate)) return setStatus({ type: "error", message: "Enter your arrival date as YYYY-MM-DD." });
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(arrivalTime)) return setStatus({ type: "error", message: "Enter arrival time in 24-hour HH:MM format." });
    const arrival = new Date(`${arrivalDate}T${arrivalTime}:00`);
    if (arrival.getTime() - Date.now() < 86400000) return setStatus({ type: "error", message: "Speedboat requests must be sent at least 24 hours before arrival." });
    if (!fullName.trim()) return setStatus({ type: "error", message: "Please enter your full name." });
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setStatus({ type: "error", message: "Please enter a valid email address." });
    if (!phone.trim()) return setStatus({ type: "error", message: "Please enter your phone number." });
    setSending(true);
    try {
      await submitSpeedboat({ arrivalDate, arrivalTime, seats, pricePerPerson: 50, total, fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim() });
      const success = "Speedboat request sent. Tripelor will confirm the available schedule and seats with you.";
      setStatus({ type: "success", message: success });
      Alert.alert("Transfer requested", success);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to send the speedboat request." });
    } finally { setSending(false); }
  }

  return (
    <Screen title="Speedboat Transfer" onBack={goBack}>
      <Eyebrow>Malé / Airport ↔ V. Felidhoo</Eyebrow>
      <H1>Request your speedboat seats</H1>
      <View style={styles.intro}><Body muted>Scheduled speedboats usually take around 1½–1¾ hours, depending on stops, weather and the service used.</Body></View>
      <Card style={styles.fareCard}>
        <View style={styles.fareIcon}><Ionicons name="boat" size={27} color={colors.black} /></View>
        <View style={styles.menuCopy}>
          <Text style={styles.farePrice}>USD 50 per person</Text>
          <Text style={styles.menuText}>Pay the speedboat operator directly or at Uhoo&apos;s Lavish Oasis.</Text>
        </View>
      </Card>
      <Notice type="info">Please submit your request at least 24 hours before your arrival. Schedule and seats are subject to confirmation.</Notice>
      <Card style={styles.formCard}>
        <H2>Arrival details</H2>
        <Field label="Arrival date" value={arrivalDate} onChangeText={setArrivalDate} placeholder="YYYY-MM-DD" maxLength={10} />
        <Field label="Arrival time" value={arrivalTime} onChangeText={setArrivalTime} placeholder="14:30" maxLength={5} />
        <Stepper label="Number of seats" value={seats} min={1} max={20} onChange={setSeats} />
        <View style={styles.totalLine}><Text style={styles.totalLabel}>Estimated fare</Text><Text style={styles.totalValue}>USD {total}</Text></View>
      </Card>
      <Card style={styles.formCard}>
        <H2>Passenger contact</H2>
        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoCapitalize="words" />
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone / WhatsApp" value={phone} onChangeText={setPhone} placeholder="Include country code" keyboardType="phone-pad" />
        <Field label="Flight or transfer notes" value={notes} onChangeText={setNotes} placeholder="Flight number, terminal, special notes…" multiline />
      </Card>
      {status ? <Notice type={status.type}>{status.message}</Notice> : null}
      <GoldButton title="Request Speedboat" icon="boat" loading={sending} onPress={send} />
      <Card>
        <H2>Public ferry alternative</H2>
        <View style={styles.featureList}>
          <Feature icon="arrow-forward-circle">Malé → Felidhoo: Sunday, Tuesday and Thursday at approximately 10:00.</Feature>
          <Feature icon="arrow-back-circle">Felidhoo → Malé: Saturday, Monday and Wednesday at approximately 08:40.</Feature>
          <Feature icon="time">Journey time is roughly 5¼ hours because the ferry stops at other islands.</Feature>
        </View>
      </Card>
    </Screen>
  );
}

export function TravelInfoScreen({ goBack, navigate }: { goBack: () => void; navigate: Navigate }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return (
    <Screen title="Travel Information" onBack={goBack}>
      <Eyebrow>Plan With Confidence</Eyebrow>
      <H1>Know before you travel</H1>
      <View style={styles.intro}><Body muted>Important guidance about transfers, package inclusions, booking terms, cancellations and island travel.</Body></View>
      <Card>
        <Ionicons name="boat" size={29} color={colors.gold} />
        <View style={styles.cardTop}><H2>Felidhoo transfers</H2></View>
        <Feature>Scheduled speedboat: usually around 1½–1¾ hours.</Feature>
        <Feature>Indicative fare: around USD 50 per person, one way.</Feature>
        <Feature>Public ferry Route 306: roughly 5¼ hours on selected days.</Feature>
        <View style={styles.cardAction}><GoldButton compact title="Request Transfer" onPress={() => navigate("transfers")} /></View>
      </Card>
      <Card>
        <H2>Package inclusions</H2>
        <View style={styles.featureList}>
          <Feature>Accommodation for the number of nights stated.</Feature>
          <Feature>The meal plan and activities listed on the selected package.</Feature>
          <Feature>Tripelor booking support.</Feature>
          <Feature icon="close-circle">Flights, transfers, insurance and optional activities are excluded unless specifically listed.</Feature>
        </View>
      </Card>
      <View style={styles.faqHeader}><H2>Frequently asked questions</H2></View>
      <View style={styles.faqList}>
        {faqs.map((faq, index) => {
          const open = openFaq === index;
          return (
            <Pressable key={faq.question} onPress={() => setOpenFaq(open ? null : index)} style={styles.faqCard}>
              <View style={styles.faqQuestionRow}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons name={open ? "remove" : "add"} size={21} color={colors.gold} />
              </View>
              {open ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Card>
        <H2>Booking & cancellation</H2>
        <View style={styles.cardTop}><Body muted>Submitting a form is a request only. Accommodation, activities, transfers and prices remain subject to availability until Tripelor confirms them.</Body></View>
        <Body muted>Cancellation and amendment terms vary by guesthouse and service provider. The applicable terms and any non-refundable amount are given before payment.</Body>
      </Card>
      <Card>
        <H2>Privacy</H2>
        <View style={styles.cardTop}><Body muted>Tripelor uses the name, email, phone number, travel dates and preferences you provide to arrange and respond to your request. Optional accounts are authenticated by Supabase and can be permanently deleted from Your Tripelor. Information may be shared with relevant service providers when necessary. Tripelor does not sell personal information.</Body></View>
      </Card>
      <Text style={styles.updated}>Transfer details are indicative and must be reconfirmed for the guest’s actual travel date. Updated 25 August 2026.</Text>
    </Screen>
  );
}

export function ReviewsScreen({ goBack }: { goBack: () => void }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(properties[0]?.name ?? "Uhoo's Lavish Oasis");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [stayDate, setStayDate] = useState("");
  const [rating, setRating] = useState("5");
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  function load() {
    setLoading(true);
    getReviews().then(setReviews).catch(() => setReviews([])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function send() {
    setStatus(null);
    if (!name.trim()) return setStatus({ type: "error", message: "Please enter your name." });
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setStatus({ type: "error", message: "Please enter a valid email address." });
    if (stayDate && !parseISODate(stayDate)) return setStatus({ type: "error", message: "Enter the stay date as YYYY-MM-DD." });
    if (!review.trim()) return setStatus({ type: "error", message: "Please write your review." });
    setSending(true);
    try {
      await submitReview({ property, name: name.trim(), email: email.trim(), country: country.trim(), stayDate, rating: Number(rating), title: title.trim(), review: review.trim(), permission: "yes" });
      setStatus({ type: "success", message: "Thank you. Your review has been submitted." });
      setReview("");
      setTitle("");
      load();
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to submit your review." });
    } finally { setSending(false); }
  }

  return (
    <Screen title="Guest Reviews" onBack={goBack}>
      <Eyebrow>Real Guest Experiences</Eyebrow>
      <H1>What travelers say about Tripelor</H1>
      <View style={styles.reviewList}>
        {loading ? <Notice>Loading guest reviews…</Notice> : reviews.length ? reviews.map((item) => (
          <Card key={item.id}>
            <Text style={styles.stars}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</Text>
            <Text style={styles.reviewTitle}>{item.review_title || "Guest experience"}</Text>
            <Body muted>“{item.review_text}”</Body>
            <Text style={styles.reviewGuest}>{item.guest_name}{item.country ? ` · ${item.country}` : ""}</Text>
            <Text style={styles.reviewProperty}>{item.property_name}</Text>
          </Card>
        )) : <Notice>No guest reviews have been published yet.</Notice>}
      </View>
      <View style={styles.shareTitle}><Eyebrow>Share Your Stay</Eyebrow><H2>Write a review</H2></View>
      <Card style={styles.formCard}>
        <ChoiceRow label="Property" options={properties.map((item) => item.name)} value={property} onChange={setProperty} />
        <ChoiceRow label="Rating" options={["1", "2", "3", "4", "5"]} value={rating} onChange={setRating} />
        <Field label="Your name" value={name} onChangeText={setName} placeholder="Name shown with the review" />
        <Field label="Email (kept private)" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Country (optional)" value={country} onChangeText={setCountry} placeholder="Your country" />
        <Field label="Date of stay (optional)" value={stayDate} onChangeText={setStayDate} placeholder="YYYY-MM-DD" maxLength={10} />
        <Field label="Review title (optional)" value={title} onChangeText={setTitle} placeholder="A memorable island escape" />
        <Field label="Your review" value={review} onChangeText={setReview} placeholder="Tell future guests about your experience…" multiline />
        <Notice>By submitting, you give Tripelor permission to publish your name and review. Your email stays private.</Notice>
      </Card>
      {status ? <Notice type={status.type}>{status.message}</Notice> : null}
      <GoldButton title="Submit Review" icon="star" loading={sending} onPress={send} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 14, marginBottom: 22 },
  accountCard: { gap: 18, borderColor: colors.lagoonBorder, backgroundColor: colors.surfaceRaised },
  accountTop: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: { width: 52, height: 52, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  avatarGuest: { backgroundColor: "rgba(101,213,208,0.10)", borderWidth: 1, borderColor: colors.lagoonBorder },
  avatarText: { color: colors.black, fontSize: 21, fontWeight: "900" },
  accountCopy: { flex: 1 },
  accountEyebrow: { color: colors.lagoon, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  accountTitle: { color: colors.text, fontSize: 18, fontWeight: "900", marginTop: 4 },
  accountEmail: { color: colors.muted, fontSize: 12, marginTop: 4 },
  accountActions: { gap: 10 },
  deleteButton: { minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: "rgba(251,113,133,0.34)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(251,113,133,0.05)" },
  deleteButtonDisabled: { opacity: 0.6 },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: "800" },
  supportHeading: { gap: 5, marginTop: 30, marginBottom: 16 },
  menuList: { gap: 11 },
  menuCard: { minHeight: 94, flexDirection: "row", alignItems: "center", gap: 13, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  menuIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: "rgba(210,168,74,0.10)", alignItems: "center", justifyContent: "center" },
  menuCopy: { flex: 1 },
  menuTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  menuText: { color: colors.muted, lineHeight: 19, marginTop: 4, fontSize: 13 },
  aboutCard: { gap: 13, marginTop: 24 },
  aboutLine: { flexDirection: "row", alignItems: "center", gap: 9 },
  aboutText: { color: colors.text },
  formCard: { gap: 17 },
  fareCard: { flexDirection: "row", gap: 13, alignItems: "center", borderColor: colors.goldBorder },
  fareIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  farePrice: { color: colors.gold, fontSize: 20, fontWeight: "900" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  totalLabel: { color: colors.muted },
  totalValue: { color: colors.gold, fontSize: 24, fontWeight: "900" },
  featureList: { marginTop: 5 },
  cardTop: { marginTop: 12 },
  cardAction: { marginTop: 17, alignItems: "flex-start" },
  faqHeader: { marginTop: 10 },
  faqList: { gap: 10 },
  faqCard: { padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  faqQuestionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  faqQuestion: { color: colors.text, fontWeight: "800", fontSize: 15, flex: 1 },
  faqAnswer: { color: colors.muted, lineHeight: 21, marginTop: 13 },
  updated: { color: colors.faint, fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: 8 },
  reviewList: { gap: 13, marginTop: 24 },
  stars: { color: colors.gold, letterSpacing: 2, fontSize: 18 },
  reviewTitle: { color: colors.text, fontSize: 19, fontWeight: "900", marginVertical: 9 },
  reviewGuest: { color: colors.text, fontWeight: "800", marginTop: 14 },
  reviewProperty: { color: colors.gold, marginTop: 3, fontSize: 12 },
  shareTitle: { marginTop: 26, gap: 5 },
});
