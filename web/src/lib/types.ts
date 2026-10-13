export type PropertyType = "hotel" | "lodge" | "apartment";

/** Set by the Daytime admin. Only "available" listings can be booked. */
export type ListingStatus = "available" | "unavailable" | "coming-soon";

export type Amenity =
  | "wifi"
  | "pool"
  | "gym"
  | "spa"
  | "workspace"
  | "parking"
  | "shower"
  | "kitchen"
  | "restaurant"
  | "airport-shuttle"
  | "garden"
  | "bar";

export type UseCase = "work" | "rest" | "pool-spa" | "between-flights" | "freshen-up";

export interface Photo {
  /** Remote image URL template. `{size}` is replaced with e.g. max500 / max1024x768 / max1280x900. */
  src: string;
  alt: string;
}

/** A bookable unit: a hotel room type, a lodge day package or a whole apartment. */
export interface Unit {
  id: string;
  name: string;
  description: string;
  /** Multiplier applied to the property's base rates. */
  priceFactor: number;
  maxGuests: number;
  features: string[];
}

export interface Review {
  author: string;
  country: string;
  date: string; // ISO
  rating: number; // out of 10
  useCase: UseCase;
  text: string;
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  type: PropertyType;
  stars?: number;
  city: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  /** Distance in km from the city centre. Used for "distance" sort. */
  distanceKm: number;
  summary: string;
  description: string;
  photos: Photo[];
  /** Reference overnight rate in ZMW (2 adults, 1 night). */
  overnightRate: number;
  /** 50–70. */
  discountPct: number;
  /** Day-pass price in ZMW for the full daytime window. */
  dayPassRate: number;
  /** Hourly price in ZMW. */
  hourlyRate: number;
  /** Daytime window, "HH:MM" 24h. */
  window: { open: string; close: string };
  minHours: number;
  maxGuests: number;
  rating: number; // out of 10
  reviewCount: number;
  ratingBreakdown: Record<"cleanliness" | "comfort" | "location" | "staff" | "value" | "wifi", number>;
  amenities: Amenity[];
  includedInBooking: string[];
  houseRules: string[];
  useCases: UseCase[];
  units: Unit[];
  reviews: Review[];
  featured?: boolean;
  nearAirport?: string;
  /** Where the listing info and photos came from (prototype data). */
  source?: string;
  status: ListingStatus;
  /** Partner listing with no reviews yet. */
  isNew?: boolean;
  ownerId?: string;
}

/** What a partner submits. Stored server-side and converted to a Property for the public site. */
export interface PartnerListing {
  id: string;
  ownerId: string;
  slug: string;
  propertyName: string;
  type: PropertyType;
  city: string;
  address?: string;
  summary?: string;
  units: number;
  overnightRate: number;
  dayPassRate: number;
  hourlyRate: number;
  window: { open: string; close: string };
  minHours: number;
  amenities: Amenity[];
  photos: string[];
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export type BookingMode = "hourly" | "daypass";

export interface Slot {
  /** "HH:MM" */
  time: string;
  /** Minutes from midnight. */
  minutes: number;
  /** Is this 30-min block free? */
  free: boolean;
}

export interface Availability {
  propertyId: string;
  unitId: string;
  date: string; // YYYY-MM-DD
  slots: Slot[];
}

export interface BookingSelection {
  propertyId: string;
  unitId: string;
  date: string;
  mode: BookingMode;
  checkIn: string; // HH:MM
  hours: number;
  guests: { adults: number; children: number };
}

export interface Booking extends BookingSelection {
  ref: string;
  createdAt: string;
  status: "upcoming" | "past" | "cancelled";
  checkOut: string;
  total: number; // ZMW
  overnightRate: number;
  guest: { firstName: string; lastName: string; email: string; phone: string };
  paymentMethod: "card" | "mobile-money";
}

export interface SearchParams {
  location?: string;
  date?: string;
  checkIn?: string;
  duration?: string; // "2" | "3" | "4" | "6" | "daypass"
  guests?: number;
  types?: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  stars?: number[];
  minRating?: number;
  window?: "morning" | "midday" | "afternoon";
  amenities?: Amenity[];
  useCase?: UseCase;
  sort?: "saving" | "price" | "rating" | "distance" | "earliest";
}
