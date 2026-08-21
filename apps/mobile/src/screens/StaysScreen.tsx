import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { getProperty, properties } from "../data";
import { colors } from "../theme";
import type { Navigate } from "../types";
import { Badge, Body, Card, CoverCard, Eyebrow, Feature, GoldButton, H1, H2, OutlineButton, Screen } from "../components/ui";

export function StaysScreen({ navigate }: { navigate: Navigate }) {
  return (
    <Screen>
      <Eyebrow>Local-Island Hospitality</Eyebrow>
      <H1>Maldives stays selected by Tripelor</H1>
      <View style={styles.intro}><Body muted>Comfortable guesthouses, clear meal-plan rates and personal help from enquiry to confirmation.</Body></View>
      <View style={styles.list}>
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
      <Card style={styles.helpCard}>
        <Ionicons name="chatbubbles" size={28} color={colors.gold} />
        <H2>Not sure which stay suits you?</H2>
        <Body muted>Send your dates, meal preference and number of guests. Tripelor will help you choose.</Body>
        <OutlineButton title="Ask Tripelor" icon="mail" onPress={() => navigate("contact")} />
      </Card>
    </Screen>
  );
}

export function StayDetailScreen({ propertyId, navigate, goBack }: { propertyId?: string; navigate: Navigate; goBack: () => void }) {
  const property = getProperty(propertyId);
  return (
    <Screen title={property.name} onBack={goBack} noPadding>
      <Image source={property.image} style={styles.heroImage} />
      <View style={styles.detailContent}>
        <Eyebrow>{property.location}</Eyebrow>
        <H1>{property.name}</H1>
        <Body muted>{property.description}</Body>
        <View style={styles.galleryTitle}><H2>Inside the stay</H2></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {property.gallery.map((image, index) => <Image key={index} source={image} style={styles.galleryImage} />)}
        </ScrollView>
        <Card>
          <View style={styles.cardTitleRow}>
            <H2>Room rates</H2>
            <Badge>Per room / night</Badge>
          </View>
          <View style={styles.rateList}>
            {Object.entries(property.rates).map(([plan, price]) => (
              <View key={plan} style={styles.rateRow}>
                <Text style={styles.ratePlan}>{plan}</Text>
                <Text style={styles.ratePrice}>USD {price}</Text>
              </View>
            ))}
          </View>
        </Card>
        <Card>
          <H2>Why guests choose it</H2>
          <View style={styles.features}>{property.features.map((feature) => <Feature key={feature}>{feature}</Feature>)}</View>
        </Card>
        <Card style={styles.availabilityCard}>
          <Ionicons name="shield-checkmark" size={28} color={colors.gold} />
          <Text style={styles.availabilityTitle}>Live availability protection</Text>
          <Body muted>Tripelor checks the shared room inventory before accepting your request, helping prevent double bookings.</Body>
        </Card>
        <GoldButton title="Book This Stay" icon="calendar" onPress={() => navigate("booking", { propertyId: property.id })} />
        <OutlineButton title="Ask a Question" icon="chatbubble-outline" onPress={() => navigate("contact")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 14 },
  list: { gap: 17, marginTop: 26 },
  helpCard: { gap: 14, marginTop: 24 },
  heroImage: { width: "100%", height: 440 },
  detailContent: { padding: 18, gap: 17 },
  galleryTitle: { marginTop: 8 },
  gallery: { gap: 11, paddingRight: 18 },
  galleryImage: { width: 290, height: 225, borderRadius: 20, backgroundColor: colors.surface },
  cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rateList: { marginTop: 14 },
  rateRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  ratePlan: { color: colors.text, fontWeight: "700" },
  ratePrice: { color: colors.gold, fontWeight: "900" },
  features: { marginTop: 5 },
  availabilityCard: { gap: 10 },
  availabilityTitle: { color: colors.text, fontWeight: "800", fontSize: 18 },
});
