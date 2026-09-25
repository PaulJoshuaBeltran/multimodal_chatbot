// src/app/api/chat/toolcall/route.ts
import { ollama } from "@/lib/ollama";
import type { Message } from "ollama";

type ToolName = 'add' |
  'multiply' |
  'create_file' |
  'read_file' |
  'update_file' |
  'delete_file' |
  'view_file_metadata' |
  'email' |
  'sms_text' |
  'visualize_table' |
  'visualize_line_graph' |
  'visualize_bar_graph' |
  'visualize_pie_chart' |
  'visualize_scatter_graph' |
  'visualize_heatmap' |
  'visualize_flowchart' |
  'connect_database' |
  'execute_query' |
  'start_transaction' |
  'commit_database' |
  'rollback_database' |
  'add_savepoint_database'

// FUNCTIONS (MOCK for now)
// I. Tests
function add(a: number, b: number): number {
  return a + b
}
function multiply(a: number, b: number): number {
  return a * b
}
// II. Actual
// 1. File management
function create_file(a: number, b: number): string {
  return "Mock Test: new file created named test.pdf"
}
function read_file(a: number, b: number): string {
  return "Mock Test: read file named test.pdf"
}
function update_file(a: number, b: number): string {
  return "Mock Test: updated file named test.pdf"
}
function delete_file(a: number, b: number): string {
  return "Mock Test: deleted file named test.pdf"
}
function view_file_metadata(a: number, b: number): string {
  return "Mock Test: displayed the metadata for file named test.pdf"
}

// 2. Message
function email(a: number, b: number): string {
  return "Mock Test: emailed the message to the recipient"
}
function sms_text(a: number, b: number): string {
  return "Mock Test: sent an sms text message to 0123456789 with message 'Hello'!"
}

// 3. Visualization
function visualize_table(a: number, b: number): string {
  return "Mock Test: displayed a table given by a data from test.xlsx"
}
function visualize_line_graph(a: number, b: number): string {
  return "Mock Test: displayed a line graph given by a data from test.xlsx"
}
function visualize_bar_graph(a: number, b: number): string {
  return "Mock Test: displayed a bar graph given by a data from test.xlsx"
}
function visualize_pie_chart(a: number, b: number): string {
  return "Mock Test: displayed a pie chart given by a data from test.xlsx"
}
function visualize_scatter_graph(a: number, b: number): string {
  return "Mock Test: displayed a scatter graph given by a data from test.xlsx"
}
function visualize_heatmap(a: number, b: number): string {
  return "Mock Test: displayed a heatmap given by a data from test.xlsx"
}
function visualize_flowchart(a: number, b: number): string {
  return "Mock Test: displayed a flowchart given by a data from test.xlsx"
}

// 4. Database management
function connect_database(a: number, b: number): string {
  return "Mock Test: database connect with hostname@username with password '123456' and database 'test_db'"
}
function execute_query(a: number, b: number): string {
  return "Mock Test: executed query specifically 'SELECT * FROM test_table'"
}
function start_transaction(a: number, b: number): string {
  return "Mock Test: transaction started"
}
function commit_database(a: number, b: number): string {
  return "Mock Test: changes in table is committed"
}
function rollback_database(a: number, b: number): string {
  return "Mock Test: rollback to the start of transaction"
}
function add_savepoint_database(a: number, b: number): string {
  return "Mock Test: added savepoint named 'savepoint123456'"
}

const availableFunctions: Record<ToolName, (a: number, b: number) => number | string> = {
  add,
  multiply,
  create_file,
  read_file,
  update_file,
  delete_file,
  view_file_metadata,
  email,
  sms_text,
  visualize_table,
  visualize_line_graph,
  visualize_bar_graph,
  visualize_pie_chart,
  visualize_scatter_graph,
  visualize_heatmap,
  visualize_flowchart,
  connect_database,
  execute_query,
  start_transaction,
  commit_database,
  rollback_database,
  add_savepoint_database
}

