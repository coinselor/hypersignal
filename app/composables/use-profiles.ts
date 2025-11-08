import type { NostrEvent, NostrMetadata } from "@nostrify/nostrify";

import { NSchema as n } from "@nostrify/nostrify";

export type Profile = NostrMetadata & {
  pubkey: string;
  created_at: number;
};

const profileSchema = n.json().pipe(n.metadata());

// Global cache for profiles
let profilesCache: Ref<Record<string, Profile>>;

export function useProfiles() {
  if (!profilesCache) {
    profilesCache = useState<Record<string, Profile>>(
      "nostr-profiles-cache",
      () => ({}),
    );
  }

  const pool = useNostrPool();

  /**
   * Fetch a profile from Nostr relays by pubkey
   */
  async function fetchProfile(pubkey: string): Promise<Profile | null> {
    // Return from cache if available
    if (profilesCache.value[pubkey]) {
      return profilesCache.value[pubkey];
    }

    try {
      // Fetch the latest kind 0 event
      const events = await pool.query([{
        authors: [pubkey],
        kinds: [0],
        limit: 1,
      }]);

      const event = events[0] as NostrEvent | undefined;

      if (!event) {
        return null;
      }

      // Parse the event content
      const metadata = profileSchema.parse(event.content);

      // Create the profile object
      const profile: Profile = {
        pubkey: event.pubkey,
        ...metadata,
        created_at: event.created_at,
      };

      // Store in cache
      profilesCache.value[pubkey] = profile;

      return profile;
    }
    catch (error) {
      console.error(`Failed to fetch profile for ${pubkey}:`, error);
      return null;
    }
  }

  /**
   * Fetch multiple profiles in parallel
   */
  async function fetchProfiles(pubkeys: string[]): Promise<Profile[]> {
    const promises = pubkeys.map(pubkey => fetchProfile(pubkey));
    const results = await Promise.all(promises);
    return results.filter((p): p is Profile => p !== null);
  }

  /**
   * Get a reactive reference to a cached profile
   */
  function getProfile(pubkey: string) {
    return computed(() => profilesCache.value[pubkey] || null);
  }

  /**
   * Get the last 2 characters of a hex pubkey for fallback avatar
   */
  function getPubkeyShorthand(pubkey: string): string {
    return pubkey.slice(-2).toUpperCase();
  }

  return {
    fetchProfile,
    fetchProfiles,
    getProfile,
    getPubkeyShorthand,
    profiles: readonly(profilesCache),
  };
}
