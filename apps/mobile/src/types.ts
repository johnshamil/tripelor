import type { ImageSourcePropType } from "react-native";

export type TabName = "home" | "stays" | "packages" | "booking" | "more";

export type ScreenName =
  | TabName
  | "stay-detail"
  | "package-detail"
  | "contact"
  | "transfers"
  | "travel-info"
  | "reviews";

export type RouteParams = {
  propertyId?: string;
  packageId?: string;
};

export type AppRoute = {
  name: ScreenName;
  params?: RouteParams;
};

export type Navigate = (name: ScreenName, params?: RouteParams) => void;

export type TravelerProfile = {
  fullName?: string;
  email?: string;
};

export type Property = {
  id: string;
  name: string;
  location: string;
  description: string;
  image: ImageSourcePropType;
  gallery: ImageSourcePropType[];
  rates: Record<string, number>;
  roomTypes: string[];
  maxRooms: number;
  features: string[];
};

export type TravelPackage = {
  id: string;
  name: string;
  label: string;
  price: number;
  nights: 3 | 5;
  mealPlan: string;
  image: string;
  description: string;
  included: string[];
};

export type PublicReview = {
  id: string;
  property_name: string;
  guest_name: string;
  country: string | null;
  rating: number;
  review_title: string | null;
  review_text: string;
  stay_date: string | null;
  created_at: string;
};
