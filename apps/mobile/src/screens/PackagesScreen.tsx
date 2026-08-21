import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { getPackage, packages } from "../data";
import { colors } from "../theme";
import type { Navigate } from "../types";
import { Badge, Body, Card, ChoiceRow, CoverCard, Eyebrow, Feature, GoldButton, H1, H2, Notice, OutlineButton, Screen } from "../components/ui";

export function PackagesScreen({ navigate, initialDuration }: { navigate: Navigate; initialDuration?: 3 | 5 }) {
  const [duration, setDuration] = useState<3 | 5>(initialDuration ?? 5);
  useEffect(() => { if (initialDuration) setDuration(initialDuration); }, [initialDuration]);
  const visible = useMemo(() => packages.filter((item) => item.nights === duration), [duration]);
  return (
    <Screen>
      <Eyebrow>Couple Experiences</Eyebrow>
      <H1>Maldives packages designed for two</H1>
      <View style={styles.intro}><Body muted>Romantic stays, beach dinners, manta and dolphin adventures, sandbanks and local-island experiences.</Body></View>
      <View style={styles.selector}>
        <ChoiceRow label="Choose your stay length" options={["3 Nights", "5 Nights"]} value={`${duration} Nights`} onChange={(value) => setDuration(value.startsWith("3") ? 3 : 5)} />
      </View>
      <Notice>All prices shown are total for 2 adults sharing 1 room. Final inclusions and availability are confirmed before payment.</Notice>
      <View style={styles.list}>
        {visible.map((item) => (
          <CoverCard
            key={item.id}
            image={{ uri: item.image }}
            eyebrow={item.label}
            title={item.name}
            subtitle={item.description}
            badge={`USD ${item.price}`}
            onPress={() => navigate("package-detail", { packageId: item.id })}
          />
        ))}
      </View>
    </Screen>
  );
}

export function PackageDetailScreen({ packageId, navigate, goBack }: { packageId?: string; navigate: Navigate; goBack: () => void }) {
  const item = getPackage(packageId);
  if (!item) {
    return <Screen title="Package" onBack={goBack}><Notice type="error">This package could not be found.</Notice></Screen>;
  }
  return (
    <Screen title={item.name} onBack={goBack} noPadding>
      <Image source={{ uri: item.image }} style={styles.detailImage} />
      <View style={styles.detailContent}>
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <Eyebrow>{item.label}</Eyebrow>
            <H1>{item.name}</H1>
          </View>
          <Badge>{item.nights} nights</Badge>
        </View>
        <Body muted>{item.description}</Body>
        <Card>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Total for the couple</Text>
              <Text style={styles.price}>USD {item.price}</Text>
            </View>
            <Ionicons name="heart" size={27} color={colors.gold} />
          </View>
        </Card>
        <Card>
          <H2>What’s included</H2>
          <View style={styles.features}>{item.included.map((value) => <Feature key={value}>{value}</Feature>)}</View>
        </Card>
        <Card>
          <H2>Important information</H2>
          <View style={styles.features}>
            <Feature icon="information-circle">Accommodation is at Uhoo&apos;s Lavish Oasis in V. Felidhoo.</Feature>
            <Feature icon="boat">Airport/island speedboat or ferry transfers are not included unless stated.</Feature>
            <Feature icon="cloudy">Marine activities depend on weather, sea conditions and operational availability.</Feature>
            <Feature icon="shield-checkmark">Final itinerary, cancellation terms and payment schedule are confirmed before payment.</Feature>
          </View>
        </Card>
        <GoldButton title="Book This Package" icon="calendar" onPress={() => navigate("booking", { packageId: item.id })} />
        <OutlineButton title="View Transfer Information" icon="boat-outline" onPress={() => navigate("transfers")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 14 },
  selector: { marginTop: 24 },
  list: { gap: 17, marginTop: 18 },
  detailImage: { width: "100%", height: 375, backgroundColor: colors.surface },
  detailContent: { padding: 18, gap: 17 },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  titleWrap: { flex: 1 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { color: colors.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.4 },
  price: { color: colors.gold, fontSize: 34, fontWeight: "900", marginTop: 5 },
  features: { marginTop: 5 },
});
