import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GoldButton, Logo, Notice } from "../components/ui";
import { supabase } from "../lib/supabase";
import { colors, radius, shadow } from "../theme";

type AuthMode = "sign-in" | "sign-up";
type Status = { type: "info" | "success" | "error"; message: string } | null;

function AuthField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  password = false,
  autoComplete,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  password?: boolean;
  autoComplete?: "name" | "email" | "current-password" | "new-password";
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
        <Ionicons name={icon} size={20} color={focused ? colors.lagoon : colors.gold} />
        <TextInput
          autoCapitalize={autoComplete === "name" ? "words" : "none"}
          autoComplete={autoComplete}
          keyboardType={autoComplete === "email" ? "email-address" : "default"}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          secureTextEntry={password && !showPassword}
          style={styles.input}
          value={value}
        />
        {password ? (
          <Pressable
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setShowPassword((current) => !current)}
          >
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function AuthScreen({ onContinueGuest }: { onContinueGuest: () => void }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      damping: 18,
      stiffness: 110,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  function changeMode(next: AuthMode) {
    setMode(next);
    setPassword("");
    setStatus(null);
  }

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    setStatus(null);
    if (mode === "sign-up" && fullName.trim().length < 2) {
      return setStatus({ type: "error", message: "Please enter your full name." });
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return setStatus({ type: "error", message: "Please enter a valid email address." });
    }
    if (password.length < 8) {
      return setStatus({ type: "error", message: "Your password must contain at least 8 characters." });
    }

    setLoading(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setMode("sign-in");
          setPassword("");
          setStatus({
            type: "success",
            message: "Account created. Open the confirmation email from Tripelor, then return here to sign in.",
          });
        }
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Tripelor could not complete sign-in. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ImageBackground source={require("../../assets/images/uhoos-cover.jpeg")} style={styles.background} imageStyle={styles.backgroundImage}>
        <LinearGradient
          colors={["rgba(6,9,10,0.12)", "rgba(6,9,10,0.70)", colors.background]}
          locations={[0, 0.38, 0.72]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <Logo />
            <View style={styles.privateBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.lagoon} />
              <Text style={styles.privateText}>SECURE</Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.welcome,
              {
                opacity: entrance,
                transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              },
            ]}
          >
            <View style={styles.destinationPill}>
              <Ionicons name="location" size={15} color={colors.lagoon} />
              <Text style={styles.destinationText}>YOUR MALDIVES STARTS HERE</Text>
            </View>
            <Text style={styles.title}>Travel beautifully.{"\n"}<Text style={styles.titleGold}>Arrive effortlessly.</Text></Text>
            <Text style={styles.subtitle}>Curated island stays, memorable experiences and personal Tripelor support in one calm place.</Text>
          </Animated.View>

          <View style={styles.authCard}>
            <View style={styles.modePicker}>
              <Pressable onPress={() => changeMode("sign-in")} style={[styles.modeButton, mode === "sign-in" && styles.modeButtonActive]}>
                <Text style={[styles.modeText, mode === "sign-in" && styles.modeTextActive]}>Sign in</Text>
              </Pressable>
              <Pressable onPress={() => changeMode("sign-up")} style={[styles.modeButton, mode === "sign-up" && styles.modeButtonActive]}>
                <Text style={[styles.modeText, mode === "sign-up" && styles.modeTextActive]}>Create account</Text>
              </Pressable>
            </View>

            <View style={styles.formHeading}>
              <Text style={styles.formTitle}>{mode === "sign-in" ? "Welcome back" : "Create your travel account"}</Text>
              <Text style={styles.formText}>{mode === "sign-in" ? "Sign in to make future booking requests faster." : "Save your contact details and enjoy a smoother booking experience."}</Text>
            </View>

            <View style={styles.form}>
              {mode === "sign-up" ? (
                <AuthField icon="person-outline" label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoComplete="name" />
              ) : null}
              <AuthField icon="mail-outline" label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" autoComplete="email" />
              <AuthField
                icon="lock-closed-outline"
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                password
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              />
            </View>

            {status ? <Notice type={status.type}>{status.message}</Notice> : null}
            <GoldButton
              title={mode === "sign-in" ? "Sign In to Tripelor" : "Create My Account"}
              icon={mode === "sign-in" ? "arrow-forward" : "sparkles"}
              loading={loading}
              onPress={submit}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            <Pressable accessibilityRole="button" onPress={onContinueGuest} style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}>
              <Ionicons name="compass-outline" size={20} color={colors.gold} />
              <Text style={styles.guestText}>Explore as a guest</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.muted} />
            </Pressable>
            <Text style={styles.guestNote}>No account is required to browse or send a booking request.</Text>
          </View>

          <View style={styles.trustRow}>
            {["Private session", "No ads", "Personal support"].map((item) => (
              <View key={item} style={styles.trustItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.lagoon} />
                <Text style={styles.trustText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.legal}>
            By continuing, you agree to Tripelor&apos;s{" "}
            <Text style={styles.legalLink} onPress={() => Linking.openURL("https://www.tripelor.com/travel-info#terms")}>terms</Text>
            {" "}and{" "}
            <Text style={styles.legalLink} onPress={() => Linking.openURL("https://www.tripelor.com/travel-info#privacy")}>privacy policy</Text>.
          </Text>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.78 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  privateBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lagoonBorder, backgroundColor: "rgba(6,9,10,0.62)" },
  privateText: { color: colors.lagoonSoft, fontSize: 9, letterSpacing: 1.4, fontWeight: "900" },
  welcome: { paddingTop: 64, paddingBottom: 26 },
  destinationPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "rgba(6,9,10,0.58)", borderWidth: 1, borderColor: colors.lagoonBorder },
  destinationText: { color: colors.lagoonSoft, fontSize: 10, letterSpacing: 1.4, fontWeight: "900" },
  title: { color: colors.white, fontSize: 42, lineHeight: 46, letterSpacing: -1.3, fontWeight: "900", marginTop: 16 },
  titleGold: { color: colors.goldSoft },
  subtitle: { color: "#E5E7E8", fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 520 },
  authCard: { gap: 17, padding: 20, borderRadius: 30, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: "rgba(14,18,20,0.96)", ...shadow },
  modePicker: { flexDirection: "row", padding: 4, borderRadius: radius.pill, backgroundColor: colors.background },
  modeButton: { flex: 1, minHeight: 43, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  modeButtonActive: { backgroundColor: colors.surfaceRaised },
  modeText: { color: colors.muted, fontSize: 13, fontWeight: "800" },
  modeTextActive: { color: colors.goldSoft },
  formHeading: { gap: 6 },
  formTitle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: "900" },
  formText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  form: { gap: 14 },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: colors.text, fontSize: 12, fontWeight: "800" },
  inputShell: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 15, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  inputShellFocused: { borderColor: colors.lagoon, backgroundColor: "#080D0E" },
  input: { flex: 1, color: colors.text, fontSize: 16, minHeight: 54 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { color: colors.faint, fontSize: 12 },
  guestButton: { minHeight: 54, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 },
  guestText: { color: colors.text, fontWeight: "800", flex: 1 },
  guestNote: { color: colors.faint, fontSize: 11, lineHeight: 17, textAlign: "center" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  trustRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 24 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  trustText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  legal: { color: colors.faint, fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: 17, paddingHorizontal: 12 },
  legalLink: { color: colors.gold },
});
