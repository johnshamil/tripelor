import React, { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabs, Logo } from "./src/components/ui";
import { supabase } from "./src/lib/supabase";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { StaysScreen, StayDetailScreen } from "./src/screens/StaysScreen";
import { PackageDetailScreen, PackagesScreen } from "./src/screens/PackagesScreen";
import { BookingScreen } from "./src/screens/BookingScreen";
import { ContactScreen, MoreScreen, ReviewsScreen, TransfersScreen, TravelInfoScreen } from "./src/screens/MoreScreens";
import { colors } from "./src/theme";
import type { AppRoute, Navigate, TabName, TravelerProfile } from "./src/types";

const plainTabs = new Set(["home", "stays", "packages", "booking", "more"]);
const GUEST_MODE_KEY = "tripelor:guest-mode";

function TripelorApp() {
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<AppRoute>({ name: "home" });
  const [history, setHistory] = useState<AppRoute[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supabase.auth.getSession(),
      AsyncStorage.getItem(GUEST_MODE_KEY),
    ]).then(([result, storedGuestMode]) => {
      if (!mounted) return;
      setSession(result.data.session);
      setGuestMode(!result.data.session && storedGuestMode === "true");
      setAuthReady(true);
    }).catch(() => {
      if (mounted) setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession) {
        setGuestMode(false);
        void AsyncStorage.removeItem(GUEST_MODE_KEY);
      }
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuestMode(true);
    void AsyncStorage.setItem(GUEST_MODE_KEY, "true");
  }, []);

  const openAuth = useCallback(() => {
    setGuestMode(false);
    void AsyncStorage.removeItem(GUEST_MODE_KEY);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setGuestMode(false);
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  }, []);

  const deleteAccount = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Your session has expired. Please sign in again.");
    const response = await fetch("https://www.tripelor.com/api/account-deletion", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw new Error(result.error || "Unable to delete your account.");
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
    setGuestMode(false);
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  }, []);

  const traveler = useMemo<TravelerProfile>(() => ({
    email: session?.user.email,
    fullName: typeof session?.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name
      : undefined,
  }), [session]);

  const navigate: Navigate = useCallback((name, params) => {
    const target: AppRoute = { name, params };
    const isPlainTab = plainTabs.has(name) && !params;
    const isFilteredPackageTab = name === "packages" && params?.packageId?.startsWith("show-");
    if (isPlainTab || isFilteredPackageTab) {
      setHistory([]);
    } else {
      setHistory((items) => [...items, route]);
    }
    setRoute(target);
  }, [route]);

  const goBack = useCallback(() => {
    setHistory((items) => {
      const previous = items.at(-1);
      if (previous) setRoute(previous);
      else setRoute({ name: "home" });
      return previous ? items.slice(0, -1) : [];
    });
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (history.length > 0 || route.name !== "home") {
        goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [goBack, history.length, route.name]);

  const activeTab = useMemo<TabName>(() => {
    if (route.name === "stay-detail") return "stays";
    if (route.name === "package-detail") return "packages";
    if (["contact", "transfers", "travel-info", "reviews"].includes(route.name)) return "more";
    return route.name as TabName;
  }, [route.name]);

  let screen: React.ReactNode;
  switch (route.name) {
    case "home":
      screen = <HomeScreen navigate={navigate} />;
      break;
    case "stays":
      screen = <StaysScreen navigate={navigate} />;
      break;
    case "stay-detail":
      screen = <StayDetailScreen propertyId={route.params?.propertyId} navigate={navigate} goBack={goBack} />;
      break;
    case "packages":
      screen = (
        <PackagesScreen
          navigate={navigate}
          initialDuration={route.params?.packageId === "show-3" ? 3 : route.params?.packageId === "show-5" ? 5 : undefined}
        />
      );
      break;
    case "package-detail":
      screen = <PackageDetailScreen packageId={route.params?.packageId} navigate={navigate} goBack={goBack} />;
      break;
    case "booking":
      screen = (
        <BookingScreen
          key={`${route.params?.propertyId ?? ""}-${route.params?.packageId ?? ""}`}
          propertyId={route.params?.propertyId}
          packageId={route.params?.packageId}
          navigate={navigate}
          traveler={traveler}
        />
      );
      break;
    case "contact":
      screen = <ContactScreen goBack={goBack} />;
      break;
    case "transfers":
      screen = <TransfersScreen goBack={goBack} />;
      break;
    case "travel-info":
      screen = <TravelInfoScreen goBack={goBack} navigate={navigate} />;
      break;
    case "reviews":
      screen = <ReviewsScreen goBack={goBack} />;
      break;
    case "more":
    default:
      screen = (
        <MoreScreen
          navigate={navigate}
          traveler={traveler}
          signedIn={!!session}
          onOpenAuth={openAuth}
          onSignOut={signOut}
          onDeleteAccount={deleteAccount}
        />
      );
      break;
  }

  if (!authReady) {
    return (
      <View style={[styles.safeArea, styles.loading, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <Logo />
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.loadingText}>Preparing your Maldives escape…</Text>
      </View>
    );
  }

  if (!session && !guestMode) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <AuthScreen onContinueGuest={continueAsGuest} />
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.app}>
        <View style={styles.screen}>{screen}</View>
        <BottomTabs active={activeTab} navigate={navigate} />
      </View>
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><TripelorApp /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  app: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  loading: { alignItems: "center", justifyContent: "center", gap: 18, paddingHorizontal: 28 },
  loadingText: { color: colors.muted, fontSize: 13 },
});
