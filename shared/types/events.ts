import type { Event } from "nostr-tools";

import { NSchema as n } from "@nostrify/nostrify";
import { z } from "zod";

export const HyperSignalEventSchema = z.object({
  id: n.id(),
  pubkey: n.id(),
  created_at: z.number().int().nonnegative(),
  kind: z.literal(33321),
  tags: z.array(
    z.union([
      z.tuple([z.literal("d"), z.literal("hyperqube")]),
      z.tuple([z.literal("version"), z.string()]),
      z.tuple([z.literal("hash"), z.string().regex(/^[0-9a-f]{64}$/)]),
      z.tuple([z.literal("network"), z.string()]),
      z.tuple([z.literal("action"), z.enum(["upgrade", "reboot"])]),
      z.tuple([z.literal("genesis_url"), z.string().url()]),
      z.tuple([z.literal("required_by"), z.string().regex(/^\d+$/)]),
      z.array(z.string()).min(2),
    ]),
  ).superRefine((tags, ctx) => {
    const count = (t: string) => tags.filter(tag => tag[0] === t).length;

    if (count("d") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'd' tag" });
    if (count("version") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'version' tag" });
    if (count("hash") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'hash' tag" });
    if (count("network") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'network' tag" });

    const actionTag = tags.find(t => t[0] === "action");
    if (!actionTag) {
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'action' tag" });
    }
    else {
      if (count("action") !== 1)
        ctx.addIssue({ code: "custom", message: "Must have exactly one 'action' tag" });

      const action = actionTag[1];
      if (action === "reboot") {
        if (count("genesis_url") !== 1)
          ctx.addIssue({ code: "custom", message: "Reboot action requires exactly one 'genesis_url' tag" });
        if (count("required_by") !== 1)
          ctx.addIssue({ code: "custom", message: "Reboot action requires exactly one 'required_by' tag" });
      }
    }
  }),
  content: z.string(),
  sig: z.string(),
});

export type HyperSignalEvent = z.infer<typeof HyperSignalEventSchema>;

export const ActionAckEventSchema = z.object({
  id: n.id(),
  pubkey: n.id(),
  created_at: z.number().int().nonnegative(),
  kind: z.literal(3333),
  tags: z.array(
    z.union([
      z.tuple([z.literal("a"), z.string().regex(/^33321:[0-9a-f]{64}:hyperqube$/)]),
      z.tuple([z.literal("a"), z.string().regex(/^33321:[0-9a-f]{64}:hyperqube$/), z.string().url()]),
      z.tuple([z.literal("p"), n.id()]),
      z.tuple([z.literal("p"), n.id(), z.string().url()]),
      z.tuple([z.literal("version"), z.string()]),
      z.tuple([z.literal("network"), z.string()]),
      z.tuple([z.literal("action"), z.enum(["upgrade", "reboot"])]),
      z.tuple([z.literal("status"), z.enum(["success", "failure"])]),
      z.tuple([z.literal("node_id"), z.string()]),
      z.tuple([z.literal("action_at"), z.string().regex(/^\d+$/)]),
      z.tuple([z.literal("error"), z.string()]),
      z.array(z.string()).min(2),
    ]),
  ).superRefine((tags, ctx) => {
    const count = (t: string) => tags.filter(tag => tag[0] === t).length;
    const getTagValue = (t: string) => {
      const tag = tags.find(tag => tag[0] === t);
      return tag ? tag[1] : undefined;
    };

    if (count("a") < 1)
      ctx.addIssue({ code: "custom", message: "Must have at least one 'a' tag" });
    if (count("p") < 1)
      ctx.addIssue({ code: "custom", message: "Must have at least one 'p' tag" });
    if (count("version") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'version' tag" });
    if (count("network") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'network' tag" });
    if (count("action") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'action' tag" });
    if (count("status") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'status' tag" });
    if (count("node_id") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'node_id' tag" });
    if (count("action_at") !== 1)
      ctx.addIssue({ code: "custom", message: "Must have exactly one 'action_at' tag" });

    if (count("error") > 1)
      ctx.addIssue({ code: "custom", message: "Must have at most one 'error' tag" });

    const status = getTagValue("status");
    if (status === "failure") {
      if (count("error") !== 1)
        ctx.addIssue({ code: "custom", message: "Failure status requires exactly one 'error' tag" });
    }
  }),
  content: z.string(),
  sig: z.string(),
});

export type ActionAckEvent = z.infer<typeof ActionAckEventSchema>;

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
