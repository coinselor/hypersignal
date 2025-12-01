<div align="center">
  <h1 style="margin-top: 10px;">HyperSignal</h1>
  <h3>Client-side web application for submitting and monitoring custom Nostr events in the HyperQube Network</h3>

  <div align="center">
    <a href="https://github.com/yourusername/hypersignal/blob/master/LICENSE"><img alt="License" src="https://img.shields.io/badge/LICENSE-MIT-green"/></a>
    <a href="https://www.npmjs.com/package/nuxt"><img alt="Nuxt" src="https://img.shields.io/badge/Nuxt-4.2+-blue.svg"/></a>
    <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg"/></a>
  </div>

</div>

## Why HyperSignal?

HyperSignal facilitates signal submission and monitoring between developers and nodes across the HyperQube Network via the Nostr protocol.

- **Built on Nostr**: Leverages custom event kinds for decentralized, censorship-resistant communication.
- **Authorized Publishers**: Configure specific public keys to ensure only authorized users can broadcast signals.
- **Real-Time Monitoring**: Live feed updates from multiple relays for instant signal detection.
- **Custom Relay Management**: Users can add/remove relays for optimal event fetching and publication.

## Quick Start

```bash
git clone https://github.com/yourusername/hypersignal.git
cd hypersignal
pnpm install
pnpm dev
```

> **Prerequisites**: Node.js 18.0.0+, pnpm package manager

## Configuration

**Environment Variables**

- **`NUXT_APP_BASE_URL`**: Sets the base URL for the application. Useful for deployments like GitHub Pages (e.g., `/hypersignal/`).
  ```bash
  # Copy example file and edit
  cp .env.example .env
  ```

**Application Settings**

Core application settings are located in `nuxt.config.ts` under `runtimeConfig.public`.

- **`nostr.publicRelays`**: List of standard Nostr relays for general event fetching.
- **`nostr.specialRelays`**: List of specialized relays (e.g., [qubestr](https://github.com/hypercore-one/qubestr)) for targeted signal monitoring.
- **`authorizedPubkeys`**: Array of hex-encoded Nostr public keys. Only events signed by these keys are recognized as valid signals.
- **`signalInactivityTimeoutSeconds`**: Duration in seconds before the system reverts to "Hyper Ready" state if no fresh signals are received.

```typescript
// Example configuration in nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      nostr: {
        publicRelays: ["wss://relay.damus.io"],
        specialRelays: ["wss://qubestr.zenon.red"],
      },
      authorizedPubkeys: [
        "b5158...fc53", // Authorized Publisher
      ],
      signalInactivityTimeoutSeconds: 604800, // 1 week
    }
  }
});
```

## Deployment

This repository is configured to automatically deploy to GitHub Pages via GitHub Actions. The `NUXT_APP_BASE_URL` is set directly in the `.github/workflows/deploy.yml` file to match your repository name.

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <p>
    <strong>Built by aliens.</strong><br>
  </p>
</div>
