import type { Filter, NostrEvent } from "nostr-tools";

import { NPool, NRelay1 } from "@nostrify/nostrify";

import type { NUser } from "../../lib/nostr/n-user";

// Kinds that should be fetched from/published to app-specific relays only
const APP_ONLY_KINDS = [33321, 3333];

let pool: NPool | null = null;
let publicRelays: string[] = [];
let specialRelays: string[] = [];
let userRelays: Ref<string[]>;
let cachedUser: ComputedRef<NUser | undefined> | null = null;

// Relay connection status tracking
export type RelayStatus = {
  url: string;
  connected: boolean;
  error?: string;
};

let relayStatusMap: Ref<Record<string, RelayStatus>>;

function loadUserRelays(): string[] {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem("hypersignal-user-relays");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
    catch (error) {
      console.error("Failed to load user relays:", error);
    }
  }
  return [];
}

function getAllSpecialRelays(): string[] {
  return [...new Set([...specialRelays, ...(userRelays?.value || [])])];
}

export function useNostrPool() {
  if (!relayStatusMap) {
    relayStatusMap = useState<Record<string, RelayStatus>>(
      "nostr-relay-status",
      () => ({}),
    );
  }

  if (!pool) {
    const config = useRuntimeConfig();
    publicRelays = config.public.nostr.publicRelays || [];
    specialRelays = config.public.nostr.specialRelays || [];
    if (!userRelays) {
      userRelays = useState<string[]>("nostr-user-relays", () => loadUserRelays());
    }

    pool = new NPool({
      open(url) {
        // Initialize relay status as connecting
        relayStatusMap.value[url] = { url, connected: false };

        type RelayOptions = { auth?: (challenge: string) => Promise<NostrEvent> };
        const relayOptions: RelayOptions = {};

        if (!cachedUser) {
          const { user } = useCurrentUser();
          cachedUser = user;
        }

        const hasActiveSigner = Boolean(cachedUser?.value?.signer);

        if (hasActiveSigner) {
          const authCache = new Map<string, Promise<NostrEvent>>();

          relayOptions.auth = async (challenge: string) => {
            const activeUser = cachedUser?.value;

            if (!activeUser?.signer) {
              throw new Error("Authentication requires an active signer");
            }

            const cacheKey = `${activeUser.pubkey}:${url}:${challenge}`;

            if (!authCache.has(cacheKey)) {
              authCache.set(
                cacheKey,
                (async () => {
                  const authEvent = {
                    kind: 22242,
                    created_at: Math.floor(Date.now() / 1000),
                    tags: [
                      ["relay", url],
                      ["challenge", challenge],
                    ],
                    content: "",
                  };
                  const plainEvent = JSON.parse(JSON.stringify(authEvent));
                  const signedAuth = await activeUser.signer.signEvent(plainEvent);
                  return signedAuth;
                })().finally(() => {
                  authCache.delete(cacheKey);
                }),
              );
            }

            return authCache.get(cacheKey)!;
          };
        }

        const relay = new NRelay1(url, relayOptions);

        // Optimistically set as connected after creation
        // Note: NRelay1 doesn't expose WebSocket directly, so we track optimistically
        setTimeout(() => {
          if (relayStatusMap.value[url]) {
            relayStatusMap.value[url] = { url, connected: true };
          }
        }, 1000);

        return relay;
      },
      async reqRouter(filters) {
        const map = new Map<string, Filter[]>();

        // Separate filters for public and special relays
        const publicFilters: Filter[] = [];
        const specialFilters: Filter[] = [];

        for (const filter of filters) {
          const kinds = filter.kinds || [];
          const specialKindsInFilter = kinds.filter(k => APP_ONLY_KINDS.includes(k));
          const publicKindsInFilter = kinds.filter(k => !APP_ONLY_KINDS.includes(k));

          // Create a new filter for special kinds if any are present
          if (specialKindsInFilter.length > 0) {
            specialFilters.push({ ...filter, kinds: specialKindsInFilter });
          }
          // Create a new filter for public kinds if any are present
          if (publicKindsInFilter.length > 0) {
            publicFilters.push({ ...filter, kinds: publicKindsInFilter });
          }
        }

        // Assign filters to the appropriate relays
        if (publicFilters.length > 0) {
          for (const url of publicRelays) {
            map.set(url, publicFilters);
          }
        }
        if (specialFilters.length > 0) {
          for (const url of getAllSpecialRelays()) {
            map.set(url, specialFilters);
          }
        }

        return map;
      },
      async eventRouter(event: NostrEvent) {
        if (event.kind && APP_ONLY_KINDS.includes(event.kind)) {
          const targets = getAllSpecialRelays();

          if (targets.length === 0) {
            console.error(
              `[POOL] No special relays configured for app-only kind ${event.kind}.`,
            );
            throw new Error("No special relays configured for HyperSignal events");
          }

          return targets;
        }

        return publicRelays;
      },
    });
  }

  return pool;
}

