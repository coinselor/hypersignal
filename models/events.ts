import { NSchema as n } from "@nostrify/nostrify";
import { z } from "zod";

/**
 * HyperSignal Event (Kind 33321) - Action Directive
 *
 * Used by HyperCore One developers to broadcast directives, such as software upgrades
 * or scheduled reboots, to HyperQube nodes. These are addressable events.
 */
export const HyperSignalEventSchema = z.object({
  id: n.id(),
  pubkey: n.id(),
  created_at: z.number().int().nonnegative(),
  kind: z.literal(33321),
  tags: z.array(
    z.union([
      // Required tags
      z.tuple([z.literal("d"), z.literal("hyperqube")]),
      z.tuple([z.literal("version"), z.string()]),
      z.tuple([z.literal("hash"), z.string().regex(/^[0-9a-f]+$/)]),
      z.tuple([z.literal("network"), z.string()]),
      z.tuple([z.literal("action"), z.enum(["upgrade", "reboot"])]),

      // Optional tags (required for specific actions)
      z.tuple([z.literal("genesis_url"), z.string().url()]),
      z.tuple([z.literal("required_by"), z.string().regex(/^\d+$/)]),

      // Allow other tags
      z.array(z.string()).min(2),
    ]),
  ),
  content: z.string(),
  sig: z.string(),
});

/**
 * Helper function to validate that a HyperSignal Event has all required tags
 * based on the action type
 */
export function validateHyperSignalEvent(event: z.infer<typeof HyperSignalEventSchema>) {
  // Check for required tags
  const hasDTag = event.tags.some(tag => tag[0] === "d" && tag[1] === "hyperqube");
  const hasVersionTag = event.tags.some(tag => tag[0] === "version");
  const hasHashTag = event.tags.some(tag => tag[0] === "hash");
  const hasNetworkTag = event.tags.some(tag => tag[0] === "network");

  // Find action tag
  const actionTag = event.tags.find(tag => tag[0] === "action");
  const action = actionTag ? actionTag[1] : null;

  if (!hasDTag || !hasVersionTag || !hasHashTag || !hasNetworkTag || !action) {
    return { valid: false, error: "Missing required tags" };
  }

  // Check for action-specific required tags
  if (action === "reboot") {
    const hasGenesisUrl = event.tags.some(tag => tag[0] === "genesis_url");
    const hasRequiredBy = event.tags.some(tag => tag[0] === "required_by");

    if (!hasGenesisUrl) {
      return { valid: false, error: "Reboot action requires genesis_url tag" };
    }

    if (!hasRequiredBy) {
      return { valid: false, error: "Reboot action requires required_by tag" };
    }
  }

  return { valid: true };
};

/**
 * Type for HyperSignal Event
 */
export type HyperSignalEvent = z.infer<typeof HyperSignalEventSchema>;

/**
 * Qube Manager Event (Kind 3333) - Action Acknowledgement
 *
 * Emitted by individual nodes to acknowledge the status or outcome of an action directive
 * they received. These are regular events.
 */
export const QubeManagerEventSchema = z.object({
  id: n.id(),
  pubkey: n.id(),
  created_at: z.number().int().nonnegative(),
  kind: z.literal(3333),
  tags: z.array(
    z.union([
      // Required tags
      z.tuple([z.literal("a"), z.string().regex(/^33321:[0-9a-f]{64}:hyperqube$/), z.string().url().optional()]),
      z.tuple([z.literal("p"), n.id(), z.string().url().optional()]),
      z.tuple([z.literal("version"), z.string()]),
      z.tuple([z.literal("network"), z.string()]),
      z.tuple([z.literal("action"), z.enum(["upgrade", "reboot"])]),
      z.tuple([z.literal("status"), z.enum(["success", "failure"])]),
      z.tuple([z.literal("node_id"), z.string()]),
      z.tuple([z.literal("action_at"), z.string().regex(/^\d+$/)]),

      // Optional tags
      z.tuple([z.literal("error"), z.string()]),

      // Allow other tags
      z.array(z.string()).min(2),
    ]),
  ),
  content: z.string(),
  sig: z.string(),
});

/**
 * Helper function to validate that a Qube Manager Event has all required tags
 */
export function validateQubeManagerEvent(event: z.infer<typeof QubeManagerEventSchema>) {
  // Check for required tags
  const hasATag = event.tags.some(tag => tag[0] === "a" && /^33321:[0-9a-f]{64}:hyperqube$/.test(tag[1]));
  const hasVersionTag = event.tags.some(tag => tag[0] === "version");
  const hasNetworkTag = event.tags.some(tag => tag[0] === "network");
  const hasActionTag = event.tags.some(tag => tag[0] === "action");
  const hasStatusTag = event.tags.some(tag => tag[0] === "status");
  const hasNodeIdTag = event.tags.some(tag => tag[0] === "node_id");
  const hasActionAtTag = event.tags.some(tag => tag[0] === "action_at");

  // Check if status is failure, then error tag is required
  const statusTag = event.tags.find(tag => tag[0] === "status");
  const status = statusTag ? statusTag[1] : null;
  const hasErrorTag = event.tags.some(tag => tag[0] === "error");

  if (!hasATag || !hasVersionTag || !hasNetworkTag || !hasActionTag || !hasStatusTag || !hasNodeIdTag || !hasActionAtTag) {
    return { valid: false, error: "Missing required tags" };
  }

  if (status === "failure" && !hasErrorTag) {
    return { valid: false, error: "Failure status requires error tag" };
  }

  return { valid: true };
}

/**
 * Type for Qube Manager Event
 */
export type QubeManagerEvent = z.infer<typeof QubeManagerEventSchema>;

/**
 * Helper functions to create events
 */

/**
 * Create a HyperSignal Event (Kind 33321)
 * Note: This doesn't sign the event - that needs to be done separately
 */
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

/**
 * Create a Qube Manager Event (Kind 3333)
 * Note: This doesn't sign the event - that needs to be done separately
 */
export function createQubeManagerEvent({
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
  originalEventId: string;
  originalPubkey: string;
  version: string;
  network: string;
  action: "upgrade" | "reboot";
  status: "success" | "failure";
  nodeId: string;
  content: string;
  error?: string;
  relayUrl?: string;
}): Omit<QubeManagerEvent, "id" | "sig"> {
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

  if (status === "failure" && error) {
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
