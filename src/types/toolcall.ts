import type { Tool } from "ollama";
import type { ChatPart } from "@/src/types/chat";

// Types + helpers
export type Args = Record<string, unknown>;
export type Handler = (args: Args) => string | number | Promise<string | number>;
export type Props = NonNullable<NonNullable<Tool["function"]["parameters"]>["properties"]>;

export interface RegisteredTool {
  name: string;
  definition: Tool;
  handler: Handler;
}

export interface ToolOutput { content: string; parts: ChatPart[] }