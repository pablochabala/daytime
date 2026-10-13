/** Site-wide settings. App store links are placeholders until the apps are published. */
export const SITE = {
  name: "Daytime",
  tagline: "Great stays, by the hour, for a fraction of the price.",
  appStoreUrl: "#app-store-link-coming-soon",
  playStoreUrl: "#google-play-link-coming-soon",
  freeCancellationHours: 2,
  supportEmail: "help@daytime.example",
  supportPhone: "+260 000 000 000",
};

export const AMENITY_LABEL: Record<string, string> = {
  wifi: "Wi-Fi",
  pool: "Pool",
  gym: "Gym",
  spa: "Spa",
  workspace: "Desk / workspace",
  parking: "Parking",
  shower: "Shower",
  kitchen: "Kitchen",
  restaurant: "Restaurant",
  "airport-shuttle": "Airport shuttle",
  garden: "Garden",
  bar: "Bar",
};

export const USE_CASE_LABEL: Record<string, string> = {
  work: "Work",
  rest: "Rest",
  "pool-spa": "Pool and spa",
  "between-flights": "Between flights",
  "freshen-up": "Freshen up",
};
