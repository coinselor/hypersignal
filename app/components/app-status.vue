<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";

import type { Profile } from "../composables/use-profiles";

const emit = defineEmits(["openSignalCreator"]);
const { getAuthorizedPubkeys } = useAuthorization();
const { fetchProfiles, getProfile } = useProfiles();
const { activePlan } = useSignalPlan();
const { isBootstrapping } = useFeed();

const authorizedPubkeys = getAuthorizedPubkeys();

const { data: _profiles, pending: loadingProfiles } = useAsyncData(
  "authorized-dev-profiles",
  () => fetchProfiles(authorizedPubkeys),
);

const devProfiles = computed(() => {
  const profileMap: Record<string, Profile | null> = {};
  for (const pubkey of authorizedPubkeys) {
    profileMap[pubkey] = getProfile(pubkey).value ?? null;
  }
  return profileMap;
});

const signedDevs = computed(() => activePlan.value.signedPubkeys);
const pendingDevs = computed(() => activePlan.value.pendingPubkeys);

const { user } = useCurrentUser();
const { isAuthorized: checkAuthorized } = useAuthorization();

const canCreateSignal = computed(() => {
  return Boolean(user.value && checkAuthorized(user.value.pubkey));
});

const actionHeadlineClass = computed(() => {
  if (!activePlan.value.hasActivePlan)
    return "text-primary";

  const action = activePlan.value.action?.toLowerCase?.();

  if (action === "reboot")
    return "text-cyan-400";

  return "text-primary";
});

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

