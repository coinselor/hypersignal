<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";

import type { Profile } from "../composables/use-profiles";

const emit = defineEmits(["openSignalCreator"]);
const { getAuthorizedPubkeys } = useAuthorization();
const { fetchProfiles, getProfile } = useProfiles();
const { activePlan } = useSignalPlan();
const { isBootstrapping } = useFeed();

// Get authorized developer pubkeys from config
const authorizedPubkeys = getAuthorizedPubkeys();

// Fetch profiles for authorized developers
const { data: _profiles, pending: loadingProfiles } = useAsyncData(
  "authorized-dev-profiles",
  () => fetchProfiles(authorizedPubkeys),
);

// Map pubkeys to their profiles (with null fallback for undefined)
const devProfiles = computed(() => {
  const profileMap: Record<string, Profile | null> = {};
  for (const pubkey of authorizedPubkeys) {
    profileMap[pubkey] = getProfile(pubkey).value ?? null;
  }
  return profileMap;
});

// Get signed and pending developers from the active plan
const signedDevs = computed(() => activePlan.value.signedPubkeys);
const pendingDevs = computed(() => activePlan.value.pendingPubkeys);

const { user } = useCurrentUser();
const { isAuthorized: checkAuthorized } = useAuthorization();

// Show button whenever the user is authorized to send signals
const canCreateSignal = computed(() => {
  return Boolean(user.value && checkAuthorized(user.value.pubkey));
});

// Helper to format action into readable title
function getActionTitle(action: string | null): string {
  if (!action)
    return "Hyper Ready.";

  switch (action.toLowerCase()) {
    case "upgrade":
      return "Upgrade Required";
    case "reboot":
      return "Reboot Required";
    default:
      return `${action.charAt(0).toUpperCase()}${action.slice(1)} Required`;
  }
}

// Helper to get triggered-by developer name
function getTriggeredByName(pubkey: string): string {
  const profile = devProfiles.value[pubkey];
  return profile?.display_name || profile?.name || `...${pubkey.slice(-4)}`;
}