// TOOLS
// I. Tests
const add_tool = {
  type: 'function',
  function: {
    name: 'add',
    description: 'Add two numbers',
    parameters: {
      type: 'object',
      required: ['a', 'b'],
      properties: {
        a: { type: 'integer', description: 'The first number' },
        b: { type: 'integer', description: 'The second number' },
      },
    },
  }
}
const multiply_tool = { 
  type: 'function',
  function: {
    name: 'multiply',
    description: 'Multiply two numbers',
    parameters: {
      type: 'object',
      required: ['a', 'b'],
      properties: {
        a: { type: 'integer', description: 'The first number' },
        b: { type: 'integer', description: 'The second number' },
      },
    },
  },
}
// II. Actual
// 1. File management
const create_file_tool = { 
  type: 'function',
  function: {
    name: 'create_file',
    description: 'Create local file',
    parameters: {
      type: 'object',
      required: ['filepath', 'filename', 'filetype', 'content'],
      properties: {
        filepath: { type: 'string', description: 'The filepath of newly created file' },
        filename: { type: 'string', description: 'The filename of newly created file' },
        filetype: { type: 'string', description: 'The filename of newly created file' },
        content: { type: 'string', description: 'The content of newly created file' },
      },
    },
  },
}
const read_file_tool = { 
  type: 'function',
  function: {
    name: 'read_file',
    description: 'Read local file',
    parameters: {
      type: 'object',
      required: ['filepath', 'filename', 'filetype'],
      properties: {
        filepath: { type: 'string', description: 'The filepath of existing file to read' },
        filename: { type: 'string', description: 'The filename of existing file to read' },
        filetype: { type: 'string', description: 'The filename of existing file to read' },
      },
    },
  },
}
const update_file_tool = { 
  type: 'function',
  function: {
    name: 'update_file',
    description: 'Update local file',
    parameters: {
      type: 'object',
      required: ['filepath', 'filename', 'filetype', 'new_content'],
      properties: {
        filepath: { type: 'string', description: 'The filepath of existing file to update' },
        filename: { type: 'string', description: 'The filename of existing file to update' },
        filetype: { type: 'string', description: 'The filename of existing file to update' },
        new_content: { type: 'string', description: 'The new content of existing file to update' },
      },
    },
  },
}
const delete_file_tool = { 
  type: 'function',
  function: {
    name: 'delete_file',
    description: 'Delete local file',
    parameters: {
      type: 'object',
      required: ['filepath', 'filename', 'filetype'],
      properties: {
        filepath: { type: 'string', description: 'The filepath of existing file to delete' },
        filename: { type: 'string', description: 'The filename of existing file to delete' },
        filetype: { type: 'string', description: 'The filename of existing file to delete' },
      },
    },
  },
}
const view_file_metadata_tool = { 
  type: 'function',
  function: {
    name: 'view_file_metadata',
    description: "View local file's metadata",
    parameters: {
      type: 'object',
      required: ['filepath', 'filename', 'filetype'],
      properties: {
        filepath: { type: 'string', description: 'The filepath of existing file to view metadata' },
        filename: { type: 'string', description: 'The filename of existing file to view metadata' },
        filetype: { type: 'string', description: 'The filename of existing file to view metadata' },
      },
    },
  },
}

// 2. Message
const email_tool = { 
  type: 'function',
  function: {
    name: 'email',
    description: 'Send email',
    parameters: {
      type: 'object',
      required: ['from', 'to', 'header', 'body', 'upload'],
      properties: {
        from: { type: 'string', description: 'Sender of email to send' },
        to: { type: 'string', description: 'Recipient of email to send' },
        cc: { type: 'string', description: 'Carbon copy (CC) of email to send' },
        bcc: { type: 'string', description: 'Blind carbon copy (BCC) of email to send' },
        header: { type: 'string', description: 'Header of email to send' },
        body: { type: 'string', description: 'Body of email to send' },
        upload: { type: 'string', description: 'Upload of email to send' },
      },
    },
  },
}
const sms_text_tool = { 
  type: 'function',
  function: {
    name: 'sms_text',
    description: 'Send SMS text',
    parameters: {
      type: 'object',
      required: ['from', 'to', 'body', 'upload'],
      properties: {
        from: { type: 'string', description: 'Phone number of SMS text sender' },
        to: { type: 'string', description: "Phone number of SMS text's recipient to send" },
        body: { type: 'string', description: 'Body of SMS text to send' },
        upload: { type: 'string', description: 'Upload of SMS text to send' },
      },
    },
  },
}

