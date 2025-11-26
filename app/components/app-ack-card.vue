<script setup lang="ts">
import type { ProcessedEvent } from "../../shared/types/events";

defineProps<{
  ack: ProcessedEvent;
}>();
</script>

<template>
  <UCard>
    <div class="flex gap-4">
      <div class="flex-shrink-0">
        <UAvatar :src="ack.author.picture" :alt="ack.author.name" size="lg" />
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <p class="font-bold">
            {{ ack.author.name }}
          </p>
          <UBadge :color="ack.status === 'success' ? 'success' : 'error'" variant="soft">
            {{ ack.status }}
          </UBadge>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Node: {{ ack.node_id }}
        </p>
        <p class="mt-2 text-gray-700 dark:text-gray-200">
          {{ ack.content }}
        </p>
        <p v-if="ack.error" class="mt-1 text-red-500 dark:text-red-400 text-sm">
          Error: {{ ack.error }}
        </p>
      </div>
    </div>
  </UCard>
</template>
