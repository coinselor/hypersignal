import { defineEventHandler } from "h3";

import { HyperSignalEventSchema, QubeManagerEventSchema } from "../../models/events";

const mockEvents = [
  {
    id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    kind: 33321,
    pubkey: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    created_at: Math.floor(Date.now() / 1000) - 3600,
    tags: [
      ["d", "hyperqube"],
      ["action", "upgrade"],
      ["version", "1.2.3"],
      ["hash", "abc123def456"],
      ["network", "hqz"],
    ],
    content: "Scheduled upgrade to version 1.2.3",
    sig: "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4",
  },
  {
    id: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    kind: 3333,
    pubkey: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    created_at: Math.floor(Date.now() / 1000) - 3500,
    tags: [
      ["a", "33321:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b:hyperqube"],
      ["p", "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"],
      ["status", "success"],
      ["action", "upgrade"],
      ["version", "1.2.3"],
      ["network", "hqz"],
      ["node_id", "node_xyz"],
      ["action_at", (Math.floor(Date.now() / 1000) - 3500).toString()],
    ],
    content: "Upgrade to 1.2.3 completed successfully.",
    sig: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
  },
  {
    id: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    kind: 33321,
    pubkey: "4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
    created_at: Math.floor(Date.now() / 1000) - 1800,
    tags: [
      ["d", "hyperqube"],
      ["action", "reboot"],
      ["version", "1.2.3"],
      ["hash", "def789abc012"],
      ["network", "hqz"],
      ["genesis_url", "http://example.com/genesis"],
      ["required_by", (Math.floor(Date.now() / 1000) + 3600).toString()],
    ],
    content: "Node reboot command issued.",
    sig: "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9",
  },
  {
    id: "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8",
    kind: 3333,
    pubkey: "0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    created_at: Math.floor(Date.now() / 1000) - 1700,
    tags: [
      ["a", "33321:4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e:hyperqube"],
      ["p", "4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e"],
      ["status", "failure"],
      ["action", "reboot"],
      ["version", "1.2.3"],
      ["network", "hqz"],
      ["node_id", "node_abc"],
      ["action_at", (Math.floor(Date.now() / 1000) - 1700).toString()],
      ["error", "Failed to fetch genesis file."],
    ],
    content: "Reboot failed for node_abc.",
    sig: "b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0",
  },
];

export default defineEventHandler((_event) => {
  try {
    const parsedEvents = mockEvents.map((e) => {
      if (e.kind === 33321) {
        return HyperSignalEventSchema.parse(e);
      }
      else if (e.kind === 3333) {
        return QubeManagerEventSchema.parse(e);
      }
      return e; // Or throw an error for unknown kinds
    });
    return parsedEvents;
  }
  catch (error) {
    console.error("Mock data validation failed:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error: Invalid mock data",
    });
  }
});