// 3. Visualization
const visualize_table_tool = { 
  type: 'function',
  function: {
    name: 'visualize_table',
    description: 'Visualize data by table',
    parameters: {
      type: 'object',
      required: ['page'],
      properties: {
        page: {
          type: 'array',
          required: ['rows'],
          properties: {
            rows: {
              type: 'array',
              required: ['cols'],
              cols: {
                type: 'array',
                required: ['value'],
                properties: {
                  value: { type: 'string', description: "Value of specific table's cell" },
                }
              }
            }
          }
        }
      },
    },
  },
}
const visualize_line_graph_tool = { 
  type: 'function',
  function: {
    name: 'visualize_line_graph',
    description: 'Visualize data by line graph',
    parameters: {
      type: 'object',
      required: ['layer'],
      properties: {
        layer: {
          type: 'array',
          required: ['data', 'x_text', 'y_text'],
          properties: {
            data: {
              type: 'array',
              required: ['value'],
              properties: {
                value: { type: 'integer', description: "Value of specific line graph's node" },
              }
            },
            line_color: { type: 'string',  description: 'Outline color of line graph' },
            has_auc:    { type: 'boolean', description: 'Does line graph have area under the line' },
            has_legend: { type: 'boolean', description: 'Does line graph have legend' },
            auc_color:  { type: 'string',  description: 'Background color of line graph under the line' },
            x_min:      { type: 'integer', description: 'Minimum x-value of line graph' },
            x_max:      { type: 'integer', description: 'Maximum x-value of line graph' },
            x_interval: { type: 'integer', description: "Interval values in line graph's x-axis" },
            x_text:     { type: 'string',  description: "Label text of line graph's x-axis" },
            y_min:      { type: 'integer', description: 'Minimum y-value of line graph' },
            y_max:      { type: 'integer', description: 'Maximum y-value of line graph' },
            y_interval: { type: 'integer', description: "Interval values in line graph's y-axis" },
            y_text:     { type: 'string',  description: "Label text of line graph's y-axis" },
          }
        }
      },
    },
  },
}
const visualize_bar_graph_tool = { 
  type: 'function',
  function: {
    name: 'visualize_bar_graph',
    description: 'Visualize data by bar graph',
    parameters: {
      type: 'object',
      required: ['data', 'x_text', 'y_text'],
      properties: {
        data: {
          type: 'array',
          required: ['label', 'value'],
          properties: {
            label: { type: 'string',  description: "Label of specific bar graph's bar" },
            value: { type: 'integer', description: "Value of specific bar graph's bar" },
            color: { type: 'string',  description: "Color of specific bar graph's bar" },
          }
        },
        orientation: { type: 'string',  description: 'Orientation of bar graph' },
        x_text:      { type: 'string',  description: "Label text of bar graph's x-axis" },
        y_text:      { type: 'string',  description: "Label text of bar graph's y-axis" },
      }
    }
  }
}
const visualize_pie_chart_tool = { 
  type: 'function',
  function: {
    name: 'visualize_pie_chart',
    description: 'Visualize data by pie chart',
    parameters: {
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'array',
          required: ['label', 'value'],
          properties: {
            label: { type: 'string',  description: "Label of specific pie chart's pie" },
            value: { type: 'integer', description: "Value of specific pie chart's pie" },
            color: { type: 'string',  description: "Color of specific pie chart's pie" },
          }
        }
      }
    }
  }
}
const visualize_scatter_graph_tool = { 
  type: 'function',
  function: {
    name: 'visualize_scatter_graph',
    description: 'Visualize data by scatter graph',
    parameters: {
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'array',
          required: ['x', 'y'],
          properties: {
            x:     { type: 'integer', description: "X-value of scatter graph element" },
            y:     { type: 'integer', description: "Y-value of scatter graph element" },
            color: { type: 'string',  description: "Color of scatter graph" },
          }
        }
      }
    }
  }
}
const visualize_heatmap_tool = { 
  type: 'function',
  function: {
    name: 'visualize_heatmap',
    description: 'Visualize data by heatmap',
    parameters: {
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'array',
          required: ['label', 'value'],
          properties: {
            label: { type: 'string',  description: "Label of heatmap's element" },
            value: { type: 'integer', description: "Value of heatmap's element" },
          }
        }
      }
    }
  }
}
const visualize_flowchart_tool = { 
  type: 'function',
  function: {
    name: 'visualize_flowchart',
    description: 'Visualize data by flowchart',
    parameters: {
      type: 'object',
      required: ['nodes', 'arrows'],
      properties: {
        nodes: {
          type: 'array',
          required: ['type', 'label'],
          properties: {
            id:    { type: 'string', description: "Id of flowchart's element (same as label, if there's duplicate then append duplicate number)" },
            type:  { type: 'string', description: "Type of flowchart's element" },
            label: { type: 'string', description: "Label of flowchart's element" },
            color: { type: 'string', description: "Color of flowchart's element" },
          }
        },
        arrows: {
          type: 'array',
          required: ['from_id', 'to_id'],
          properties: {
            from_id: { type: 'string', description: "Starting node ID of arrow" },
            to_id:   { type: 'string', description: "End node ID of arrow" }
          }
        },
        conditionals: {
          type: 'array',
          required: ['conditional_label', 'from_id', 'to_ids'],
          properties: {
            conditional_label: { type: 'string', description: "Starting point of arrow" },
            from_id: { type: 'string', description: "Starting node ID of conditional" },
            to_ids:  {
              type: 'array',
              required: ['label', 'to_ids'],
              properties: {
                label:  { type: 'string', description: "Label of specific end node" },
                to_ids:   { type: 'string', description: "End node ID of conditional" }
              }
            },
          }
        },
      }
    }
  }
}

