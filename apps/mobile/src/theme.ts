import { Platform } from "react-native";

export const colors = {
  background: "#06090A",
  surface: "#0E1214",
  surfaceRaised: "#151B1E",
  gold: "#D2A84A",
  goldSoft: "#F4DEA0",
  goldDeep: "#9A6F20",
  lagoon: "#65D5D0",
  lagoonSoft: "#B7F1EA",
  text: "#FBF9F3",
  muted: "#AEB4B7",
  faint: "#737B80",
  border: "rgba(255,255,255,0.10)",
  goldBorder: "rgba(210,168,74,0.38)",
  lagoonBorder: "rgba(101,213,208,0.30)",
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
