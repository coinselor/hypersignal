<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";

import type { Profile } from "../composables/use-profiles";

const emit = defineEmits(["openSignalCreator"]);
const { getAuthorizedPubkeys } = useAuthorization();
const { fetchProfiles, getProfile } = useProfiles();
const { signals } = useFeed();

// Check if there are any active signals
const hasActiveSignals = computed(() => signals.value.length > 0);

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

const signedPubkeySet = computed(() => {
  const signed = new Set<string>();

  for (const signal of signals.value) {
    if (authorizedPubkeys.includes(signal.pubkey)) {
      signed.add(signal.pubkey);
    }
  }

  return signed;
});

const signedDevs = computed(() => {
  return authorizedPubkeys.filter(pk => signedPubkeySet.value.has(pk));
});

const pendingDevs = computed(() => {
  return authorizedPubkeys.filter(pk => !signedPubkeySet.value.has(pk));
});

const { user } = useCurrentUser();
const { isAuthorized: checkAuthorized } = useAuthorization();

// Show button whenever the user is authorized to send signals
const canCreateSignal = computed(() => {
  return Boolean(user.value && checkAuthorized(user.value.pubkey));
});
</script>

<template>
  <motion.div
    layout
    class="flex flex-col items-center text-center space-y-2"
    :transition="{ layout: { duration: 0.6, ease: 'easeOut' } }"
  >
    <UBadge v-if="hasActiveSignals" color="neutral" variant="soft">
      Action
    </UBadge>

    <h1 class="font-mono text-3xl sm:text-4xl font-semibold text-primary">
      {{ hasActiveSignals ? 'Upgrade Required' : 'Hyper Ready.' }}
    </h1>

    <p v-if="hasActiveSignals" class="text-sm mt-2">
      Triggered by <span class="text-muted">Username</span> on March 25th, 2025
    </p>
    <p v-else class="text-sm mt-2">
      Monitoring for signals.
    </p>
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
        {{ signedDevs.length }} / {{ authorizedPubkeys.length }}
      </motion.div>
    </motion.div>

    <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 justify-between">
      <!-- Signed (left) -->
      <div class="px-2 sm:px-4 md:px-8 md:justify-self-end text-center md:text-right flex flex-col items-center md:items-end">
        <h3 class="text-sm mb-4 text-muted">
          Signed
        </h3>
        <div v-if="loadingProfiles" class="flex items-center justify-center py-4">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-2xl text-gray-400" />
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
        <div v-if="loadingProfiles" class="flex items-center justify-center py-4">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-2xl text-gray-400" />
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
