import { z } from "zod";

import { ActionAckEventSchema, HyperSignalEventSchema } from "./events";

export const hexSchema = z.string().regex(/^[0-9a-f]{64}$/, "Hash must be a 64-character hex string");
export const urlSchema = z.string().url("Invalid URL format");
export const timestampSchema = z.string().regex(/^\d+$/, "Must be a valid timestamp");

export const hyperSignalFormSchema = z.object({
  action: z.enum(["upgrade", "reboot"]),
  network: z.string().min(1, "Network is required"),
  version: z.string().min(1, "Version is required"),
  hash: hexSchema,
  genesis_url: urlSchema.optional(),
  required_by: timestampSchema.optional(),
  content: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.action === "reboot") {
    if (!data.genesis_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Genesis URL is required for reboot action",
        path: ["genesis_url"],
      });
    }
    if (!data.required_by) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required By is required for reboot action",
        path: ["required_by"],
      });
    }
  }
});

export type HyperSignalForm = z.infer<typeof hyperSignalFormSchema>;

export const appEventSchema = z.union([
  HyperSignalEventSchema,
  ActionAckEventSchema,
]);

export type AppEvent = z.infer<typeof appEventSchema>;
