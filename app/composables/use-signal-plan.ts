import type { ProcessedEvent } from "../../shared/types/events";

export type SignalPlan = {
  action: string | null;
  signedPubkeys: string[];
  pendingPubkeys: string[];
  triggeredBy: {
    pubkey: string;
    timestamp: number;
  } | null;
  hasActivePlan: boolean;
};

export function useSignalPlan() {
  const { getAuthorizedPubkeys } = useAuthorization();
  const { signals } = useFeed();
  const config = useRuntimeConfig();

  const authorizedPubkeys = getAuthorizedPubkeys();
  const timeoutSeconds = config.public.signalInactivityTimeoutSeconds;

  const latestSignalPerPubkey = computed(() => {
    const latestMap = new Map<string, ProcessedEvent>();

    for (const signal of signals.value) {
      if (authorizedPubkeys.includes(signal.pubkey)) {
        if (!latestMap.has(signal.pubkey)) {
          latestMap.set(signal.pubkey, signal);
        }
      }
    }

    return latestMap;
  });

  const activePlan = computed((): SignalPlan => {
    const latestSignals = latestSignalPerPubkey.value;

    if (latestSignals.size === 0) {
      return {
        action: null,
        signedPubkeys: [],
        pendingPubkeys: authorizedPubkeys,
        triggeredBy: null,
        hasActivePlan: false,
      };
    }

    let newestSignal: ProcessedEvent | null = null;
    let newestTimestamp = 0;

    for (const signal of latestSignals.values()) {
      const timestamp = signal.rawEvent.created_at;
      if (timestamp > newestTimestamp) {
        newestTimestamp = timestamp;
        newestSignal = signal;
      }
    }

    if (!newestSignal) {
      return {
        action: null,
        signedPubkeys: [],
        pendingPubkeys: authorizedPubkeys,
        triggeredBy: null,
        hasActivePlan: false,
      };
    }

    const activeAction = newestSignal.action;

    const signedPubkeys: string[] = [];
    let mostRecentMatchingTimestamp = 0;

    for (const [pubkey, signal] of latestSignals.entries()) {
      if (signal.action === activeAction) {
        signedPubkeys.push(pubkey);
        const timestamp = signal.rawEvent.created_at;
        if (timestamp > mostRecentMatchingTimestamp) {
          mostRecentMatchingTimestamp = timestamp;
        }
      }
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastMatchingSignal = currentTime - mostRecentMatchingTimestamp;

    if (timeSinceLastMatchingSignal > timeoutSeconds) {
      return {
        action: null,
        signedPubkeys: [],
        pendingPubkeys: authorizedPubkeys,
        triggeredBy: null,
        hasActivePlan: false,
      };
    }

    // Pending developers are those who either:
    // - Have no signal
    // - Have a signal with a different action than the active plan
    const pendingPubkeys = authorizedPubkeys.filter(
      pk => !signedPubkeys.includes(pk),
    );

    let triggeredBy: { pubkey: string; timestamp: number } | null = null;
    let earliestTimestamp = Number.POSITIVE_INFINITY;

    for (const [pubkey, signal] of latestSignals.entries()) {
      if (signal.action === activeAction) {
        const timestamp = signal.rawEvent.created_at;
        if (timestamp < earliestTimestamp) {
          earliestTimestamp = timestamp;
          triggeredBy = { pubkey, timestamp };
        }
      }
    }

    return {
      action: activeAction,
      signedPubkeys,
      pendingPubkeys,
      triggeredBy,
      hasActivePlan: true,
    };
  });

  return {
    activePlan,
    latestSignalPerPubkey,
  };
}
