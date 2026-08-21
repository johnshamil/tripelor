import Ionicons from "@expo/vector-icons/Ionicons";
import React, { type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { colors, radius, shadow } from "../theme";
import type { Navigate, TabName } from "../types";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoMark}>
        <Ionicons name="airplane" size={compact ? 18 : 22} color={colors.black} />
      </View>
      <View>
        <Text style={[styles.logoText, compact && styles.logoTextCompact]}>TRIPELOR</Text>
        {!compact ? <Text style={styles.logoTagline}>MALDIVES, MADE MEMORABLE</Text> : null}
      </View>
    </View>
  );
}

export function AppHeader({ title, onBack }: { title?: string; onBack?: () => void }) {
  return (
    <View style={styles.appHeader}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
      ) : null}
      {title ? <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text> : <Logo compact />}
      <View style={styles.headerSpacer} />
    </View>
  );
}

export function Screen({
  children,
  title,
  onBack,
  noPadding = false,
}: PropsWithChildren<{ title?: string; onBack?: () => void; noPadding?: boolean }>) {
  return (
    <View style={styles.screen}>
      <AppHeader title={title} onBack={onBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, noPadding && styles.scrollNoPadding]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function H1({ children }: PropsWithChildren) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function H2({ children }: PropsWithChildren) {
  return <Text style={styles.h2}>{children}</Text>;
}

export function Body({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.body, muted && styles.bodyMuted]}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GoldButton({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.goldButton,
        compact && styles.buttonCompact,
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={colors.black} /> : icon ? <Ionicons name={icon} size={19} color={colors.black} /> : null}
      <Text style={styles.goldButtonText}>{loading ? "Please wait…" : title}</Text>
    </Pressable>
  );
}

export function OutlineButton({
  title,
  onPress,
  icon,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.outlineButton, compact && styles.buttonCompact, pressed && styles.buttonPressed]}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.gold} /> : null}
      <Text style={styles.outlineButtonText}>{title}</Text>
    </Pressable>
  );
}

export function Feature({ children, icon = "checkmark-circle" }: PropsWithChildren<{ icon?: IconName }>) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon} size={19} color={colors.gold} />
      <Text style={styles.featureText}>{children}</Text>
    </View>
  );
}

export function Badge({ children }: PropsWithChildren) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

export function Field({ label, multiline, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.textarea, style]}
        {...props}
      />
    </View>
  );
}

export function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
        {options.map((option) => {
          const active = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onChange(option)}
              style={[styles.choice, active && styles.choiceActive]}
            >
              <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function Stepper({
  label,
  value,
  min = 0,
  max = 20,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable accessibilityRole="button" onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepperButton}>
          <Ionicons name="remove" size={20} color={colors.gold} />
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable accessibilityRole="button" onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepperButton}>
          <Ionicons name="add" size={20} color={colors.gold} />
        </Pressable>
      </View>
    </View>
  );
}

export function Notice({ children, type = "info" }: PropsWithChildren<{ type?: "info" | "success" | "error" }>) {
  return (
    <View style={[styles.notice, type === "success" && styles.noticeSuccess, type === "error" && styles.noticeError]}>
      <Ionicons
        name={type === "success" ? "checkmark-circle" : type === "error" ? "alert-circle" : "information-circle"}
        size={20}
        color={type === "success" ? colors.success : type === "error" ? colors.danger : colors.gold}
      />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function CoverCard({
  image,
  eyebrow,
  title,
  subtitle,
  badge,
  onPress,
}: {
  image: ImageSourcePropType;
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.coverCard, pressed && styles.coverPressed]}>
      <Image source={image} style={styles.coverImage} />
      <View style={styles.coverShade} />
      <View style={styles.coverContent}>
        <View style={styles.coverTopRow}>
          <Text style={styles.coverEyebrow}>{eyebrow}</Text>
          {badge ? <Badge>{badge}</Badge> : null}
        </View>
        <Text style={styles.coverTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.coverSubtitle}>{subtitle}</Text>
        <View style={styles.coverLink}>
          <Text style={styles.coverLinkText}>View details</Text>
          <Ionicons name="arrow-forward" size={17} color={colors.gold} />
        </View>
      </View>
    </Pressable>
  );
}

