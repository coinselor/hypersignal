<script setup lang="ts">
import type { Profile } from "../composables/use-profiles";

const props = defineProps<{
  profile: Profile | null | undefined;
  pubkey: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}>();

const { getPubkeyShorthand } = useProfiles();
const imageError = ref(false);

const avatarSrc = computed(() => {
  if (imageError.value || !props.profile?.picture) {
    return undefined;
  }
  return props.profile.picture;
});

const fallbackText = computed(() => {
  return getPubkeyShorthand(props.pubkey);
});

const displayName = computed(() => {
  return props.profile?.display_name || props.profile?.name || `...${fallbackText.value}`;
});

function onImageError() {
  imageError.value = true;
}
</script>

<template>
  <UAvatar
    :src="avatarSrc"
    :alt="displayName"
    :size="size || 'md'"
    @error="onImageError"
  >
    <template v-if="!avatarSrc" #fallback>
      <span class="font-mono text-sm font-semibold">{{ fallbackText }}</span>
    </template>
  </UAvatar>
</template>
