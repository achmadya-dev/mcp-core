import type {
  ShapeOutput,
  ZodRawShapeCompat,
} from "@modelcontextprotocol/sdk/server/zod-compat.js";

export type { ShapeOutput, ZodRawShapeCompat };

/** Handler args with optional Zod fields as optional keys (ShapeOutput requires every key). */
export type ToolInput<Shape extends ZodRawShapeCompat> = {
  [K in keyof Shape as undefined extends ShapeOutput<Shape>[K] ? K : never]?: ShapeOutput<Shape>[K];
} & {
  [K in keyof Shape as undefined extends ShapeOutput<Shape>[K] ? never : K]: ShapeOutput<Shape>[K];
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface ServerConfig {
  name: string;
  version: string;
}

type BivariantHandler<TInput extends ZodRawShapeCompat, TResult extends JsonValue | void> = {
  bivarianceHack(args: ToolInput<TInput>): Promise<TResult> | TResult;
}["bivarianceHack"];

export interface ToolDefinition<
  TInput extends ZodRawShapeCompat = ZodRawShapeCompat,
  TResult extends JsonValue | void = JsonObject,
> {
  name: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: ZodRawShapeCompat;
  handler: BivariantHandler<TInput, TResult>;
}

export type RegisterableTool = ToolDefinition<ZodRawShapeCompat, JsonValue | void>;
