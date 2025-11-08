<script setup lang="ts">
import type { ProcessedEvent } from "../../types";

const items = [{
  slot: "signals",
  label: "Signals",
  icon: "i-heroicons-signal",
}, {
  slot: "acks",
  label: "ACKs",
  icon: "i-heroicons-check-circle",
}];

const { signals, acks } = useFeed();

const currentDate = computed(() => {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",

  });
});

// Modal state
const isDetailModalOpen = ref(false);
const isRawModalOpen = ref(false);
const selectedSignal = ref<ProcessedEvent | null>(null);

function openModal(signal: ProcessedEvent) {
  selectedSignal.value = signal;
  isDetailModalOpen.value = true;
}


watch([isDetailModalOpen, isRawModalOpen], ([isDetailsOpen, isRawOpen]) => {
  if (!isDetailsOpen && !isRawOpen) {
    selectedSignal.value = null;
  }
});
</script>

<template>
  <div v-bind="$attrs">
    <UTabs
      :items="items"
      :ui="{
        list: 'relative flex p-1 group max-w-xl mx-auto',
      }"
    >
      <template #signals>
        <div v-if="signals.length > 0" class="space-y-4 mt-4">
          <AppFeedCard
            v-for="signal in signals"
            :key="signal.id"
            :signal="signal"
            @open-modal="openModal"
          />
        </div>
        <div v-else class="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <p class="text-xl font-medium text-stone-700 dark:text-stone-300">
            Awaiting signals...
          </p>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            No signals received as of {{ currentDate }}
          </p>
        </div>
      </template>

      <template #acks>
        <div v-if="acks.length > 0" class="space-y-4 mt-4">
          <AppAckCard
            v-for="ack in acks"
            :key="ack.id"
            :ack="ack"
          />
        </div>
        <div v-else class="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <p class="text-xl font-medium text-stone-700 dark:text-stone-300">
            Awaiting acknowledgments...
          </p>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            No ACKs received as of {{ currentDate }}
          </p>
        </div>
      </template>
    </UTabs>

    <!-- Modals -->
    <AppFeedDetailModal
      :open="isDetailModalOpen"
      @update:open="isDetailModalOpen = $event"
      :signal="selectedSignal"
    />

    <AppFeedRawModal
      v-model="isRawModalOpen"
      :signal="selectedSignal"
    />
  </div>
</template>
