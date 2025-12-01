/**
 * Authorization composable for checking if pubkeys are authorized to sign signals.
 * Authorized developers are configured in nuxt.config.ts runtime config.
 */

export function useAuthorization() {
  const config = useRuntimeConfig();
  const authorizedPubkeys = computed(() => {
    const pubkeys = config.public.authorizedPubkeys;
    return Array.isArray(pubkeys) ? pubkeys : [];
  });

  function isAuthorized(pubkey: string): boolean {
    return authorizedPubkeys.value.includes(pubkey);
  }

  function getAuthorizedPubkeys(): string[] {
    return [...authorizedPubkeys.value];
  }

  return {
    isAuthorized,
    getAuthorizedPubkeys,
    authorizedPubkeys: readonly(authorizedPubkeys),
  };
}
