<script setup lang="ts">
import { nip19 } from "nostr-tools";
import { computed, onMounted, watch } from "vue";

import type { ProcessedEvent } from "../../types";

import { formatFriendlyDate, truncateHash } from "../utils/format";

const props = defineProps<{
  signal: ProcessedEvent;
}>();

const emit = defineEmits(["openModal"]);

const { fetchProfile, getProfile } = useProfiles();

const profile = getProfile(props.signal.pubkey);

const displayName = computed(() => {
  return profile.value?.display_name
    || profile.value?.name
    || props.signal.author.name
    || `...${props.signal.pubkey.slice(-4)}`;
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

const accentBadgeColor = computed(() => props.signal.action === "upgrade" ? "primary" : "warning");

const _accentGradient = computed(() => props.signal.action === "upgrade"
  ? "from-primary-400/80 via-primary-500 to-primary-400/80"
  : "from-amber-400/80 via-amber-500 to-amber-400/80",
);

const _accentIcon = computed(() => props.signal.action === "upgrade"
  ? "i-heroicons-arrow-trending-up"
  : "i-heroicons-arrow-path",
);

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

const metaItems = computed(() => {
  const items = [] as { label: string; icon: string; value: string }[];

  if (props.signal.version) {
    items.push({ label: "Version", icon: "i-heroicons-cog-6-tooth", value: `${props.signal.version}` });
  }

  if (props.signal.network) {
    items.push({ label: "Network", icon: "i-heroicons-globe-alt", value: props.signal.network });
  }

  if (props.signal.status) {
    items.push({
      label: "Status",
      icon: props.signal.status === "success" ? "i-heroicons-check-circle" : "i-heroicons-exclamation-triangle",
      value: props.signal.status,
    });
  }

  return items;
});

onMounted(() => {
  void fetchProfile(props.signal.pubkey);
});

watch(() => props.signal.pubkey, (pubkey) => {
  if (pubkey)
    void fetchProfile(pubkey);
});
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
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-base font-semibold text-zinc-900 dark:text-zinc-100">{{ displayName }}</span>
                <UBadge
                  :color="accentBadgeColor"
                  variant="soft"
                  size="sm"
                  class="capitalize"
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

      <p v-if="contentPreview" class="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line line-clamp-3">
        {{ contentPreview }}
      </p>
      <p v-else class="text-sm italic text-zinc-400 dark:text-zinc-500">
        No message provided.
      </p>

      <div v-if="metaItems.length" class="flex flex-wrap gap-2 pt-2">
        <div
          v-for="item in metaItems"
          :key="item.label"
          class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100/80 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300"
        >
          <span>{{ item.value }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
