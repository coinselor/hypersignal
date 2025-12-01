<script setup lang="ts">
const { getConnectedRelayCount, getTotalRelayCount } = useRelayManager();
const showRelayModal = ref(false);

const connectedCount = computed(() => getConnectedRelayCount());
const totalCount = computed(() => getTotalRelayCount());

const dotColor = computed(() => {
  if (totalCount.value === 0) {
    return "bg-gray-500";
  }
  if (connectedCount.value === totalCount.value) {
    return "bg-green-500";
  }
  if (connectedCount.value > 0) {
    return "bg-amber-500";
  }
  return "bg-red-500";
});
</script>

<template>
  <footer
    class="p-4 sm:p-6 lg:p-8 mt-auto flex justify-center items-center gap-x-4 text-sm text-stone-500 dark:text-stone-400"
  >
    <p class="font-mono text-lg">
      Built by Aliens
    </p>
    <div class="h-4 w-px bg-stone-300 dark:bg-stone-700" />

    <UButton
      variant="ghost"
      color="neutral"
      size="sm"
      icon="i-lucide-server"
      @click="showRelayModal = true"
    >
      <template #trailing>
        <span class="inline-block w-2 h-2 rounded-full" :class="dotColor" />
      </template>
      Relays: {{ totalCount }}
    </UButton>

    <div class="h-4 w-px bg-stone-300 dark:bg-stone-700" />
    <ColorModeButton />

    <RelayManagerModal
      :open="showRelayModal"
      @update:open="showRelayModal = $event"
    />
  </footer>
</template>
