import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";

export type { StandardSchemaWithJSON };

/** Parsed tool handler args from a Standard Schema input. */
export type ToolInput<S extends StandardSchemaWithJSON> =
  StandardSchemaWithJSON.InferOutput<S>;

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface ServerConfig {
  name: string;
  version: string;
}

type BivariantHandler<
  TInput extends StandardSchemaWithJSON,
  TResult extends JsonValue | void,
> = {
  bivarianceHack(args: ToolInput<TInput>): Promise<TResult> | TResult;
}["bivarianceHack"];

export interface ToolDefinition<
  TInput extends StandardSchemaWithJSON = StandardSchemaWithJSON,
  TResult extends JsonValue | void = JsonObject,
> {
  name: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: StandardSchemaWithJSON;
  handler: BivariantHandler<TInput, TResult>;
}

export type RegisterableTool = ToolDefinition<StandardSchemaWithJSON, JsonValue | void>;
