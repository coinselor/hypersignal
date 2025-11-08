/* eslint-disable ts/consistent-type-definitions */

import type { NPool } from "@nostrify/nostrify";

declare module "#app" {
  interface NuxtApp {
    $nostr: NPool;
  };
}

declare module "vue" {
  interface ComponentCustomProperties {
    $nostr: NPool;
  };
}

export {};
