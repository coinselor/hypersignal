import type { NostrEvent, Filter as NostrFilter } from "nostr-tools";

import { onMounted, onUnmounted } from "vue";

import type { ProcessedEvent } from "../../types";

const SIGNAL_KIND = 33321;
const ACK_KIND = 3333;

export function useFeed() {
  const pool = useNostrPool();

  const signals = useState<ProcessedEvent[]>("feed-signals", () => []);
  const acks = useState<ProcessedEvent[]>("feed-acks", () => []);
  const isInitialized = useState<boolean>("feed-initialized", () => false);
  const subscriberCount = useState<number>("feed-subscriber-count", () => 0);
  const controllerState = useState<AbortController | null>("feed-controller", () => null);
  const isBootstrapping = useState<boolean>("feed-bootstrapping", () => true);

  function findTagValue(event: NostrEvent, tagName: string) {
    const tag = event.tags.find(t => t[0] === tagName);
    return tag ? tag[1] : undefined;
  }

  function getFallbackAuthor(pubkey: string) {
    if (!pubkey)
      return { name: "Unknown", picture: "" };

    const trailing = pubkey.slice(-6) || pubkey;
    return {
      name: `...${trailing}`,
      picture: "",
    };
  }

  function processEvent(event: NostrEvent): ProcessedEvent {
    const pubkey = event.pubkey;
    const network = findTagValue(event, "network") || "hqz";
    const action
      = event.kind === ACK_KIND
        ? "ack"
        : findTagValue(event, "action")
          || findTagValue(event, "status")
          || "unknown";
    const version = findTagValue(event, "version") || "0.0.0";

    return {
      id: event.id,
      pubkey,
      action,
      network,
      version,
      author: getFallbackAuthor(pubkey),
      content: event.content,
      rawEvent: event,
    };
  }

  function getReplaceableKey(event: NostrEvent) {
    if (event.kind === SIGNAL_KIND || event.kind === ACK_KIND) {
      const discriminator = findTagValue(event, "d") || "";
      return `${event.kind}:${event.pubkey}:${discriminator}`;
    }

    return null;
  }

  function upsertProcessedEvent(target: ProcessedEvent[], processed: ProcessedEvent) {
    if (target.some(item => item.id === processed.id))
      return false;

    const replaceableKey = getReplaceableKey(processed.rawEvent);

    if (replaceableKey) {
      const existingIndex = target.findIndex(item => getReplaceableKey(item.rawEvent) === replaceableKey);

      if (existingIndex !== -1) {
        const existing = target[existingIndex]!;
        const existingTimestamp = existing.rawEvent.created_at ?? 0;
        const newTimestamp = processed.rawEvent.created_at ?? 0;

        if (existingTimestamp >= newTimestamp)
          return false;

        target.splice(existingIndex, 1);
      }
    }

    target.unshift(processed);
    return true;
  }

  async function fetchEvents(controller: AbortController) {
    const filters: NostrFilter[] = [
      { kinds: [SIGNAL_KIND, ACK_KIND], limit: 50 },
    ];

    try {
      for await (const msg of pool.req(filters, { signal: controller.signal })) {
        if (msg[0] === "EVENT") {
          const event = msg[2];
          const processed = processEvent(event);

          if (processed.action === "ack") {
            upsertProcessedEvent(acks.value, processed);
          }
          else {
            upsertProcessedEvent(signals.value, processed);
          }

          if (isBootstrapping.value)
            isBootstrapping.value = false;
        }
        else if (msg[0] === "EOSE") {
          if (isBootstrapping.value)
            isBootstrapping.value = false;
        }
      }
    }
    catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.warn("Subscription aborted as component unmounted.");
      }
      else {
        console.error("Error fetching events:", error);
      }
    }
  }

  onMounted(() => {
    subscriberCount.value += 1;

    if (!isInitialized.value) {
      const controller = new AbortController();
      controllerState.value = controller;
      isInitialized.value = true;
      fetchEvents(controller);

      setTimeout(() => {
        if (isBootstrapping.value)
          isBootstrapping.value = false;
      }, 1200);
    }

    onUnmounted(() => {
      subscriberCount.value = Math.max(0, subscriberCount.value - 1);

      if (subscriberCount.value === 0 && controllerState.value) {
        controllerState.value.abort();
        controllerState.value = null;
        isInitialized.value = false;
      }
    });
  });

  return {
    signals,
    acks,
    isBootstrapping,
  };
}
