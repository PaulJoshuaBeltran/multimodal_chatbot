// src/components/main/toolList.tsx
'use client'

import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Checkbox } from '../ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCw,
  SquarePen,
  Trash,
  Wrench
} from 'lucide-react'
import { ToolFormData } from '@/src/types/dialog'
import { SortField } from '@/src/types/tabs'
import { ToolDocument } from '@/src/types/knowledge'

const MOCK_KNOWLEDGE = [
  // File
  { id: 'tool-1', title: 'Create File', description: 'Creates new files and writes content to specified paths.', category: 'File', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-2', title: 'Read File', description: 'Reads file content from a specified path.', category: 'File', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-3', title: 'Update File', description: 'Updates existing files by modifying or replacing their content.', category: 'File', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-4', title: 'Delete File', description: 'Deletes files from specified paths.', category: 'File', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-5', title: 'Get File Metadata', description: 'Retrieves file metadata, including name, size, type, and timestamps.', category: 'File', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  // Messaging
  { id: 'tool-6', title: 'Send Email', description: 'Composes and sends emails to specified recipients with optional subjects and attachments.', category: 'Messaging', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  // Visualization
  { id: 'tool-7', title: 'Generate Table', description: 'Generates tables to organize and present structured data.', category: 'Visualization', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-8', title: 'Generate Line Graph', description: 'Generates line graphs to visualize trends and changes over continuous intervals.', category: 'Visualization', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-9', title: 'Generate Bar Graph', description: 'Generates bar graphs to compare values across categories.', category: 'Visualization', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-10', title: 'Generate Pie Chart', description: 'Generates pie charts to illustrate proportions and percentage distributions.', category: 'Visualization', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-11', title: 'Generate Scatter Plot', description: 'Generates scatter plots to analyze relationships and correlations between variables.', category: 'Visualization', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-12', title: 'Generate Heatmap', description: 'Generates heatmaps to visualize data intensity, distributions, and correlations using color.', category: 'Visualization', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-13', title: 'Generate Flowchart', description: 'Generates flowcharts to represent processes, workflows, and decision paths.', category: 'Visualization', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  // Database Management
  { id: 'tool-14', title: 'Create Database Connection', description: 'Creates and configures database connections using specified connection parameters.', category: 'Database', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-15', title: 'Execute Query', description: 'Executes database queries and retrieves results from database tables.', category: 'Database', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-16', title: 'Start Transaction', description: 'Starts database transactions and establishes a transactional scope for operations.', category: 'Database', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-17', title: 'Commit Transaction', description: 'Commits a database transaction and retrieves the resulting operation status or content.', category: 'Database', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-18', title: 'Rollback Transaction', description: 'Rolls back a transaction to a specified savepoint or its beginning.', category: 'Database', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-19', title: 'Create Savepoint', description: 'Creates a savepoint within an active transaction for partial rollback.', category: 'Database', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  // Quantitative Analysis
  { id: 'tool-20', title: 'Numerical Analysis', description: 'Performs numerical computations, mathematical operations, and statistical analysis.', category: 'Quant', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
  { id: 'tool-21', title: 'Machine Learning', description: 'Executes machine learning workflows for data preprocessing, model training, inference, and evaluation.', category: 'Quant', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM' },
];

const ROWS_PER_PAGE_OPTIONS = [4, 8, 10, 20]

const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'category', label: 'Category' },
  { value: 'createdAt', label: 'Created At' },
  { value: 'updatedAt', label: 'Updated At' },
]

function getSortValue(
  doc: ToolDocument,
  field: SortField
): string | number | undefined {
  switch (field) {
    case 'title':
      return doc.title
    case 'category':
      return doc.category
    case 'createdAt':
      return new Date(doc.createdAt).getTime()
    case 'updatedAt':
      return new Date(doc.updatedAt).getTime()
  }
}

// Builds a compact page-number sequence with ellipses, e.g. 1 … 4 5 6 … 12
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  const delta = 1 // pages to show on either side of current

  const range = new Set<number>()
  range.add(1)
  range.add(total)
  for (let p = current - delta; p <= current + delta; p++) {
    if (p > 1 && p < total) range.add(p)
  }

  const sorted = Array.from(range).sort((a, b) => a - b)
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) pages.push('ellipsis')
    pages.push(p)
    prev = p
  }
  return pages
}

export function ToolList() {
  const [selectedtools, setSelectedtools] = useState<Record<string, boolean>>({
    'tool-1': true,
    'tool-3': true,
  })
  const [toolPage, settoolPage] = useState(1)
  const [toolS_PER_PAGE, settoolPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [dialogInitialData, setDialogInitialData] = useState<ToolFormData | undefined>(undefined)

  const openAddDialog = () => {
    setDialogMode('add')
    setDialogInitialData(undefined)
    setDialogOpen(true)
  }

  const openEditDialog = () => {
    const selectedIds = Object.entries(selectedtools)
      .filter(([, v]) => v)
      .map(([id]) => id)
    const target = MOCK_KNOWLEDGE.find((k) => k.id === selectedIds[0])
    if (!target) return
    setDialogMode('edit')
    setDialogInitialData({
      id: target.id,
      title: target.title,
      description: target.description,
      category: target.category,
    })
    setDialogOpen(true)
  }

  const hasSelection = Object.values(selectedtools).some(Boolean)

  const sortedTool = useMemo(() => {
    const copy = [...MOCK_KNOWLEDGE]
    copy.sort((a, b) => {
      const av = getSortValue(a, sortField)
      const bv = getSortValue(b, sortField)
      const cmp =
        typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return copy
  }, [sortField, sortDirection])

  const totalPages = Math.ceil(sortedTool.length / toolS_PER_PAGE)
  const paginatedtools = sortedTool.slice(
    (toolPage - 1) * toolS_PER_PAGE,
    toolPage * toolS_PER_PAGE
  )

  const toggletool = (toolId: string) =>
    setSelectedtools((prev) => ({ ...prev, [toolId]: !prev[toolId] }))

  const handleRowsPerPageChange = (value: string) => {
    settoolPerPage(Number(value))
    settoolPage(1) // reset to first page so the view doesn't land out of bounds
  }

  const handleSortFieldChange = (value: string) => {
    setSortField(value as SortField)
    settoolPage(1)
  }

  const toggleSortDirection = () => {
    setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    settoolPage(1)
  }

  const pageNumbers = getPageNumbers(toolPage, totalPages)

  return (
    <div className="flex-1 flex flex-col min-h-0 p-8 overflow-hidden max-w-5xl w-full mx-auto justify-start">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <Wrench className="w-5 h-5 text-primary" />
        Tool Data Management
      </h1>

      {/* Menu Buttons */}
      <div
        className="flex items-center pt-4 mb-2"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <div className="flex items-center gap-1 ml-1">
          <Select value={sortField} onValueChange={handleSortFieldChange}>
            <SelectTrigger className="h-8 w-[140px] bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELD_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  style={{ backgroundColor: 'var(--gray3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="hover:border-white"
            size="sm"
            onClick={toggleSortDirection}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      <ScrollArea type="auto" className="flex-1 min-h-0 border border-border rounded-xl bg-card">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[160px]">ID</TableHead>
              <TableHead className="w-[200px] font-medium">Tool Name</TableHead>
              <TableHead> Description</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[120px]">CreatedAt</TableHead>
              <TableHead className="w-[120px]">UpdatedAt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedtools.map((tool) => {
              return (
                <TableRow
                  key={tool.id}
                  onClick={() => toggletool(tool.id)}
                  className={`cursor-pointer transition-colors 'hover:bg-muted/40'`}
                >
                  <TableCell className="align-middle py-4" onClick={(e) => e.stopPropagation()}>
                    {tool.id}
                  </TableCell>
                  <TableCell className="font-semibold align-middle py-4">
                    <label htmlFor={tool.id} className="cursor-pointer block">
                      {tool.title}
                    </label>
                  </TableCell>
                  <TableCell className={`align-middle py-4 text-muted-foreground`}>
                    {tool.description}
                  </TableCell>
                  <TableCell className="align-middle py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                      {tool.category}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle py-4">
                    {tool.createdAt}
                  </TableCell>
                  <TableCell className="align-middle py-4">
                    {tool.updatedAt}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      <div
        className="flex items-center justify-between border-t border-border pt-4 mt-4"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <span className="text-sm text-muted-foreground">
          Page <strong>{toolPage}</strong> of {totalPages} ({sortedTool.length} elements
          total)
        </span>

        <div className="flex items-center space-x-2">
          <Button
            className="hover:border-white"
            size="sm"
            onClick={() => settoolPage((p) => Math.max(p - 1, 1))}
            disabled={toolPage === 1}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
          >
            <ChevronLeft className="h-8 w-8 mr-1" />
            Previous
          </Button>

          <div className="flex items-center">
            {pageNumbers.map((page, idx) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-sm text-muted-foreground select-none"
                >
                  …
                </span>
              ) : (
                <Button
                  key={page}
                  size="sm"
                  className="h-8 w-8 hover:border-white"
                  onClick={() => settoolPage(page)}
                  style={page === toolPage ? undefined : { backgroundColor: 'var(--gray3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
                >
                  {page}
                </Button>
              )
            )}
          </div>

          <Button
            className="hover:border-white"
            size="sm"
            onClick={() => settoolPage((p) => Math.min(p + 1, totalPages))}
            disabled={toolPage === totalPages}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
          >
            Next
            <ChevronRight className="h-8 w-8 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Select value={String(toolS_PER_PAGE)} onValueChange={handleRowsPerPageChange}>
            <SelectTrigger className="h-8 w-[70px] flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem
                  key={option}
                  value={String(option)}
                  style={{ backgroundColor: 'var(--gray3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">rows per page</span>
        </div>
      </div>
    </div>
  )
}