// Helper to format Unix timestamp
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <motion.div
    layout
    class="flex flex-col items-center text-center space-y-2"
    :transition="{ layout: { duration: 0.6, ease: 'easeOut' } }"
  >
    <template v-if="isBootstrapping">
      <USkeleton class="h-6 w-20 rounded-full" />
      <USkeleton class="h-9 sm:h-10 w-64 sm:w-80" />
      <USkeleton class="h-4 w-40 mt-2" />
    </template>
    <template v-else>
      <UBadge v-if="activePlan.hasActivePlan" color="neutral" variant="soft">
        Action
      </UBadge>

      <h1 class="font-mono text-3xl sm:text-4xl font-semibold text-primary">
        {{ activePlan.hasActivePlan ? getActionTitle(activePlan.action) : 'Hyper Ready.' }}
      </h1>

      <p v-if="activePlan.hasActivePlan && activePlan.triggeredBy" class="text-sm mt-2">
        Triggered by <span class="text-muted">{{ getTriggeredByName(activePlan.triggeredBy.pubkey) }}</span> on {{ formatTimestamp(activePlan.triggeredBy.timestamp) }}
      </p>
      <p v-else class="text-sm mt-2">
        Monitoring for signals.
      </p>
    </template>
  </motion.div>

  <!-- Send HyperSignal Button with Halo Effect -->
  <AnimatePresence>
    <motion.div
      v-if="canCreateSignal"
      key="create-signal"
      layout
      class="flex justify-center my-16"
      :initial="{ opacity: 0, y: -10, scale: 0.95 }"
      :animate="{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 20, mass: 0.6, bounce: 0.25 } }"
      :exit="{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.35, ease: 'easeIn' } }"
    >
      <HaloButton @click="emit('openSignalCreator')">
        Send HyperSignal
      </HaloButton>
    </motion.div>
  </AnimatePresence>

  <motion.section
    v-if="activePlan.hasActivePlan"
    layout
    class="w-full max-w mt-10"
    :transition="{ layout: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } }"
  >
    <motion.h2
      layout
      class="text-2xl sm:text-3xl tracking-widest text-center font-medium font-mono"
      :transition="{ layout: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }"
    >
      Quorum
    </motion.h2>
    <motion.div
      layout
      class="flex items-center justify-center mb-4"
      :transition="{ layout: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }"
    >
      <motion.div
        layout
        class="text-3xl sm:text-4xl mt-4 font-mono font-semibold"
        :transition="{ layout: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }"
      >
        <template v-if="isBootstrapping">
          <USkeleton class="h-8 w-28" />
        </template>
        <template v-else>
          {{ signedDevs.length }} / {{ authorizedPubkeys.length }}
        </template>
      </motion.div>
    </motion.div>

    <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 justify-between">
      <!-- Signed (left) -->
      <div class="px-2 sm:px-4 md:px-8 md:justify-self-end text-center md:text-right flex flex-col items-center md:items-end">
        <h3 class="text-sm mb-4 text-muted">
          Signed
        </h3>
        <div v-if="loadingProfiles || isBootstrapping" class="w-full">
          <div class="grid sm:hidden w-full grid-cols-3 grid-rows-2 gap-3 place-items-center overflow-visible">
            <USkeleton v-for="n in 6" :key="n" class="rounded-full h-16 w-16" />
          </div>
          <div class="hidden sm:grid w-full grid-cols-3 gap-2 place-items-center md:justify-items-end">
            <USkeleton v-for="n in 6" :key="n" class="rounded-full h-20 w-20 md:!w-20 md:!h-20" />
          </div>
        </div>
        <div v-else class="w-full">
          <!-- Mobile: 2 rows of 4, larger avatars -->
          <div class="grid sm:hidden w-full grid-cols-3 grid-rows-2 gap-3 place-items-center overflow-visible">
            <UTooltip v-for="pubkey in signedDevs.slice(0, 8)" :key="pubkey" :delay-duration="0" :text="devProfiles[pubkey]?.display_name || devProfiles[pubkey]?.name || `...${pubkey.slice(-4)}`">
              <ProfileAvatar :profile="devProfiles[pubkey]" :pubkey="pubkey" size="2xl" class="hover:ring-primary transition cursor-pointer" />
            </UTooltip>
          </div>
          <!-- Tablet/Desktop: fixed 4 per row, bigger avatars -->
          <div class="hidden sm:grid w-full grid-cols-3 gap-2 place-items-center md:justify-items-end">
            <UTooltip v-for="pubkey in signedDevs.slice(0, 8)" :key="pubkey" :delay-duration="0" :text="devProfiles[pubkey]?.display_name || devProfiles[pubkey]?.name || `...${pubkey.slice(-4)}`">
              <ProfileAvatar :profile="devProfiles[pubkey]" :pubkey="pubkey" size="3xl" class="hover:ring-primary transition cursor-pointer md:!w-20 md:!h-20" />
            </UTooltip>
          </div>
        </div>
      </div>
      <div class="hidden md:block" />
      <!-- Pending (right) -->
      <div class="px-2 sm:px-4 md:px-8 text-center md:text-left flex flex-col items-center md:items-start">
        <h3 class="text-sm mb-4 text-muted">
          Pending
        </h3>
        <div v-if="loadingProfiles || isBootstrapping" class="w-full">
          <div class="grid sm:hidden w-full grid-cols-3 grid-rows-2 gap-3 place-items-center overflow-visible">
            <USkeleton v-for="n in 6" :key="n" class="rounded-full h-16 w-16" />
          </div>
          <div class="hidden sm:grid w-full grid-cols-3 gap-2 place-items-center md:justify-items-start">
            <USkeleton v-for="n in 6" :key="n" class="rounded-full h-20 w-20 md:!w-20 md:!h-20" />
          </div>
        </div>
        <div v-else class="w-full">
          <!-- Mobile: 2 rows of 4, larger avatars -->
          <div class="grid sm:hidden w-full grid-cols-3 grid-rows-2 gap-3 place-items-center overflow-visible">
            <UTooltip v-for="pubkey in pendingDevs.slice(0, 8)" :key="pubkey" :delay-duration="0" :text="devProfiles[pubkey]?.display_name || devProfiles[pubkey]?.name || `...${pubkey.slice(-4)}`">
              <ProfileAvatar :profile="devProfiles[pubkey]" :pubkey="pubkey" size="2xl" class="hover:ring-primary transition cursor-pointer" />
            </UTooltip>
          </div>
          <!-- Tablet/Desktop: fixed 4 per row, bigger avatars -->
          <div class="hidden sm:grid w-full grid-cols-3 gap-2 place-items-center md:justify-items-start">
            <UTooltip v-for="pubkey in pendingDevs.slice(0, 8)" :key="pubkey" :delay-duration="0" :text="devProfiles[pubkey]?.display_name || devProfiles[pubkey]?.name || `...${pubkey.slice(-4)}`">
              <ProfileAvatar :profile="devProfiles[pubkey]" :pubkey="pubkey" size="3xl" class="hover:ring-primary transition cursor-pointer md:!w-20 md:!h-20" />
            </UTooltip>
          </div>
        </div>
      </div>
    </div>
  </motion.section>
</template>
