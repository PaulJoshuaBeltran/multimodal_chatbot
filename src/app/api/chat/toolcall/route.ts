// src/app/api/chat/toolcall/route.ts
import { ollama } from "@/src/lib/ollama";
import type { Message, Tool } from "ollama";

export const dynamic = "force-dynamic";

// Types + helpers
type Args = Record<string, unknown>;
type Handler = (args: Args) => string | number | Promise<string | number>;
type Props = NonNullable<NonNullable<Tool["function"]["parameters"]>["properties"]>;

interface RegisteredTool {
  definition: Tool;
  handler: Handler;
}

// Define schema + handler together so the name, schema and function can't drift apart.
function defineTool(opts: {
  name: string;
  description: string;
  properties?: Props;
  required?: string[];
  handler: Handler;
}): RegisteredTool {
  return {
    definition: {
      type: "function",
      function: {
        name: opts.name,
        description: opts.description,
        parameters: {
          type: "object",
          required: opts.required ?? [],
          properties: opts.properties ?? {},
        },
      },
    },
    handler: opts.handler,
  };
}

// JSON-schema helpers. Arrays MUST use `items`; nested objects use `properties`/`required`.
const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });
const bool = (description: string) => ({ type: "boolean", description });
const enumStr = (description: string, values: string[]) => ({ type: "string", description, enum: values });
const arrayOf = (items: object, description?: string) => ({ type: "array", description, items });
const obj = (properties: Props, required: string[] = []) => ({ type: "object", properties, required });

// Models sometimes emit numbers as strings ("11434"), so coerce + validate.
function toNum(v: unknown, name: string): number {
  const n = typeof v === "number" ? v : Number(v);
  if (v === null || v === undefined || v === "" || !Number.isFinite(n)) {
    throw new Error(`Argument "${name}" must be a number, got ${JSON.stringify(v)}`);
  }
  return n;
}

const fileProps: Props = {
  filepath: str("Directory path of the file"),
  filename: str("Name of the file, without extension"),
  filetype: str("File extension/type, e.g. pdf, txt, xlsx"),
};
const fileRequired = ["filepath", "filename", "filetype"];

