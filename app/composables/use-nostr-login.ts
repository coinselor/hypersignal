import type { NLoginType } from "../../lib/nostr/n-login";

const STORAGE_KEY = "hypersignal-current-user";

export function useNostrLogin() {
  const currentUser = useState<NLoginType | null>(STORAGE_KEY, () => {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? (JSON.parse(stored) as NLoginType) : null;
      }
      catch (error) {
        console.warn("Failed to parse user from localStorage", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  });
  const isLoggedIn = computed(() => !!currentUser.value);

  const logins = computed<NLoginType[]>(() => {
    return currentUser.value ? [currentUser.value] : [];
  });

  if (import.meta.client) {
    watch(
      currentUser,
      (user) => {
        if (user) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }
        else {
          localStorage.removeItem(STORAGE_KEY);
        }
      },
      { deep: true },
    );
  }

  const login = (user: NLoginType) => {
    currentUser.value = user;
  };

  const logout = () => {
    currentUser.value = null;
  };

  return {
    currentUser: readonly(currentUser),
    logins,
    isLoggedIn,
    login,
    logout,
  };
}