const tabs: Array<{ name: TabName; label: string; icon: IconName; activeIcon: IconName }> = [
  { name: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { name: "stays", label: "Stays", icon: "bed-outline", activeIcon: "bed" },
  { name: "packages", label: "Packages", icon: "sparkles-outline", activeIcon: "sparkles" },
  { name: "booking", label: "Book", icon: "calendar-outline", activeIcon: "calendar" },
  { name: "more", label: "More", icon: "menu-outline", activeIcon: "menu" },
];

export function BottomTabs({ active, navigate }: { active: TabName; navigate: Navigate }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const selected = active === tab.name;
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => navigate(tab.name)}
            style={styles.tabButton}
          >
            <Ionicons name={selected ? tab.activeIcon : tab.icon} size={22} color={selected ? colors.gold : colors.faint} />
            <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  appHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
    backgroundColor: "rgba(7,7,7,0.98)",
  },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginLeft: -10 },
  headerTitle: { flex: 1, color: colors.text, fontWeight: "700", fontSize: 17, textAlign: "center" },
  headerSpacer: { width: 32 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 44 },
  scrollNoPadding: { paddingHorizontal: 0, paddingTop: 0 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  logoMark: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  logoText: { color: colors.gold, fontSize: 18, letterSpacing: 2.2, fontWeight: "900" },
  logoTextCompact: { fontSize: 16, letterSpacing: 1.8 },
  logoTagline: { color: colors.muted, fontSize: 7, marginTop: 2, letterSpacing: 1.25 },
  eyebrow: { color: colors.gold, fontWeight: "800", fontSize: 12, letterSpacing: 2.2, textTransform: "uppercase" },
  h1: { color: colors.text, fontWeight: "900", fontSize: 36, lineHeight: 41, letterSpacing: -0.8, marginTop: 8 },
  h2: { color: colors.text, fontWeight: "800", fontSize: 26, lineHeight: 32, letterSpacing: -0.35 },
  body: { color: colors.text, fontSize: 16, lineHeight: 25 },
  bodyMuted: { color: colors.muted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: 20, ...shadow },
  goldButton: { minHeight: 50, paddingHorizontal: 21, borderRadius: radius.pill, backgroundColor: colors.gold, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  outlineButton: { minHeight: 50, paddingHorizontal: 21, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  buttonCompact: { minHeight: 42, paddingHorizontal: 16 },
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.88 },
  buttonDisabled: { opacity: 0.55 },
  goldButtonText: { color: colors.black, fontSize: 15, fontWeight: "800" },
  outlineButtonText: { color: colors.gold, fontSize: 15, fontWeight: "800" },
  featureRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 11 },
  featureText: { color: colors.text, lineHeight: 21, flex: 1 },
  badge: { borderWidth: 1, borderColor: colors.goldBorder, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(212,175,55,0.10)" },
  badgeText: { color: colors.gold, fontSize: 11, fontWeight: "800" },
  fieldWrap: { gap: 8 },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: "700" },
  input: { minHeight: 50, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.black, color: colors.text, paddingHorizontal: 15, fontSize: 15 },
  textarea: { minHeight: 112, paddingTop: 14 },
  choiceRow: { gap: 8, paddingRight: 4 },
  choice: { minHeight: 42, paddingHorizontal: 15, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.black, alignItems: "center", justifyContent: "center" },
  choiceActive: { borderColor: colors.gold, backgroundColor: "rgba(212,175,55,0.13)" },
  choiceText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  choiceTextActive: { color: colors.gold },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepperButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.goldBorder, alignItems: "center", justifyContent: "center", backgroundColor: colors.black },
  stepperValue: { color: colors.text, minWidth: 24, textAlign: "center", fontSize: 17, fontWeight: "800" },
  notice: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: "rgba(212,175,55,0.08)" },
  noticeSuccess: { borderColor: "rgba(74,222,128,0.35)", backgroundColor: "rgba(74,222,128,0.07)" },
  noticeError: { borderColor: "rgba(251,113,133,0.35)", backgroundColor: "rgba(251,113,133,0.07)" },
  noticeText: { color: colors.text, lineHeight: 20, flex: 1, fontSize: 13 },
  coverCard: { height: 330, borderRadius: radius.large, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow },
  coverPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  coverImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" },
  coverShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  coverContent: { flex: 1, justifyContent: "flex-end", padding: 20, backgroundColor: "rgba(0,0,0,0.20)" },
  coverTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  coverEyebrow: { color: colors.goldSoft, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: "900", flex: 1 },
  coverTitle: { color: colors.white, fontSize: 25, lineHeight: 30, fontWeight: "900", marginTop: 9 },
  coverSubtitle: { color: "#E4E4E7", fontSize: 14, lineHeight: 20, marginTop: 8 },
  coverLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 13 },
  coverLinkText: { color: colors.gold, fontWeight: "800", fontSize: 13 },
  tabBar: { minHeight: 72, paddingTop: 8, paddingBottom: 8, flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: "#0B0B0B" },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabLabel: { color: colors.faint, fontSize: 10, fontWeight: "700" },
  tabLabelActive: { color: colors.gold },
});
