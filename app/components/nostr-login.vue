<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { nip19 } from "nostr-tools";

import { NLogin } from "../../lib/nostr/n-login";

const toast = useToast();
const { isLoggedIn, login, logout } = useNostrLogin();
const { user, profile, pending: _pending } = useCurrentUser();
const { isAuthorized } = useAuthorization();

const displayName = computed(() => {
  if (!user.value)
    return "";
  if (!profile.value)
    return user.value.pubkey.slice(0, 10);

  return (
    profile.value.display_name
    || profile.value.name
    || user.value.pubkey.slice(0, 10)
  );
});

const profileReady = computed(() => Boolean(profile.value));

const truncatedNpub = computed(() => {
  if (!user.value)
    return "";
  try {
    const npub = nip19.npubEncode(user.value.pubkey);
    return `${npub.slice(0, 10)}...`;
  }
  catch {
    return `${user.value.pubkey.slice(0, 10)}...`;
  }
});

async function handleLogin() {
  try {
    const userLogin = await NLogin.fromExtension();

    if (!isAuthorized(userLogin.pubkey)) {
      toast.add({
        title: "Access Restricted",
        description: "Restricted to HyperCore One developers.",
        color: "error",
      });
      return;
    }

    login(userLogin.toJSON());
  }
  catch (error) {
    toast.add({
      title: "Login Failed",
      description: "Please ensure you have a NIP-07 compatible Nostr extension installed.",
      color: "error",
    });
    console.error("Nostr login error:", error);
  }
}

watch(user, (currentUser) => {
  if (currentUser && !isAuthorized(currentUser.pubkey)) {
    toast.add({
      title: "Access Restricted",
      description: "Restricted to HyperCore One developers.",
      color: "error",
    });
    logout();
  }
}, { immediate: true });
</script>

<template>
  <AnimatePresence mode="popLayout">
    <motion.div
      v-if="isLoggedIn && user"
      key="logged-in"
      class="flex items-center gap-x-4"
      :initial="{ opacity: 0, y: -8, scale: 0.98 }"
      :animate="{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 28, mass: 0.7 } }"
      :exit="{ opacity: 0, y: -6 }"
      layout
    >
      <template v-if="profileReady">
        <UAvatar
          :src="profile?.picture"
          :alt="displayName"
          size="md"
        />
        <div class="font-medium dark:text-white">
          <div>{{ displayName }}</div>
          <div class="text-sm text-dimmed">
            {{ truncatedNpub }}
          </div>
        </div>
      </template>
      <template v-else>
        <USkeleton class="w-8 h-8 rounded-full" />
        <div class="space-y-1">
          <USkeleton class="h-4 w-24" />
          <USkeleton class="h-3 w-20" />
        </div>
      </template>
      <UButton icon="mingcute:exit-fill" color="neutral" variant="ghost" class="text-2xl" @click="logout" />
    </motion.div>

    <motion.div
      v-else
      key="logged-out"
      :initial="{ opacity: 0, y: -8, scale: 0.98 }"
      :animate="{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 28, mass: 0.7 } }"
      :exit="{ opacity: 0, y: -6 }"
      layout
    >
      <UButton color="tertiary" variant="ghost" @click="handleLogin">
        <template #leading>
          <NostrIcon class="w-6 h-6" />
        </template>
        Log In with Nostr
      </UButton>
    </motion.div>
  </AnimatePresence>
</template>