// Tools (handlers are MOCK for now)
const registeredTools: RegisteredTool[] = [
  // I. Tests
  defineTool({
    name: "add",
    description: "Add two numbers",
    properties: { a: num("The first number"), b: num("The second number") },
    required: ["a", "b"],
    handler: (args) => toNum(args.a, "a") + toNum(args.b, "b"),
  }),
  defineTool({
    name: "multiply",
    description: "Multiply two numbers",
    properties: { a: num("The first number"), b: num("The second number") },
    required: ["a", "b"],
    handler: (args) => toNum(args.a, "a") * toNum(args.b, "b"),
  }),

  // II-1. File management
  defineTool({
    name: "create_file",
    description: "Create local file",
    properties: { ...fileProps, content: str("Content of the new file") },
    required: [...fileRequired, "content"],
    handler: () => "Mock Test: new file created named test.pdf",
  }),
  defineTool({
    name: "read_file",
    description: "Read local file",
    properties: fileProps,
    required: fileRequired,
    handler: () => "Mock Test: read file named test.pdf",
  }),
  defineTool({
    name: "update_file",
    description: "Update local file",
    properties: { ...fileProps, new_content: str("New content of the file") },
    required: [...fileRequired, "new_content"],
    handler: () => "Mock Test: updated file named test.pdf",
  }),
  defineTool({
    name: "delete_file",
    description: "Delete local file",
    properties: fileProps,
    required: fileRequired,
    handler: () => "Mock Test: deleted file named test.pdf",
  }),
  defineTool({
    name: "view_file_metadata",
    description: "View local file's metadata",
    properties: fileProps,
    required: fileRequired,
    handler: () => "Mock Test: displayed the metadata for file named test.pdf",
  }),

  // II-2. Message
  defineTool({
    name: "email",
    description: "Send email",
    properties: {
      from: str("Sender email address"),
      to: str("Recipient email address"),
      cc: str("Carbon copy (CC) recipients"),
      bcc: str("Blind carbon copy (BCC) recipients"),
      header: str("Subject line of the email"),
      body: str("Body of the email"),
      upload: str("Path of a file to attach (optional)"),
    },
    required: ["from", "to", "header", "body"],
    handler: () => "Mock Test: emailed the message to the recipient",
  }),
  defineTool({
    name: "sms_text",
    description: "Send SMS text",
    properties: {
      from: str("Sender phone number"),
      to: str("Recipient phone number"),
      body: str("Body of the SMS text"),
      upload: str("Path of a file to attach (optional)"),
    },
    required: ["from", "to", "body"],
    handler: () => "Mock Test: sent an sms text message to 0123456789 with message 'Hello'!",
  }),

  // II-3. Visualization
  defineTool({
    name: "visualize_table",
    description: "Visualize data by table",
    properties: {
      rows: arrayOf(arrayOf(str("Value of a table cell")), "Table rows; each row is an array of cell values"),
    },
    required: ["rows"],
    handler: () => "Mock Test: displayed a table given by a data from test.xlsx",
  }),
  defineTool({
    name: "visualize_line_graph",
    description: "Visualize data by line graph",
    properties: {
      layers: arrayOf(
        obj(
          {
            data: arrayOf(num("Value of a line graph node"), "Node values of the line"),
            line_color: str("Outline color of the line"),
            has_aul: bool("Whether to fill the area under the line"),
            has_legend: bool("Whether the graph has a legend"),
            aul_color: str("Fill color under the line"),
            x_min: num("Minimum x-value"),
            x_max: num("Maximum x-value"),
            x_interval: num("Interval of the x-axis"),
            x_text: str("Label of the x-axis"),
            y_min: num("Minimum y-value"),
            y_max: num("Maximum y-value"),
            y_interval: num("Interval of the y-axis"),
            y_text: str("Label of the y-axis"),
          },
          ["data", "x_text", "y_text"],
        ),
        "One entry per line drawn on the graph",
      ),
    },
    required: ["layers"],
    handler: () => "Mock Test: displayed a line graph given by a data from test.xlsx",
  }),
  defineTool({
    name: "visualize_bar_graph",
    description: "Visualize data by bar graph",
    properties: {
      data: arrayOf(
        obj(
          { label: str("Label of the bar"), value: num("Value of the bar"), color: str("Color of the bar") },
          ["label", "value"],
        ),
      ),
      orientation: enumStr("Orientation of the bar graph", ["vertical", "horizontal"]),
      x_text: str("Label of the x-axis"),
      y_text: str("Label of the y-axis"),
    },
    required: ["data", "x_text", "y_text"],
    handler: () => "Mock Test: displayed a bar graph given by a data from test.xlsx",
  }),
  defineTool({
    name: "visualize_pie_chart",
    description: "Visualize data by pie chart",
    properties: {
      data: arrayOf(
        obj(
          { label: str("Label of the slice"), value: num("Value of the slice"), color: str("Color of the slice") },
          ["label", "value"],
        ),
      ),
    },
    required: ["data"],
    handler: () => "Mock Test: displayed a pie chart given by a data from test.xlsx",
  }),
  defineTool({
    name: "visualize_scatter_graph",
    description: "Visualize data by scatter graph",
    properties: {
      data: arrayOf(
        obj({ x: num("X-value of the point"), y: num("Y-value of the point"), color: str("Color of the point") }, [
          "x",
          "y",
        ]),
      ),
    },
    required: ["data"],
    handler: () => "Mock Test: displayed a scatter graph given by a data from test.xlsx",
  }),
  defineTool({
    name: "visualize_heatmap",
    description: "Visualize data by heatmap",
    properties: {
      data: arrayOf(obj({ label: str("Label of the cell"), value: num("Value of the cell") }, ["label", "value"])),
    },
    required: ["data"],
    handler: () => "Mock Test: displayed a heatmap given by a data from test.xlsx",
  }),
  defineTool({
    name: "visualize_flowchart",
    description: "Visualize data by flowchart",
    properties: {
      nodes: arrayOf(
        obj(
          {
            id: str("Unique node id (same as label; append a number if duplicated)"),
            type: str("Node type, e.g. start, process, decision, end"),
            label: str("Label of the node"),
            color: str("Color of the node"),
          },
          ["type", "label"],
        ),
      ),
      arrows: arrayOf(
        obj({ from_id: str("Starting node id"), to_id: str("Ending node id") }, ["from_id", "to_id"]),
      ),
      conditionals: arrayOf(
        obj(
          {
            conditional_label: str("Condition text shown at the branching point"),
            from_id: str("Node id the condition branches from"),
            branches: arrayOf(
              obj({ label: str("Branch label, e.g. yes/no"), to_id: str("Node id this branch leads to") }, [
                "label",
                "to_id",
              ]),
            ),
          },
          ["conditional_label", "from_id", "branches"],
        ),
      ),
    },
    required: ["nodes", "arrows"],
    handler: () => "Mock Test: displayed a flowchart given by a data from test.xlsx",
  }),

  // II-4. Database management
  defineTool({
    name: "connect_database",
    description: "Connect to database",
    properties: {
      host: str("Hostname for the database connection"),
      user: str("Username for the database connection"),
      password: str("Password for the database connection"),
      database: str("Database name"),
    },
    required: ["host", "user", "password", "database"],
    // Never echo the password back into the model context.
    handler: (args) => `Mock Test: connected to '${String(args.database)}' at ${String(args.host)} as ${String(args.user)}`,
  }),
  defineTool({
    name: "execute_query",
    description: "Execute query in database",
    properties: {
      query: str("SQL query to execute"),
      read_result: str("What to read from the result after execution"),
    },
    required: ["query", "read_result"],
    handler: (args) => `Mock Test: executed query '${String(args.query)}'`,
  }),
  defineTool({
    name: "start_transaction",
    description: "Start transaction in database",
    handler: () => "Mock Test: transaction started",
  }),
  defineTool({
    name: "commit_database",
    description: "Commit changes in database",
    properties: { read_result: str("What to read after the commit") },
    required: ["read_result"],
    handler: () => "Mock Test: changes in table is committed",
  }),
  defineTool({
    name: "rollback_database",
    description: "Rollback the transaction, optionally to a specific savepoint",
    properties: { save_point: str("Name of the savepoint to roll back to (omit to roll back the whole transaction)") },
    handler: (args) =>
      args.save_point
        ? `Mock Test: rolled back to savepoint '${String(args.save_point)}'`
        : "Mock Test: rollback to the start of transaction",
  }),
  defineTool({
    name: "add_savepoint_database",
    description: "Add savepoint in database",
    properties: { save_point: str("Name of the savepoint to add") },
    required: ["save_point"],
    handler: (args) => `Mock Test: added savepoint named '${String(args.save_point)}'`,
  }),
];

