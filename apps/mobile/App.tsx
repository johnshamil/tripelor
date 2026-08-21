import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { BottomTabs } from "./src/components/ui";
import { HomeScreen } from "./src/screens/HomeScreen";
import { StaysScreen, StayDetailScreen } from "./src/screens/StaysScreen";
import { PackageDetailScreen, PackagesScreen } from "./src/screens/PackagesScreen";
import { BookingScreen } from "./src/screens/BookingScreen";
import { ContactScreen, MoreScreen, ReviewsScreen, TransfersScreen, TravelInfoScreen } from "./src/screens/MoreScreens";
import { colors } from "./src/theme";
import type { AppRoute, Navigate, TabName } from "./src/types";

const plainTabs = new Set(["home", "stays", "packages", "booking", "more"]);

export default function App() {
  const [route, setRoute] = useState<AppRoute>({ name: "home" });
  const [history, setHistory] = useState<AppRoute[]>([]);

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
      screen = <MoreScreen navigate={navigate} />;
      break;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.app}>
        <View style={styles.screen}>{screen}</View>
        <BottomTabs active={activeTab} navigate={navigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0,
  },
  app: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
});
