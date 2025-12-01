<script setup lang="ts">
type CodePreviewProps = {
  ui?: {
    root?: string;
    preview?: string;
    code?: string;
  };
  label?: string;
};

const props = withDefaults(defineProps<CodePreviewProps>(), {
  ui: () => ({}),
});

const slots = defineSlots<{
  default: () => unknown;
  code: () => unknown;
}>();

const hasCodeSlot = computed(() => !!slots.code);

const appConfig = useAppConfig();
const themeConfig = computed(() => appConfig.ui?.prose?.codePreview || {});

const rootClass = computed(() => {
  const base = themeConfig.value.slots?.root || "my-5";
  return props.ui.root ? `${base} ${props.ui.root}` : base;
});

const previewClass = computed(() => {
  let base = themeConfig.value.slots?.preview || "flex justify-center border border-muted relative p-4 rounded-md";

  if (hasCodeSlot.value && themeConfig.value.variants?.code?.true?.preview) {
    base = `${base} ${themeConfig.value.variants.code.true.preview}`;
  }

  return props.ui.preview ? `${base} ${props.ui.preview}` : base;
});

const codeClass = computed(() => {
  const base = themeConfig.value.slots?.code || "[&>div>pre]:rounded-t-none [&>div]:my-0";
  return props.ui.code ? `${base} ${props.ui.code}` : base;
});
</script>

<template>
  <div :class="rootClass">
    <div :class="previewClass">
      <div v-if="label" class="absolute top-2 left-2 text-xs font-medium text-muted-foreground">
        {{ label }}
      </div>
      <slot />
    </div>
    <div v-if="hasCodeSlot" :class="codeClass">
      <slot name="code" />
    </div>
  </div>
</template>
