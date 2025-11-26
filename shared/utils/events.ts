import type { NostrEvent } from "nostr-tools";

import type { ActionAckEvent, HyperSignalEvent } from "../types/events";

import {
  ActionAckEventSchema,

  HyperSignalEventSchema,
} from "../types/events";

export function createHyperSignalEvent({
  pubkey,
  version,
  hash,
  network,
  action,
  content,
  genesisUrl,
  requiredBy,
}: {
  pubkey: string;
  version: string;
  hash: string;
  network: string;
  action: "upgrade" | "reboot";
  content: string;
  genesisUrl?: string;
  requiredBy?: string;
}): Omit<HyperSignalEvent, "id" | "sig"> {
  const tags: string[][] = [
    ["d", "hyperqube"],
    ["version", version],
    ["hash", hash],
    ["network", network],
    ["action", action],
  ];

  if (action === "reboot") {
    if (!genesisUrl)
      throw new Error("genesisUrl is required for reboot action");
    if (!requiredBy)
      throw new Error("requiredBy is required for reboot action");

    tags.push(["genesis_url", genesisUrl]);
    tags.push(["required_by", requiredBy]);
  }

  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 33321,
    tags,
    content,
  };
}

export function createActionAckEvent({
  pubkey,
  originalPubkey,
  version,
  network,
  action,
  status,
  nodeId,
  content,
  error,
  relayUrl,
}: {
  pubkey: string;
  originalPubkey: string;
  version: string;
  network: string;
  action: "upgrade" | "reboot";
  status: "success" | "failure";
  nodeId: string;
  content: string;
  error?: string;
  relayUrl?: string;
}): Omit<ActionAckEvent, "id" | "sig"> {
  const tags: string[][] = [
    ["a", `33321:${originalPubkey}:hyperqube`, relayUrl].filter(Boolean) as string[],
    ["p", originalPubkey, relayUrl].filter(Boolean) as string[],
    ["version", version],
    ["network", network],
    ["action", action],
    ["status", status],
    ["node_id", nodeId],
    ["action_at", Math.floor(Date.now() / 1000).toString()],
  ];

  if (status === "failure") {
    if (!error)
      throw new Error("Error message is required for failure status");
    tags.push(["error", error]);
  }

  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 3333,
    tags,
    content,
  };
}

export function validateHyperSignalEvent(event: NostrEvent) {
  const result = HyperSignalEventSchema.safeParse(event);
  if (!result.success) {
    const error = result.error.issues[0];
    if (!error)
      return { valid: false, error: "Unknown validation error" };

    const message = error.path.length > 0
      ? `${error.path.join(".")}: ${error.message}`
      : error.message;
    return { valid: false, error: message };
  }
  return { valid: true };
}

export function validateActionAckEvent(event: NostrEvent) {
  const result = ActionAckEventSchema.safeParse(event);
  if (!result.success) {
    const error = result.error.issues[0];
    if (!error)
      return { valid: false, error: "Unknown validation error" };

    const message = error.path.length > 0
      ? `${error.path.join(".")}: ${error.message}`
      : error.message;
    return { valid: false, error: message };
  }
  return { valid: true };
}
