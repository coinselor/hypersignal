import type { Event } from "nostr-tools";

export type ProcessedEvent = {
  id: string;
  pubkey: string;
  author: {
    name: string;
    picture: string;
  };
  action: string;
  version: string;
  network: string;
  hash?: string;
  content: string;
  rawEvent: Event;
  status?: string;
  error?: string;
  node_id?: string;
};
