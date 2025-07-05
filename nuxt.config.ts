import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  future: {
    compatibilityVersion: 4,
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
  ],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});
