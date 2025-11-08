import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2025-05-15",
  runtimeConfig: {
    public: {
      nostr: {
        publicRelays: [
          "wss://relay.damus.io",
          "wss://relay.primal.net",
        ],
        specialRelays: [
          "ws://localhost:3334",
        ],
      },
      authorizedPubkeys: [
        "706c6320ad12b03a3ddc978f6fbd6d5b3eb1484c56f2f20b4df04545015e6c86", // "b5158a515b40fd440b6783ba3791f37570b73b2cf99633552b60081843a9fc53", cc
        "80ebe917ae63946ebf7577bcf68d43ff89f102a6596d41e7f1bd6f43c311dc89",
        "ee2c1d50281983a1abd271d41d1f0ca7943390c8ec261e826d56c5930de54623",
        "db9cbf7cc2a608d8d91fa1b63e1f2aea55d95b861ca1cf93facb5c1fba51d662",
        "ee7f03817f965fb3828239420e59580023eb184e142fd4cf79c619feae3200c3",
        "f718a11ee3d95e9e0a62578dd31ba82789035025326e0ccc0f2263fe641391c6",
      ],
    },
  },
  devtools: { enabled: true },
  css: [
    "./assets/css/main.css",
  ],
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/ui",
    "@vueuse/nuxt",
    "motion-v/nuxt",
  ],
  eslint: {
    config: {
      standalone: false,
    },
  },
  fonts: {
    families: [
      { name: "Inter", provider: "google", weights: ["400", "500", "600", "700"], display: "swap" },
      { name: "Space Mono", provider: "google", weights: ["400", "700"], display: "swap" },
    ],
  },
  ui: {
    mdc: true,
    theme: {
      colors: [
        "primary",
        "secondary",
        "tertiary",
        "info",
        "success",
        "warning",
        "error",
      ],
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});
