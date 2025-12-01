<script setup lang="ts">
import { nip19 } from "nostr-tools";
import { computed, onMounted, watch } from "vue";

import type { ProcessedEvent } from "../../shared/types/events";

import { formatFriendlyDate, truncateHash } from "../utils/format";

const props = defineProps<{
  signal: ProcessedEvent;
}>();

const emit = defineEmits(["openModal"]);

const { fetchProfile, getProfile } = useProfiles();

const profile = getProfile(props.signal.pubkey);

const displayName = computed(() => {
  return (
    profile.value?.display_name
    || profile.value?.name
    || props.signal.author.name
    || `...${props.signal.pubkey.slice(-4)}`
  );
});

const createdAt = computed(() => {
  return formatFriendlyDate(props.signal.rawEvent.created_at);
});

const contentPreview = computed(() => props.signal.content?.trim() ?? "");

const actionLabel = computed(() => {
  const action = props.signal.action?.toLowerCase?.();
  if (!action)
    return "Signal";
  return action.charAt(0).toUpperCase() + action.slice(1);
});

const accentBadgeColor = computed(() => {
  const action = props.signal.action;
  if (action === "upgrade")
    return "primary";
  if (action === "reboot")
    return "info";
  return "warning";
});

const accentBadgeClasses = computed(() => {
  if (props.signal.action === "reboot")
    return "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-200 dark:ring-cyan-400/40";

  return "";
});

const npubLabel = computed(() => {
  const pubkey = props.signal.pubkey;
  if (!pubkey)
    return "";

  try {
    const npub = nip19.npubEncode(pubkey);
    return truncateHash(npub, 10, 6);
  }
  catch {
    return truncateHash(pubkey, 6, 6);
  }
});

onMounted(() => {
  void fetchProfile(props.signal.pubkey);
});

watch(
  () => props.signal.pubkey,
  (pubkey) => {
    if (pubkey) {
      void fetchProfile(pubkey);
    }
  },
);
</script>

<template>
  <UCard
    class="group relative mx-auto max-w-xl overflow-hidden bg-stone-50/95 dark:bg-stone-950/60 shadow-sm backdrop-blur-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl/40"
    :ui="{
      body: 'p-6 sm:p-8 pr-12',
    }"
    @click="emit('openModal', props.signal)"
  >
    <UIcon
      name="i-heroicons-chevron-right"
      class="absolute right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 shrink-0 text-zinc-300 transition-colors duration-200 sm:block group-hover:text-primary-400"
    />
    <div class="flex flex-col gap-5">
      <div class="flex items-start gap-4">
        <ProfileAvatar
          :profile="profile"
          :pubkey="props.signal.pubkey"
          size="lg"
          class="shrink-0"
        />

        <div class="flex-1 space-y-3">
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="text-base font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {{ displayName }}
                </span>
                <UBadge
                  :color="accentBadgeColor"
                  variant="soft"
                  size="sm"
                  class="capitalize"
                  :class="accentBadgeClasses"
                >
                  {{ actionLabel }}
                </UBadge>
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">
                <span class="font-mono lowercase">{{ npubLabel }}</span>
              </div>
            </div>

            <div class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{{ createdAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <p
        v-if="contentPreview"
        class="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line line-clamp-3"
      >
        {{ contentPreview }}
      </p>
      <p v-else class="text-sm italic text-zinc-400 dark:text-zinc-500">
        No message provided.
      </p>
    </div>
  </UCard>
</template>
