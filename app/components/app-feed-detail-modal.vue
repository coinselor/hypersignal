<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import type { ProcessedEvent } from "../../types";

import { formatDate, truncateHash } from "../utils/format";

const props = defineProps<{
  open: boolean;
  signal: ProcessedEvent | null;
}>();

const emit = defineEmits(["update:open"]);

const { fetchProfile, getProfile } = useProfiles();

const profile = computed(() => {
  const pubkey = props.signal?.pubkey;
  if (!pubkey)
    return null;

  return getProfile(pubkey).value ?? null;
});

watch(
  () => props.signal?.pubkey,
  (pubkey) => {
    if (pubkey)
      void fetchProfile(pubkey);
  },
  { immediate: true },
);

const displayName = computed(() => {
  if (!props.signal)
    return "Unknown";

  return profile.value?.display_name
    || profile.value?.name
    || props.signal.author.name
    || `...${props.signal.pubkey.slice(-4)}`;
});

const createdAt = computed(() => {
  const timestamp = props.signal?.rawEvent.created_at;
  if (!timestamp)
    return "—";

  return formatDate(timestamp);
});

const pubkeyFull = computed(() => props.signal?.pubkey ?? "");
const eventIdFull = computed(() => props.signal?.id ?? "");

const pubkeyLabel = computed(() => pubkeyFull.value ? truncateHash(pubkeyFull.value, 12, 12) : "");
const eventIdLabel = computed(() => eventIdFull.value ? truncateHash(eventIdFull.value, 10, 8) : "");

const content = computed(() => props.signal?.content?.trim() ?? "");

const actionLabel = computed(() => {
  const action = props.signal?.action?.toLowerCase();
  if (action === "upgrade" || action === "reboot")
    return action.charAt(0).toUpperCase() + action.slice(1);
  return props.signal?.action ? props.signal.action : "Signal";
});

const actionColor = computed(() => props.signal?.action === "upgrade" ? "primary" : "neutral");

const modalTitle = computed(() => {
  const base = actionLabel.value && (actionLabel.value === "Signal" ? null : actionLabel.value);
  return base ? `${base} Signal` : "Signal";
});

const tagItems = computed(() => {
  if (!props.signal?.rawEvent.tags?.length)
    return [];

  return props.signal.rawEvent.tags.map((tag, index) => ({
    index,
    text: JSON.stringify(tag),
  }));
});

const hasTags = computed(() => tagItems.value.length > 0);

const copiedField = ref<"pubkey" | "eventId" | null>(null);
const copiedRawJson = ref(false);

let fieldCopyTimeout: ReturnType<typeof setTimeout> | null = null;
let rawCopyTimeout: ReturnType<typeof setTimeout> | null = null;

function handleCopy(field: "pubkey" | "eventId", value: string) {
  if (!value)
    return;

  navigator.clipboard.writeText(value);
  copiedField.value = field;
  if (fieldCopyTimeout)
    clearTimeout(fieldCopyTimeout);
  fieldCopyTimeout = setTimeout(() => {
    if (copiedField.value === field)
      copiedField.value = null;
    fieldCopyTimeout = null;
  }, 1500);
}

function copyRawJson() {
  if (!props.signal)
    return;

  navigator.clipboard.writeText(JSON.stringify(props.signal.rawEvent, null, 2));
  copiedRawJson.value = true;
  if (rawCopyTimeout)
    clearTimeout(rawCopyTimeout);
  rawCopyTimeout = setTimeout(() => {
    copiedRawJson.value = false;
    rawCopyTimeout = null;
  }, 1500);
}

function resetCopyState() {
  copiedField.value = null;
  copiedRawJson.value = false;
  if (fieldCopyTimeout) {
    clearTimeout(fieldCopyTimeout);
    fieldCopyTimeout = null;
  }
  if (rawCopyTimeout) {
    clearTimeout(rawCopyTimeout);
    rawCopyTimeout = null;
  }
}

watch(() => props.signal, () => {
  resetCopyState();
});

onBeforeUnmount(() => {
  resetCopyState();
});

function closeModal() {
  emit("update:open", false);
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="modalTitle"
    :ui="{
      body: 'px-6 py-6 space-y-6',
      footer: 'sm:flex sm:items-center sm:justify-between sm:px-6 sm:py-4 gap-3',
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #description>
      <span class="sr-only">Detailed signal metadata and context.</span>
    </template>
    <template #body>
      <div v-if="signal" class="space-y-6">
        <div class="flex items-center gap-4">
          <ProfileAvatar :profile="profile" :pubkey="signal.pubkey" size="xl" class="shrink-0" />

          <div class="flex-1">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ displayName }}</span>
                <UBadge :color="actionColor" variant="soft" class="text-xs capitalize">
                  {{ actionLabel }}
                </UBadge>
              </div>
              <div class="flex items-center gap-1 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
                <span>{{ createdAt }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="content" class="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/70 p-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {{ content }}
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Action</span>
            <p class="text-sm text-zinc-800 dark:text-zinc-200 capitalize">
              {{ actionLabel }}
            </p>
          </div>
          <div>
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Network</span>
            <p class="font-mono text-sm text-zinc-800 dark:text-zinc-200">
              {{ signal.network || '—' }}
            </p>
          </div>
          <div>
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Version</span>
            <p class="font-mono text-sm text-zinc-800 dark:text-zinc-200">
              {{ signal.version || '0.0.0' }}
            </p>
          </div>
          <div>
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Kind</span>
            <p class="font-mono text-sm text-zinc-800 dark:text-zinc-200">
              {{ signal.rawEvent.kind ?? '—' }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Pubkey</span>
            <div class="flex items-center gap-2">
              <p class="font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">
                {{ pubkeyLabel }}
              </p>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                :icon="copiedField === 'pubkey' ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
                class="-ml-1"
                @click="handleCopy('pubkey', pubkeyFull)"
              />
            </div>
          </div>

          <div>
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Event ID</span>
            <div class="flex items-center gap-2">
              <p class="font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">
                {{ eventIdLabel }}
              </p>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                :icon="copiedField === 'eventId' ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
                class="-ml-1"
                @click="handleCopy('eventId', eventIdFull)"
              />
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Tags
          </h3>
          <div v-if="hasTags" class="space-y-2">
            <div
              v-for="tag in tagItems"
              :key="tag.index"
              class="flex items-start gap-2 font-mono text-xs text-zinc-700 dark:text-zinc-300"
            >
              <span class="text-lime-600 dark:text-lime-400">[{{ tag.index }}]</span>
              <span class="break-all">{{ tag.text }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-zinc-500 dark:text-zinc-400">
            No tags attached to this event.
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <UButton
          color="neutral"
          variant="ghost"
          class="w-full sm:w-auto"
          @click="closeModal"
        >
          Close
        </UButton>
        <UButton
          color="primary"
          variant="soft"
          class="w-full sm:w-auto"
          :icon="copiedRawJson ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
          @click="copyRawJson"
        >
          {{ copiedRawJson ? 'Copied!' : 'Copy raw JSON' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