// Separate composable for relay management
export function useRelayManager() {
  if (!relayStatusMap) {
    relayStatusMap = useState<Record<string, RelayStatus>>(
      "nostr-relay-status",
      () => ({}),
    );
  }

  if (!userRelays) {
    userRelays = useState<string[]>("nostr-user-relays", () => loadUserRelays());
  }

  function getRelayStatuses(): RelayStatus[] {
    return Object.values(relayStatusMap.value);
  }

  function getConnectedRelayCount(): number {
    return getRelayStatuses().filter(r => r.connected).length;
  }

  function getTotalRelayCount(): number {
    return getRelayStatuses().length;
  }

  async function addUserRelay(url: string) {
    if (import.meta.client && pool) {
      try {
        const stored = localStorage.getItem("hypersignal-user-relays");
        const relays: string[] = stored ? JSON.parse(stored) : [];
        if (!relays.includes(url)) {
          // Mark as connecting
          relayStatusMap.value[url] = { url, connected: false };
          const relay = new NRelay1(url);

          // Test the connection by sending a simple query
          try {
            // Add relay to pool temporarily for testing
            // @ts-expect-error - accessing private property for dynamic relay management
            pool.relays.set(url, relay);

            // Send a test query to verify connection
            await Promise.race([
              relay.query([{ kinds: [1], limit: 1 }]),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Connection timeout")), 5000),
              ),
            ]);

            // If we got here, connection works
            relayStatusMap.value[url] = { url, connected: true };

            // Save to localStorage and user relays
            relays.push(url);
            localStorage.setItem("hypersignal-user-relays", JSON.stringify(relays));
            userRelays.value.push(url);
          }
          catch (connectionError) {
            // Clean up failed relay
            const { [url]: _, ...rest } = relayStatusMap.value;
            relayStatusMap.value = rest;
            relay.close();
            // @ts-expect-error - accessing private property for dynamic relay management
            pool.relays.delete(url);
            throw new Error(`Failed to connect: ${connectionError instanceof Error ? connectionError.message : "Invalid relay URL"}`);
          }
        }
        else {
          throw new Error("Relay already added");
        }
      }
      catch (error) {
        console.error("Failed to add relay:", error);
        throw error;
      }
    }
  }

  function removeRelay(url: string) {
    if (import.meta.client && pool) {
      try {
        // Check if it's a user relay
        const userRelayIndex = userRelays.value.indexOf(url);
        if (userRelayIndex > -1) {
          // Remove from user relays
          const stored = localStorage.getItem("hypersignal-user-relays");
          const relays: string[] = stored ? JSON.parse(stored) : [];
          const filtered = relays.filter(r => r !== url);
          localStorage.setItem("hypersignal-user-relays", JSON.stringify(filtered));
          userRelays.value.splice(userRelayIndex, 1);
        }

        // Check if it's a public relay
        const publicRelayIndex = publicRelays.indexOf(url);
        if (publicRelayIndex > -1) {
          publicRelays.splice(publicRelayIndex, 1);
        }

        // Check if it's a special relay
        const specialRelayIndex = specialRelays.indexOf(url);
        if (specialRelayIndex > -1) {
          specialRelays.splice(specialRelayIndex, 1);
        }

        // Disconnect from the relay
        // @ts-expect-error - accessing private property for dynamic relay management
        const relay = pool.relays.get(url);
        if (relay) {
          relay.close();
          // @ts-expect-error - accessing private property for dynamic relay management
          pool.relays.delete(url);
        }

        // Remove from status map
        const { [url]: _, ...rest } = relayStatusMap.value;
        relayStatusMap.value = { ...rest };
      }
      catch (error) {
        console.error("Failed to remove relay:", error);
        throw error;
      }
    }
  }

  function getPublicRelays(): string[] {
    return [...publicRelays];
  }

  function getSpecialRelays(): string[] {
    return [...specialRelays];
  }

  function getUserRelays(): string[] {
    return [...(userRelays?.value || [])];
  }

  return {
    relayStatuses: readonly(relayStatusMap),
    getRelayStatuses,
    getConnectedRelayCount,
    getTotalRelayCount,
    addUserRelay,
    removeRelay,
    getPublicRelays,
    getSpecialRelays,
    getUserRelays,
  };
}