// 4. Database management
const connect_db_tool = { 
  type: 'function',
  function: {
    name: 'connect_database',
    description: 'Connect to database',
    parameters: {
      type: 'object',
      required: ['host', 'user', 'password', 'database'],
      properties: {
        host:     { type: 'string', description: 'Hostname for database connection' },
        user:     { type: 'string', description: 'Username for database connection' },
        password: { type: 'string', description: 'Password for database connection' },
        database: { type: 'string', description: 'Database name for database connection' },
      },
    },
  },
}
const execute_query_tool = { 
  type: 'function',
  function: {
    name: 'execute_query',
    description: 'Execute query in database',
    parameters: {
      type: 'object',
      required: ['query', 'read_result'],
      properties: {
        query:       { type: 'string',  description: 'Query to execute in database' },
        read_result:  { type: 'string', description: 'What to read after the execution in database' },
      }
    }
  }
}
const start_transaction_tool = { 
  type: 'function',
  function: {
    name: 'start_transaction',
    description: 'Start transaction in database'
  }
}
const commit_db_tool = { 
  type: 'function',
  function: {
    name: 'commit_database',
    description: 'Commit changes in database',
    parameters: {
      type: 'object',
      required: ['read_result'],
      properties: {
        read_result:  { type: 'string', description: 'What to read after the commit in database' },
      }
    }
  }
}
const rollback_db_tool = { 
  type: 'function',
  function: {
    name: 'rollback_database',
    description: 'Rollback to specific savepoint from database',
    parameters: {
      type: 'object',
      properties: {
        save_point:  { type: 'string', description: 'What to read after the commit in database' },
      }
    }
  }
}
const add_savepoint_db_tool = { 
  type: 'function',
  function: {
    name: 'add_savepoint_database',
    description: 'Add savepoint in database',
    parameters: {
      type: 'object',
      properties: {
        save_point:  { type: 'string', description: 'Name of save point to be added in database' },
      }
    }
  }
}

const tools = [
  add_tool,
  multiply_tool,
  create_file_tool,
  read_file_tool,
  update_file_tool,
  delete_file_tool,
  view_file_metadata_tool,
  email_tool,
  sms_text_tool,
  visualize_table_tool,
  visualize_line_graph_tool,
  visualize_bar_graph_tool,
  visualize_pie_chart_tool,
  visualize_scatter_graph_tool,
  visualize_heatmap_tool,
  visualize_flowchart_tool,
  connect_db_tool,
  execute_query_tool,
  start_transaction_tool,
  commit_db_tool,
  rollback_db_tool,
  add_savepoint_db_tool
]

async function agentLoop(userPrompt: string): Promise<string> {
  const messages: Message[] = [{ role: 'user', content: userPrompt }]
  const MAX_ITERATIONS = 8

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await ollama.chat({
      model: process.env.OLLAMA_DEFAULT_MODEL ?? "",
      messages,
      tools,
      think: true,
    })

    const toolCalls = response.message.tool_calls ?? []

    messages.push(response.message)

    if (!toolCalls.length) {
      return response.message.content
    }

    for (const call of toolCalls) {
      const fn = availableFunctions[call.function.name as ToolName]
      if (!fn) {
        messages.push({
          role: 'tool',
          tool_name: call.function.name,
          content: `Error: unknown tool "${call.function.name}"`,
        })
        continue
      }

      const args = call.function.arguments as { a: number; b: number }
      let result: number | string
      try {
        result = fn(args.a, args.b)
      } catch (err) {
        messages.push({
          role: 'tool',
          tool_name: call.function.name,
          content: `Error executing ${call.function.name}: ${(err as Error).message}`,
        })
        continue
      }

      console.log(`Called ${call.function.name}(${args.a}, ${args.b}) -> ${result}`)
      messages.push({ role: 'tool', tool_name: call.function.name, content: String(result) })
    }
    console.log(`Messages: ${messages.map((m) => `\n${JSON.stringify(m)}`)}`)
    console.log("-----------------------------------------------------------")
  }

  throw new Error(`Agent loop did not converge after ${MAX_ITERATIONS} iterations`)
}

export async function GET() {
  try {
    const answer = await agentLoop('What is (11434+12341)*412?')
    return Response.json({ answer })
  } catch (err) {
    console.error(err)
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}