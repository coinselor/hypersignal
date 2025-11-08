import type { ProcessedEvent } from "../../types";

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

/**
 * Composable for deriving the active signal plan from feed signals
 * Tracks latest signal per authorized pubkey and determines the active plan
 */
export function useSignalPlan() {
  const { getAuthorizedPubkeys } = useAuthorization();
  const { signals } = useFeed();
  const config = useRuntimeConfig();

  const authorizedPubkeys = getAuthorizedPubkeys();
  const timeoutSeconds = config.public.signalInactivityTimeoutSeconds;

  /**
   * Get the latest signal per authorized pubkey
   * Returns a map of pubkey -> latest signal
   */
  const latestSignalPerPubkey = computed(() => {
    const latestMap = new Map<string, ProcessedEvent>();

    // Process signals in order (already newest first from useFeed)
    for (const signal of signals.value) {
      if (authorizedPubkeys.includes(signal.pubkey)) {
        // Only store if we haven't seen this pubkey yet (newest wins)
        if (!latestMap.has(signal.pubkey)) {
          latestMap.set(signal.pubkey, signal);
        }
      }
    }

    return latestMap;
  });

  /**
   * Derive the active plan from all latest signals
   * The newest timestamp across all latest signals determines the active action
   * Plans expire after the configured inactivity timeout
   */
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

    // Find the most recent signal across all developers
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

    // The active action is the action from the newest signal
    const activeAction = newestSignal.action;

    // Find all developers whose latest signal matches the active action
    // and track the most recent matching signal timestamp
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

    // Check if the plan has expired based on inactivity timeout
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastMatchingSignal = currentTime - mostRecentMatchingTimestamp;

    if (timeSinceLastMatchingSignal > timeoutSeconds) {
      // Plan has expired - return to ready state
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

    // Find the earliest developer who signed the active action
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
