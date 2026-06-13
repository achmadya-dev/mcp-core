import { z } from "zod";
import type { ZodRawShapeCompat } from "./types.js";

/** Opaque schema handle — backed by Zod today, swappable later. */
export type Schema<T = unknown> = z.ZodType<T>;

/** Raw object shape for MCP tool inputSchema / outputSchema. */
export type RawShape = ZodRawShapeCompat;

export type InferSchema<S extends Schema> = z.infer<S>;

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export function safeParse<T extends Schema>(schema: T, data: unknown): ParseResult<InferSchema<T>> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: { message: result.error.message } };
}

/**
 * Schema builders for tool definitions and runtime validation.
 * Consumers depend on this API only — not on Zod directly.
 */
export const schema = {
  string: () => z.string(),
  number: () => z.number(),
  boolean: () => z.boolean(),
  null: () => z.null(),
  any: () => z.any(),

  literal: <T extends string | number | boolean>(value: T) => z.literal(value),

  enum: <const T extends readonly [string, ...string[]]>(values: T) => z.enum(values),

  array: <T extends z.ZodTypeAny>(item: T) => z.array(item),

  record: (key: z.ZodTypeAny, value: z.ZodTypeAny) =>
    z.record(key as z.ZodString, value),

  object: <T extends RawShape>(shape: T) => z.object(shape),

  union: <T extends readonly [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]>(options: T) =>
    z.union(options),

  discriminatedUnion: <Discriminator extends string>(
    discriminator: Discriminator,
    options: [z.ZodTypeAny, ...z.ZodTypeAny[]]
  ) =>
    z.discriminatedUnion(
      discriminator,
      options as Parameters<typeof z.discriminatedUnion>[1]
    ),

  /** Zod v4 string checks — use with `schema.string().check(...)`. */
  trim: () => z.trim(),
  minLength: (min: number, message?: string) => z.minLength(min, message),
  maxLength: (max: number, message?: string) => z.maxLength(max, message),
} as const;
