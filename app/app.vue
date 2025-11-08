<script setup lang="ts">
const showSignalCreator = ref(false);

function openSignalCreator() {
  showSignalCreator.value = true;
}
</script>

<template>
  <UApp :toaster="{ progress: false, position: 'top-center' }">
    <NuxtLayout>
      <UContainer>
        <AppStatus @open-signal-creator="openSignalCreator" />
        <AppFeed class="mt-12" />
      </UContainer>
    </NuxtLayout>

    <!-- Signal Creator Modal at app root -->
    <SignalCreatorModal v-model:open="showSignalCreator" />
  </UApp>
</template>
