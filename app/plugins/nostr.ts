import type { NostrEvent } from "@nostrify/nostrify";

import { NPool, NRelay1 } from "@nostrify/nostrify";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.nostr;
  const relays = [...(config.publicRelays || []), ...(config.specialRelays || [])];

  for (const url of relays) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
        throw new Error(`Protocol must be ws: or wss:. Found: ${parsed.protocol}`);
      }
    }
    catch {
      throw new Error(`[Nostr Plugin] Invalid relay URL in nuxt.config.ts: "${url}".`);
    }
  }

  const pool = new NPool({
    open(url: string) {
      return new NRelay1(url);
    },
    reqRouter(filters) {
      return new Map(relays.map(url => [url, filters]));
    },
    eventRouter(_event: NostrEvent) {
      return relays;
    },
  });

  return {
    provide: {
      nostr: pool,
    },
  };
});
