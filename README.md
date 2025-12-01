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

HyperSignal provides an easy way to submit and monitor signals between developers and nodes across the HyperQube Network using the Nostr protocol.

**Built on Nostr** - Leverages custom event kinds for decentralized, censorship-resistant communication.

**Authorized Publishers** - Configure specific public keys to ensure only authorized users can broadcast signals.

**Real-Time Monitoring** - Live feed updates from multiple relays for instant signal detection.

**Custom Relay Management** - Users can add/remove relays for optimal event fetching and publication.

## Quick Start

```bash
git clone https://github.com/yourusername/hypersignal.git
cd hypersignal
pnpm install
pnpm dev
```

> **Prerequisites**: Node.js 18.0.0+, pnpm package manager

### Local Development

```bash
# Copy example file and edit (optional, for local override)
cp .env.example .env
```

The `.env` file is useful for local development to simulate the production base URL.

### Deployment to GitHub Pages

This repository is configured to automatically deploy to GitHub Pages via GitHub Actions.
The `NUXT_APP_BASE_URL` is configured directly in `.github/workflows/deploy.yml`.

### Configuration

**Authorized Publishers Configuration**

Edit `nuxt.config.ts` to configure authorized public keys, the set of relays to use for signal monitoring, and the inactivity timeout:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      nostr: {
        publicRelays: [
          "wss://relay.damus.io",
          "wss://relay.primal.net",
        ],
        specialRelays: [
          "wss://qubestr.zenon.red",
          "wss://qubestr.zenon.info",
        ],
      },
      authorizedPubkeys: [
        "b5158...fc53", // Replace with your authorized keys
        // Add more authorized keys as needed
      ],
      signalInactivityTimeoutSeconds: 60 * 60 * 24 * 7, // 1 week
    }
  }
});
```

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <p>
    <strong>Built by aliens.</strong><br>
  </p>
</div>
