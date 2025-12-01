<script setup lang="ts">
import type { RelayStatus } from "../composables/use-nostr-pool";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const {
  getRelayStatuses,
  addUserRelay,
  removeRelay,
  getPublicRelays,
  getSpecialRelays,
  getUserRelays,
} = useRelayManager();

const allStatuses = computed(() => getRelayStatuses());
const publicRelayUrls = computed(() => getPublicRelays());
const specialRelayUrls = computed(() => getSpecialRelays());
const userRelayUrls = computed(() => getUserRelays());

const publicRelays = computed(() =>
  allStatuses.value.filter(r => publicRelayUrls.value.includes(r.url)),
);

const specialRelays = computed(() =>
  allStatuses.value.filter(r => specialRelayUrls.value.includes(r.url)),
);

const userRelays = computed(() =>
  allStatuses.value.filter(r => userRelayUrls.value.includes(r.url)),
);

const newRelayUrl = ref("");
const toast = useToast();
const isAdding = ref(false);

async function handleAddRelay() {
  const url = newRelayUrl.value.trim();

  if (!url) {
    return;
  }

  // Basic validation
  if (!url.startsWith("wss://") && !url.startsWith("ws://")) {
    toast.add({
      title: "Invalid URL",
      description: "Relay URL must start with ws:// or wss://",
      color: "error",
    });
    return;
  }

  isAdding.value = true;
  try {
    await addUserRelay(url);
    newRelayUrl.value = "";

    toast.add({
      title: "Relay Added",
      description: `${url} connected successfully`,
      color: "success",
    });
  }
  catch (error) {
    toast.add({
      title: "Failed to add relay",
      description: error instanceof Error ? error.message : "Unknown error",
      color: "error",
    });
  }
  finally {
    isAdding.value = false;
  }
}

function handleRemoveRelay(url: string) {
  try {
    removeRelay(url);

    toast.add({
      title: "Relay Removed",
      description: `${url} disconnected successfully`,
      color: "success",
    });
  }
  catch (error) {
    toast.add({
      title: "Failed to remove relay",
      description: error instanceof Error ? error.message : "Unknown error",
      color: "error",
    });
  }
}

function getStatusColor(status: RelayStatus) {
  if (status.connected) {
    return "text-green-500";
  }
  if (status.error) {
    return "text-red-500";
  }
  return "text-yellow-500";
}

function getStatusIcon(status: RelayStatus) {
  if (status.connected) {
    return "i-lucide-wifi";
  }
  if (status.error) {
    return "i-lucide-wifi-off";
  }
  return "i-lucide-loader-circle";
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Relay Manager"
    description="Manage your Nostr relay connections"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-6">
        <div>
          <h4 class="font-semibold text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
            Public Relays
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            General-purpose relays for standard Nostr events
          </p>
          <div class="space-y-2">
            <div v-for="relay in publicRelays" :key="relay.url" class="flex items-center gap-3 py-2">
              <UIcon
                :name="getStatusIcon(relay)"
                class="text-lg shrink-0"
                :class="[getStatusColor(relay), { 'animate-spin': !relay.connected && !relay.error }]"
              />
              <p class="font-mono text-sm truncate flex-1">
                {{ relay.url }}
              </p>
              <UButton
                color="error"
                variant="ghost"
                size="xs"
                icon="i-lucide-trash-2"
                @click="handleRemoveRelay(relay.url)"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-semibold text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
            Special Relays
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Specialized relays for HyperSignal custom events (kinds 33321, 3333)
          </p>
          <div class="space-y-2">
            <div v-for="relay in specialRelays" :key="relay.url" class="flex items-center gap-3 py-2">
              <UIcon
                :name="getStatusIcon(relay)"
                class="text-lg shrink-0"
                :class="[getStatusColor(relay), { 'animate-spin': !relay.connected && !relay.error }]"
              />
              <p class="font-mono text-sm truncate flex-1">
                {{ relay.url }}
              </p>
              <UButton
                color="error"
                variant="ghost"
                size="xs"
                icon="i-lucide-trash-2"
                @click="handleRemoveRelay(relay.url)"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-semibold text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
            Your Custom Relays
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Additional special relays you've added
          </p>

          <div class="flex gap-2 mb-3">
            <UInput
              v-model="newRelayUrl"
              placeholder="wss://relay.example.com"
              class="flex-1"
              size="md"
              :disabled="isAdding"
              @keyup.enter="handleAddRelay"
            />
            <UButton
              color="primary"
              :loading="isAdding"
              :disabled="!newRelayUrl.trim()"
              @click="handleAddRelay"
            >
              Add
            </UButton>
          </div>

          <div v-if="userRelays.length > 0" class="space-y-2">
            <div v-for="relay in userRelays" :key="relay.url" class="flex items-center gap-3 py-2">
              <UIcon
                :name="getStatusIcon(relay)"
                class="text-lg shrink-0"
                :class="[getStatusColor(relay), { 'animate-spin': !relay.connected && !relay.error }]"
              />
              <p class="font-mono text-sm truncate flex-1">
                {{ relay.url }}
              </p>
              <UButton
                color="error"
                variant="ghost"
                size="xs"
                icon="i-lucide-trash-2"
                @click="handleRemoveRelay(relay.url)"
              />
            </div>
          </div>
          <div v-else class="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
            No custom relays added yet
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
