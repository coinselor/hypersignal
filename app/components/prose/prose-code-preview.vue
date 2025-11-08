<script setup lang="ts">
import type { ClassNameValue } from "tailwind-merge";

import { computed, useSlots } from "vue";

type Props = {
  ui?: {
    root?: ClassNameValue;
    preview?: ClassNameValue;
    code?: ClassNameValue;
  };
  className?: ClassNameValue;
  label?: string;
};

const props = defineProps<Props>();
const slots = useSlots();

const rootClasses = computed(() => [
  props.ui?.root || "my-5",
  props.className,
].filter(Boolean).join(" "));

const previewClasses = computed(() => [
  props.ui?.preview || "flex justify-center border border-muted relative p-4 rounded-md",
  slots.code && "border-b-0 rounded-b-none",
].filter(Boolean).join(" "));

const codeClasses = computed(() => [
  props.ui?.code || "[&>div>pre]:rounded-t-none [&>div]:my-0",
].filter(Boolean).join(" "));
</script>

<template>
  <div :class="rootClasses">
    <div v-if="$slots.default" :class="previewClasses">
      <slot />
    </div>

    <div v-if="$slots.code" :class="codeClasses">
      <slot name="code" />
    </div>
  </div>
</template>
