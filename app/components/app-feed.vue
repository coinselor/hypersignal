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

const { signals, acks, isBootstrapping } = useFeed();

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
        <div v-if="isBootstrapping" class="space-y-4 mt-4">
          <UCard
            v-for="n in 3"
            :key="`sig-skel-${n}`"
            class="group relative mx-auto max-w-xl overflow-hidden bg-stone-50/95 dark:bg-stone-950/60 shadow-sm backdrop-blur-sm"
            :ui="{ body: 'p-6 sm:p-8 pr-12' }"
          >
            <div class="flex flex-col gap-5">
              <div class="flex items-start gap-4">
                <USkeleton class="rounded-full h-12 w-12 sm:h-14 sm:w-14 shrink-0" />
                <div class="flex-1 space-y-3 w-full">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between w-full">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <USkeleton class="h-5 w-36" />
                        <USkeleton class="h-5 w-16 rounded-md" />
                      </div>
                      <USkeleton class="h-3 w-24" />
                    </div>
                    <USkeleton class="h-3 w-16" />
                  </div>
                </div>
              </div>
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-3/4" />
            </div>
          </UCard>
        </div>
        <div v-else-if="signals.length > 0" class="space-y-4 mt-4">
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
        <div v-if="isBootstrapping" class="space-y-4 mt-4">
          <UCard
            v-for="n in 3"
            :key="`ack-skel-${n}`"
            class="group relative mx-auto max-w-xl overflow-hidden bg-stone-50/95 dark:bg-stone-950/60 shadow-sm backdrop-blur-sm"
            :ui="{ body: 'p-6 sm:p-8 pr-12' }"
          >
            <div class="flex flex-col gap-5">
              <div class="flex items-start gap-4">
                <USkeleton class="rounded-full h-12 w-12 sm:h-14 sm:w-14 shrink-0" />
                <div class="flex-1 space-y-3 w-full">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between w-full">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <USkeleton class="h-5 w-36" />
                        <USkeleton class="h-5 w-16 rounded-md" />
                      </div>
                      <USkeleton class="h-3 w-24" />
                    </div>
                    <USkeleton class="h-3 w-16" />
                  </div>
                </div>
              </div>
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-3/4" />
            </div>
          </UCard>
        </div>
        <div v-else-if="acks.length > 0" class="space-y-4 mt-4">
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
      :signal="selectedSignal"
      @update:open="isDetailModalOpen = $event"
    />

    <AppFeedRawModal
      v-model="isRawModalOpen"
      :signal="selectedSignal"
    />
  </div>
</template>
