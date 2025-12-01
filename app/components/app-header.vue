<template>
  <header class="p-4 sm:p-6 lg:p-8 flex w-full items-center justify-between">
    <div class="flex items-center gap-x-2">
      <img src="/logo.png" alt="HyperSignal Logo" class="h-8 w-8 dark:invert">
      <p class="font-mono text-2xl font-semibold">
        <span class="sm:hidden">HS</span>
        <span class="hidden sm:inline">HyperSignal</span>
      </p>
      <UBadge label="BETA" color="primary" variant="subtle" :ui="{ label: 'text-xs', base: '' }" />
    </div>
    <div class="flex items-center gap-x-4 h-10">
      <NostrLogin />
    </div>
  </header>
</template>
