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

  const profile = computed(() => {
    const pubkey = user.value?.pubkey;
    if (!pubkey) {
      return null;
    }

    const cached = getProfile(pubkey).value;
    if (!cached) {
      fetchProfile(pubkey);
    }

    return cached;
  });

  return {
    user,
    profile,
    pending: computed(() => false),
  };
}
