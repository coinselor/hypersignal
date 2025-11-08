import { NUser } from "../../lib/nostr/n-user";

export function useCurrentUser() {
  const { $nostr } = useNuxtApp();
  const { logins } = useNostrLogin();
  const { fetchProfile, getProfile } = useProfiles();

  const user = computed(() => {
    const currentLogin = logins.value[0];
    if (!currentLogin) {
      return undefined;
    }

    try {
      switch (currentLogin.type) {
        case "bunker":
          return NUser.fromBunkerLogin(currentLogin, $nostr);
        case "extension":
          return NUser.fromExtensionLogin(currentLogin);
        default:
          console.warn(`Unsupported login type: ${currentLogin.type}`);
          return undefined;
      }
    }
    catch (error) {
      console.warn("Skipped invalid login", currentLogin.id, error);
      return undefined;
    }
  });

  // Get profile from cache, trigger fetch if not cached
  const profile = computed(() => {
    const pubkey = user.value?.pubkey;
    if (!pubkey) {
      return null;
    }

    // Trigger fetch in background if not cached
    const cached = getProfile(pubkey).value;
    if (!cached) {
      fetchProfile(pubkey);
    }

    return cached;
  });

  return {
    user,
    profile,
    pending: computed(() => false), // Profile fetch happens in background
  };
}
