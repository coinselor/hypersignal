import { z } from "zod";

import { HyperSignalEventSchema, QubeManagerEventSchema } from "../models/events";

export const hyperSignalFormSchema = z.object({
  action: z.enum(["upgrade", "reboot"]),
  network: z.string().min(1, "Network is required"),
  version: z.string().optional(),
  hash: z.string().optional(),
  genesis_url: z.string().url("Invalid URL format").optional(),
  required_by: z.string().optional(),
  content: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.action === "upgrade") {
    if (!data.version) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Version is required for upgrade action",
        path: ["version"],
      });
    }
    if (!data.hash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hash is required for upgrade action",
        path: ["hash"],
      });
    }
  }
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
  QubeManagerEventSchema,
]);

export type AppEvent = z.infer<typeof appEventSchema>;