function getTriggeredByName(pubkey: string): string {
  const profile = devProfiles.value[pubkey];
  return profile?.display_name || profile?.name || `...${pubkey.slice(-4)}`;
}

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
    class="flex flex-col items-center text-center space-y-2"
    :initial="{ opacity: 0, y: -8 }"
    :animate="{
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    }"
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

      <h1
        class="font-mono text-3xl sm:text-4xl font-semibold"
        :class="actionHeadlineClass"
      >
        {{
          activePlan.hasActivePlan
            ? getActionTitle(activePlan.action)
            : "Hyper Ready."
        }}
      </h1>

      <p
        v-if="activePlan.hasActivePlan && activePlan.triggeredBy"
        class="text-sm mt-2"
      >
        Triggered by
        <span class="text-muted">{{
          getTriggeredByName(activePlan.triggeredBy.pubkey)
        }}</span>
        on {{ formatTimestamp(activePlan.triggeredBy.timestamp) }}
      </p>
      <p v-else class="text-sm mt-2">
        Monitoring for signals.
      </p>
    </template>
  </motion.div>

  <AnimatePresence>
    <motion.div
      v-if="canCreateSignal"
      key="create-signal"
      class="flex justify-center my-16"
      :initial="{ opacity: 0, y: -10, scale: 0.95 }"
      :animate="{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 220,
          damping: 20,
          mass: 0.6,
          bounce: 0.25,
        },
      }"
      :exit="{
        opacity: 0,
        y: -10,
        scale: 0.95,
        transition: { duration: 0.35, ease: 'easeIn' },
      }"
    >
      <HaloButton @click="emit('openSignalCreator')">
        Send HyperSignal
      </HaloButton>
    </motion.div>
  </AnimatePresence>

  <motion.section v-if="activePlan.hasActivePlan" class="w-full max-w mt-10">
    <motion.h2
      class="text-2xl sm:text-3xl tracking-widest text-center font-medium font-mono"
    >
      Quorum
    </motion.h2>
    <motion.div class="flex items-center justify-center mb-4">
      <motion.div class="text-3xl sm:text-4xl mt-4 font-mono font-semibold">
        <template v-if="isBootstrapping">
          <USkeleton class="h-8 w-28" />
        </template>
        <template v-else>
          {{ signedDevs.length }} / {{ authorizedPubkeys.length }}
        </template>
      </motion.div>
    </motion.div>

    <div
      class="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 justify-between"
    >
      <div
        class="px-2 sm:px-4 md:px-8 md:justify-self-end text-center md:text-right flex flex-col items-center md:items-end"
      >
        <h3 class="text-sm mb-4 text-muted">
          Signed
        </h3>
        <div v-if="loadingProfiles || isBootstrapping" class="w-full">
          <div
            class="grid sm:hidden w-full grid-cols-3 grid-rows-2 gap-3 place-items-center overflow-visible"
          >
            <USkeleton v-for="n in 6" :key="n" class="rounded-full h-16 w-16" />
          </div>
          <div
            class="hidden sm:grid w-full grid-cols-3 gap-2 place-items-center md:justify-items-end"
          >
            <USkeleton
              v-for="n in 6"
              :key="n"
              class="rounded-full h-20 w-20 md:w-20! md:h-20!"
            />
          </div>
        </div>
        <div v-else class="w-full">
          <div
            class="grid sm:hidden w-full grid-cols-3 grid-rows-2 gap-3 place-items-center overflow-visible"
          >
            <UTooltip
              v-for="pubkey in signedDevs.slice(0, 8)"
              :key="pubkey"
              :delay-duration="0"
              :text="
                devProfiles[pubkey]?.display_name
                  || devProfiles[pubkey]?.name
                  || `...${pubkey.slice(-4)}`
              "
            >
              <ProfileAvatar
                :profile="devProfiles[pubkey]"
                :pubkey="pubkey"
                size="2xl"
                class="hover:ring-primary transition cursor-pointer"
              />
            </UTooltip>
          </div>
          <div
            class="hidden sm:grid w-full grid-cols-3 gap-2 place-items-center md:justify-items-end"
          >
            <UTooltip
              v-for="pubkey in signedDevs.slice(0, 8)"
              :key="pubkey"
              :delay-duration="0"
              :text="
                devProfiles[pubkey]?.display_name
                  || devProfiles[pubkey]?.name
                  || `...${pubkey.slice(-4)}`
              "
            >
              <ProfileAvatar
                :profile="devProfiles[pubkey]"
                :pubkey="pubkey"
                size="3xl"
                class="hover:ring-primary transition cursor-pointer md:w-20! md:h-20!"
              />
            </UTooltip>
          </div>
        </div>
      </div>
      <div class="hidden md:block" />
      <div
        class="px-2 sm:px-4 md:px-8 text-center md:text-left flex flex-col items-center md:items-start"
      >
        <h3 class="text-sm mb-4 text-muted">
          Pending
        </h3>
        <div v-if="loadingProfiles || isBootstrapping" class="w-full">
          <div
            class="grid sm:hidden w-full grid-cols-3 grid-rows-2 gap-3 place-items-center overflow-visible"
          >
            <USkeleton v-for="n in 6" :key="n" class="rounded-full h-16 w-16" />
          </div>
          <div
            class="hidden sm:grid w-full grid-cols-3 gap-2 place-items-center md:justify-items-start"
          >
            <USkeleton
              v-for="n in 6"
              :key="n"
              class="rounded-full h-20 w-20 md:w-20! md:h-20!"
            />
          </div>
        </div>
        <div v-else class="w-full">
          <div
            class="grid sm:hidden w-full grid-cols-3 grid-rows-2 gap-3 place-items-center overflow-visible"
          >
            <UTooltip
              v-for="pubkey in pendingDevs.slice(0, 8)"
              :key="pubkey"
              :delay-duration="0"
              :text="
                devProfiles[pubkey]?.display_name
                  || devProfiles[pubkey]?.name
                  || `...${pubkey.slice(-4)}`
              "
            >
              <ProfileAvatar
                :profile="devProfiles[pubkey]"
                :pubkey="pubkey"
                size="2xl"
                class="hover:ring-primary transition cursor-pointer"
              />
            </UTooltip>
          </div>
          <div
            class="hidden sm:grid w-full grid-cols-3 gap-2 place-items-center md:justify-items-start"
          >
            <UTooltip
              v-for="pubkey in pendingDevs.slice(0, 8)"
              :key="pubkey"
              :delay-duration="0"
              :text="
                devProfiles[pubkey]?.display_name
                  || devProfiles[pubkey]?.name
                  || `...${pubkey.slice(-4)}`
              "
            >
              <ProfileAvatar
                :profile="devProfiles[pubkey]"
                :pubkey="pubkey"
                size="3xl"
                class="hover:ring-primary transition cursor-pointer md:w-20! md:h-20!"
              />
            </UTooltip>
          </div>
        </div>
      </div>
    </div>
  </motion.section>
</template>
