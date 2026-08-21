import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { ImageBackground, ScrollView, StyleSheet, Text, View } from "react-native";
import { getReviews } from "../api";
import { packages, properties } from "../data";
import { colors } from "../theme";
import type { Navigate, PublicReview } from "../types";
import { AppHeader, Badge, Body, Card, CoverCard, Eyebrow, GoldButton, H2, OutlineButton } from "../components/ui";

export function HomeScreen({ navigate }: { navigate: Navigate }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    let mounted = true;
    getReviews()
      .then((items) => mounted && setReviews(items.slice(0, 3)))
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const featuredPackage = packages.find((item) => item.id === "island-adventure-5") ?? packages[0];

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1723781496892-d085ed803ff8?auto=format&fit=crop&q=88&w=1600" }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            <Eyebrow>Maldives · Above & Below The Blue</Eyebrow>
            <Text style={styles.heroTitle}>Dive into the <Text style={styles.heroGold}>extraordinary.</Text></Text>
            <Text style={styles.heroBody}>Island stays and unforgettable ocean experiences—discover the Maldives with Tripelor.</Text>
            <View style={styles.heroButtons}>
              <GoldButton title="Book Your Stay" icon="calendar" onPress={() => navigate("booking")} />
              <OutlineButton title="Explore Packages" onPress={() => navigate("packages")} />
            </View>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <Eyebrow>Tripelor Packages</Eyebrow>
          <H2>Choose your perfect island escape</H2>
          <View style={styles.durationCards}>
            <Card style={styles.durationCard}>
              <Ionicons name="sunny" size={27} color={colors.gold} />
              <Text style={styles.durationTitle}>3 Nights</Text>
              <Text style={styles.durationText}>A quick Maldives escape for two.</Text>
              <OutlineButton title="View Packages" compact onPress={() => navigate("packages", { packageId: "show-3" })} />
            </Card>
            <Card style={styles.durationCard}>
              <Ionicons name="sparkles" size={27} color={colors.gold} />
              <Text style={styles.durationTitle}>5 Nights</Text>
              <Text style={styles.durationText}>More time for reefs, islands and sunsets.</Text>
              <GoldButton title="View Packages" compact onPress={() => navigate("packages", { packageId: "show-5" })} />
            </Card>
          </View>
        </View>

        {featuredPackage ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionTitleWrap}>
                <Eyebrow>Featured Escape</Eyebrow>
                <H2>Adventure made simple</H2>
              </View>
              <Badge>USD {featuredPackage.price}</Badge>
            </View>
            <CoverCard
              image={{ uri: featuredPackage.image }}
              eyebrow={featuredPackage.label}
              title={featuredPackage.name}
              subtitle={featuredPackage.description}
              badge={`${featuredPackage.nights} nights`}
              onPress={() => navigate("package-detail", { packageId: featuredPackage.id })}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleWrap}>
              <Eyebrow>Island Stays</Eyebrow>
              <H2>Stay local. Feel at home.</H2>
            </View>
            <OutlineButton title="See all" compact onPress={() => navigate("stays")} />
          </View>
          <View style={styles.cardGap}>
            {properties.map((property) => (
              <CoverCard
                key={property.id}
                image={property.image}
                eyebrow={property.location}
                title={property.name}
                subtitle={property.description}
                badge={`From $${Math.min(...Object.values(property.rates))}`}
                onPress={() => navigate("stay-detail", { propertyId: property.id })}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Eyebrow>Simple & Transparent</Eyebrow>
          <H2>How booking works</H2>
          <View style={styles.steps}>
            {[
              ["01", "Send your request", "Choose your stay or package and enter your travel details."],
              ["02", "We check availability", "Tripelor checks accommodation and services for your dates."],
              ["03", "Receive confirmation", "You receive confirmed details, terms and final amount."],
              ["04", "Complete payment", "Follow the secure payment instructions in your confirmation."],
            ].map(([number, title, text]) => (
              <View key={number} style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{title}</Text>
                  <Text style={styles.stepText}>{text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleWrap}>
              <Eyebrow>Guest Experiences</Eyebrow>
              <H2>What guests say</H2>
            </View>
            <OutlineButton title="Reviews" compact onPress={() => navigate("reviews")} />
          </View>
          {reviews.length ? (
            <View style={styles.cardGap}>
              {reviews.map((review) => (
                <Card key={review.id}>
                  <Text style={styles.stars}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</Text>
                  <Text style={styles.reviewTitle}>{review.review_title || "Guest experience"}</Text>
                  <Body muted>“{review.review_text}”</Body>
                  <Text style={styles.reviewGuest}>{review.guest_name} · {review.property_name}</Text>
                </Card>
              ))}
            </View>
          ) : (
            <Card><Body muted>New guest reviews will appear here.</Body></Card>
          )}
        </View>

        <View style={styles.cta}>
          <Ionicons name="airplane" size={36} color={colors.gold} />
          <H2>Your island escape starts here.</H2>
          <Body muted>Tell Tripelor your dates and we’ll help with the rest.</Body>
          <GoldButton title="Start Booking" icon="arrow-forward" onPress={() => navigate("booking")} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 46 },
  hero: { minHeight: 560, justifyContent: "flex-end" },
  heroImage: { opacity: 0.92 },
  heroShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.46)" },
  heroContent: { paddingHorizontal: 20, paddingTop: 90, paddingBottom: 36, backgroundColor: "rgba(0,0,0,0.13)" },
  heroTitle: { color: colors.white, fontSize: 46, lineHeight: 49, letterSpacing: -1.5, fontWeight: "900", marginTop: 12 },
  heroGold: { color: colors.goldSoft },
  heroBody: { color: "#E4E4E7", fontSize: 17, lineHeight: 25, marginTop: 16, maxWidth: 520 },
  heroButtons: { gap: 11, marginTop: 25, alignItems: "stretch" },
  section: { paddingHorizontal: 18, paddingTop: 42, gap: 17 },
  sectionRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  sectionTitleWrap: { flex: 1, gap: 5 },
  durationCards: { gap: 12 },
  durationCard: { gap: 11 },
  durationTitle: { color: colors.text, fontSize: 24, fontWeight: "900" },
  durationText: { color: colors.muted, lineHeight: 21, marginBottom: 4 },
  cardGap: { gap: 15 },
  steps: { gap: 8 },
  stepRow: { flexDirection: "row", gap: 14, paddingVertical: 10 },
  stepNumber: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.goldBorder, alignItems: "center", justifyContent: "center" },
  stepNumberText: { color: colors.gold, fontWeight: "900", fontSize: 12 },
  stepCopy: { flex: 1 },
  stepTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  stepText: { color: colors.muted, lineHeight: 20, marginTop: 4 },
  stars: { color: colors.gold, letterSpacing: 2, fontSize: 18 },
  reviewTitle: { color: colors.text, fontSize: 19, fontWeight: "800", marginVertical: 9 },
  reviewGuest: { color: colors.gold, fontSize: 12, fontWeight: "700", marginTop: 15 },
  cta: { marginHorizontal: 18, marginTop: 48, padding: 24, borderRadius: 26, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: "rgba(212,175,55,0.08)", gap: 14, alignItems: "flex-start" },
});
