import { Platform } from "react-native";

export const colors = {
  background: "#070707",
  surface: "#111111",
  surfaceRaised: "#171717",
  gold: "#D4AF37",
  goldSoft: "#F0D778",
  text: "#F7F7F5",
  muted: "#A1A1AA",
  faint: "#71717A",
  border: "rgba(255,255,255,0.10)",
  goldBorder: "rgba(212,175,55,0.34)",
  success: "#4ADE80",
  danger: "#FB7185",
  white: "#FFFFFF",
  black: "#000000",
};

export const shadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
  },
  android: { elevation: 8 },
  default: {},
});

export const radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
};
