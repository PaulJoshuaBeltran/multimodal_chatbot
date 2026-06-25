// src/components/main/ToolList.tsx
'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Checkbox } from '../ui/checkbox'
import { Wrench, ChevronLeft, ChevronRight } from 'lucide-react'

export const MOCK_TOOLS = [
  { id: 'tool-1', name: 'Web Search',        description: 'Queries search engines for live web information.',                      version: 'v1.0.2', category: 'Information' },
  { id: 'tool-2', name: 'Python Sandbox',    description: 'Executes untrusted mathematical and algorithmic scripts securely.',     version: 'v2.1.0', category: 'Runtime'     },
  { id: 'tool-3', name: 'Document Parser',   description: 'Extracts structural semantics from text, PDF, and CSV payloads.',      version: 'v1.4.0', category: 'Data'        },
  { id: 'tool-4', name: 'Image Vectorizer',  description: 'Translates pixel layouts into relational coordinate systems.',         version: 'v0.9.1', category: 'Vision'      },
  { id: 'tool-5', name: 'Time-Zone Engine',  description: 'Normalizes chronological structures across spatial zones.',            version: 'v1.1.1', category: 'Utility'     },
  { id: 'tool-6', name: 'Currency Evaluator',description: 'Fetches real-time financial conversions and spot prices.',             version: 'v2.0.4', category: 'Finance'     },
]

const TOOLS_PER_PAGE = 4

export function ToolList() {
  const [selectedTools, setSelectedTools] = useState<Record<string, boolean>>({
    'tool-1': true,
    'tool-3': true,
  })
  const [toolPage, setToolPage] = useState(1)

  const totalPages = Math.ceil(MOCK_TOOLS.length / TOOLS_PER_PAGE)
  const paginatedTools = MOCK_TOOLS.slice(
    (toolPage - 1) * TOOLS_PER_PAGE,
    toolPage * TOOLS_PER_PAGE
  )

  const toggleTool = (toolId: string) =>
    setSelectedTools((prev) => ({ ...prev, [toolId]: !prev[toolId] }))

  return (
    <div className="flex-1 flex flex-col min-h-0 p-8 overflow-hidden max-w-5xl w-full mx-auto justify-start">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          Available Capabilities &amp; Tools
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable specialized modular execution plug-ins contextually accessible by active
          models.
        </p>
      </div>

      {/* Table */}
      <ScrollArea type="auto" className="flex-1 min-h-0 border border-border rounded-xl bg-card">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[100px]">Active Status</TableHead>
              <TableHead className="w-[200px] font-medium">Tool Name</TableHead>
              <TableHead>Functional Description</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[100px] text-right">Build Release</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTools.map((tool) => (
              <TableRow key={tool.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="align-middle py-4">
                  <Checkbox
                    id={tool.id}
                    checked={!!selectedTools[tool.id]}
                    onCheckedChange={() => toggleTool(tool.id)}
                  />
                </TableCell>
                <TableCell className="font-semibold text-foreground align-middle py-4">
                  <label htmlFor={tool.id} className="cursor-pointer block">
                    {tool.name}
                  </label>
                </TableCell>
                <TableCell className="text-muted-foreground align-middle py-4">
                  {tool.description}
                </TableCell>
                <TableCell className="align-middle py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                    {tool.category}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground font-mono align-middle py-4">
                  {tool.version}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      <div
        className="flex items-center justify-between border-t border-border pt-4 mt-4"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <span className="text-sm text-muted-foreground">
          Showing Page <strong>{toolPage}</strong> of {totalPages} ({MOCK_TOOLS.length} elements
          total)
        </span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setToolPage((p) => Math.max(p - 1, 1))}
            disabled={toolPage === 1}
            style={{ backgroundColor: 'var(--gray3)' }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setToolPage((p) => Math.min(p + 1, totalPages))}
            disabled={toolPage === totalPages}
            style={{ backgroundColor: 'var(--gray3)' }}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