const registry = new Map(registeredTools.map((t) => [t.definition.function.name, t]));
const toolDefinitions = registeredTools.map((t) => t.definition);

// Agent loop
const MAX_ITERATIONS = 8;

async function agentLoop(userPrompt: string): Promise<string> {
  const model = process.env.OLLAMA_DEFAULT_MODEL;
  if (!model) throw new Error("OLLAMA_DEFAULT_MODEL is not set");

  // `think: true` errors on models without thinking support, so make it switchable.
  const think = process.env.OLLAMA_THINK !== "false";
  const messages: Message[] = [{ role: "user", content: userPrompt }];
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await ollama.chat({ model, messages, tools: toolDefinitions, think });

    // Push the full assistant message (incl. tool_calls + thinking) so the model keeps its context.
    messages.push(response.message);

    const toolCalls = response.message.tool_calls ?? [];
    if (!toolCalls.length) return response.message.content;
    for (const call of toolCalls) {
      const name = call.function.name;
      const args = (call.function.arguments ?? {}) as Args;
      const tool = registry.get(name);

      if (!tool) {
        messages.push({ role: "tool", tool_name: name, content: `Error: unknown tool "${name}"` });
        continue;
      }
      try {
        const result = await tool.handler(args);
        console.log(`Called ${name}(${JSON.stringify(args)}) -> ${result}`);
        messages.push({ role: "tool", tool_name: name, content: String(result) });
      } catch (err) {
        // Feed the error back so the model can correct its arguments and retry.
        messages.push({
          role: "tool",
          tool_name: name,
          content: `Error executing ${name}: ${(err as Error).message}`,
        });
      }
    }
    console.log(`Iteration ${i + 1} done -----------------------------------`);
  }

  throw new Error(`Agent loop did not converge after ${MAX_ITERATIONS} iterations`);
}

// Route handlers
export async function GET() {
  try {
    const answer = await agentLoop("What is (11434+12341)*412?");
    return Response.json({ answer });
  } catch (err) {
    console.error(err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string };
    if (!prompt?.trim()) return Response.json({ error: "Missing 'prompt'" }, { status: 400 });
    const answer = await agentLoop(prompt);
    return Response.json({ answer });
  } catch (err) {
    console.error(err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}