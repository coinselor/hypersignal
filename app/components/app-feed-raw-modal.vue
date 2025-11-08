<script setup lang="ts">
import type { ProcessedEvent } from "../../types";

defineProps<{
  modelValue: boolean;
  signal: ProcessedEvent | null;
}>();

const emit = defineEmits(["update:modelValue"]);

const codeBlock = ref<HTMLElement | null>(null);
const isCopied = ref(false);

function copyToClipboard() {
  if (codeBlock.value) {
    navigator.clipboard.writeText(codeBlock.value.textContent || "");
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  }
}
</script>

<template>
  <UModal
    :model-value="modelValue"
    title="Raw Event Data"
    :ui="{
      footer: 'sm:flex sm:flex-row-reverse sm:px-6 sm:py-4 gap-3',
    }"
    fullscreen
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #body>
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
        <div class="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
          <span class="text-xs font-mono text-zinc-500 dark:text-zinc-400">JSON</span>
          <UButton
            :color="isCopied ? 'success' : 'secondary'"
            variant="ghost"
            size="xs"
            :icon="isCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
            class="-mr-2 transition-all duration-200"
            :class="{ 'text-green-500 dark:text-green-400': isCopied }"
            @click="copyToClipboard"
          >
            {{ isCopied ? 'Copied!' : 'Copy' }}
          </UButton>
        </div>
        <div class="overflow-auto max-h-[calc(100vh-200px)] p-4">
          <pre v-if="signal" class="text-sm"><code ref="codeBlock" class="language-json">{{ JSON.stringify(signal.rawEvent, null, 2) }}</code></pre>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        color="secondary"
        variant="subtle"
        @click="emit('update:modelValue', false)"
      >
        Close
      </UButton>
    </template>
  </UModal>
</template>
