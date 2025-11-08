<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
    <AppHeader />

    <main class="p-4 sm:p-6 lg:p-8 flex-1">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
