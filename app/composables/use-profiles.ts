import type { NostrEvent, NostrMetadata } from "@nostrify/nostrify";

import { NSchema as n } from "@nostrify/nostrify";

export type Profile = NostrMetadata & {
  pubkey: string;
  created_at: number;
};

const profileSchema = n.json().pipe(n.metadata());

let profilesCache: Ref<Record<string, Profile>>;

export function useProfiles() {
  if (!profilesCache) {
    profilesCache = useState<Record<string, Profile>>(
      "nostr-profiles-cache",
      () => ({}),
    );
  }

  const pool = useNostrPool();

  async function fetchProfile(pubkey: string): Promise<Profile | null> {
    if (profilesCache.value[pubkey]) {
      return profilesCache.value[pubkey];
    }

    try {
      const events = await pool.query([{
        authors: [pubkey],
        kinds: [0],
        limit: 1,
      }]);

      const event = events[0] as NostrEvent | undefined;

      if (!event) {
        return null;
      }

      const metadata = profileSchema.parse(event.content);

      const profile: Profile = {
        pubkey: event.pubkey,
        ...metadata,
        created_at: event.created_at,
      };

      profilesCache.value[pubkey] = profile;

      return profile;
    }
    catch (error) {
      console.error(`Failed to fetch profile for ${pubkey}:`, error);
      return null;
    }
  }

  async function fetchProfiles(pubkeys: string[]): Promise<Profile[]> {
    const promises = pubkeys.map(pubkey => fetchProfile(pubkey));
    const results = await Promise.all(promises);
    return results.filter((p): p is Profile => p !== null);
  }

  function getProfile(pubkey: string) {
    return computed(() => profilesCache.value[pubkey] || null);
  }

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
