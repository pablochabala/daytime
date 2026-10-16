import "server-only";
import { fileStore } from "./file";
import { supabaseStore } from "./supabase";
import { StoreNotConfiguredError, type Store } from "./types";

export * from "./types";

/**
 * Used on hosts with a read-only filesystem (Vercel) when Supabase isn't configured yet.
 * The public site keeps working; anything that needs to save data reports it isn't switched on.
 */
const unconfiguredStore: Store = {
  kind: "none",
  hasAdmin: async () => false,
  findUserByEmail: async () => null,
  findUserById: async () => null,
  listPartners: async () => [],
  createAdmin: async () => {
    throw new StoreNotConfiguredError();
  },
  updateUser: async () => null,
  createPartner: async () => {
    throw new StoreNotConfiguredError();
  },
  listingByOwner: async () => null,
  listingById: async () => null,
  listListings: async () => [],
  slugTaken: async () => false,
  updateListing: async () => null,
  seedStatuses: async () => ({}),
  setSeedStatus: async () => {
    throw new StoreNotConfiguredError();
  },
  putPhoto: async () => {
    throw new StoreNotConfiguredError();
  },
  getPhoto: async () => null,
  deletePhoto: async () => {},
  fallbackSecret: async () => null,
};

const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Supabase when configured; the local file store in development; otherwise read-only "not configured". */
export const store: Store = hasSupabase ? supabaseStore : process.env.VERCEL ? unconfiguredStore : fileStore;
