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

export const MOCK_KNOWLEDGE = [
  { id: 'tool-1', name: 'Web Search',         description: 'Queries search engines for live web information.',                  category: 'Information', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-2', name: 'Python Sandbox',     description: 'Executes untrusted mathematical and algorithmic scripts securely.', category: 'Runtime'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-3', name: 'Document Parser',    description: 'Extracts structural semantics from text, PDF, and CSV payloads.',   category: 'Data'       , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-4', name: 'Image Vectorizer',   description: 'Translates pixel layouts into relational coordinate systems.',      category: 'Vision'     , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-5', name: 'Time-Zone Engine',   description: 'Normalizes chronological structures across spatial zones.',         category: 'Utility'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-6', name: 'Currency Evaluator', description: 'Fetches real-time financial conversions and spot prices.',          category: 'Finance'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-7', name: 'Web Search 1',         description: 'Queries search engines for live web information.',                  category: 'Information', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-8', name: 'Python Sandbox 1',     description: 'Executes untrusted mathematical and algorithmic scripts securely.', category: 'Runtime'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-9', name: 'Document Parser 1',    description: 'Extracts structural semantics from text, PDF, and CSV payloads.',   category: 'Data'       , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-10', name: 'Image Vectorizer 1',   description: 'Translates pixel layouts into relational coordinate systems.',      category: 'Vision'     , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-11', name: 'Time-Zone Engine 1',   description: 'Normalizes chronological structures across spatial zones.',         category: 'Utility'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'tool-12', name: 'Currency Evaluator 1', description: 'Fetches real-time financial conversions and spot prices.',          category: 'Finance'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
]

const ROWS_PER_PAGE_OPTIONS = [4, 8, 10, 20]

const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'createdAt', label: 'Created At' },
  { value: 'updatedAt', label: 'Updated At' },
]

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
  const [sortField, setSortField] = useState<SortField>('name')
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
      name: target.name,
      description: target.description,
      category: target.category,
    })
    setDialogOpen(true)
  }

  const hasSelection = Object.values(selectedtools).some(Boolean)

  const sortedTool = useMemo(() => {
    const copy = [...MOCK_KNOWLEDGE]
    copy.sort((a, b) => {
      let cmp: number
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        cmp = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
      } else {
        cmp = a[sortField].localeCompare(b[sortField])
      }
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
        <Button
          className="hover:border-white mr-1"
          size="sm"
          // onClick={() => settoolPage((p) => Math.max(p - 1, 1))}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
        >
          <RotateCw className="h-8 w-8 mr-1" />
          Refresh
        </Button>
        
        <Button
          className="hover:border-white mr-1"
          size="sm"
          onClick={openAddDialog}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
        >
          <Plus className="h-8 w-8 mr-1" />
          Add
        </Button>

        {hasSelection ? (
          <>
            <Button
              className="hover:border-white mr-1"
              size="sm"
              onClick={openEditDialog}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
            >
              <SquarePen className="h-8 w-8 mr-1" />
              Edit Selected
            </Button>

            <Button
              className="hover:border-white bg-[var(--red3)] mr-1"
              size="sm"
              // onClick={() => settoolPage((p) => Math.max(p - 1, 1))}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--red2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--red3)')}
            >
              <Trash className="h-8 w-8 mr-1" />
              Delete Selected
            </Button>
          </>
        ) : (
          <Button
            className="hover:border-white bg-[var(--red3)] mr-1"
            size="sm"
            // onClick={() => settoolPage((p) => Math.max(p - 1, 1))}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--red2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--red3)')}
          >
            <Trash className="h-8 w-8 mr-1" />
            Delete All
          </Button>
        )}

        {/* Sort by field */}
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
              <TableHead className="hidden w-0 p-0">
                <Checkbox className="mr-2" checked={false}></Checkbox>
              </TableHead>
              <TableHead className="w-[100px]">
                <Checkbox className="mr-2" checked={false}></Checkbox>
              </TableHead>
              <TableHead className="w-[200px] font-medium">Tool Name</TableHead>
              <TableHead> Description</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[120px]">CreatedAt</TableHead>
              <TableHead className="w-[120px]">UpdatedAt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedtools.map((tool) => {
              const isSelected = !!selectedtools[tool.id]
              return (
                <TableRow
                  key={tool.id}
                  onClick={() => toggletool(tool.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-white text-black hover:bg-white' : 'hover:bg-muted/40'
                  }`}
                >
                  <TableCell className="hidden w-0 p-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggletool(tool.id)}
                    />
                  </TableCell>
                  <TableCell className="align-middle py-4" onClick={(e) => e.stopPropagation()}>
                    {/* Checkable, but uncontrolled — its own click state, not wired to selection */}
                    <Checkbox id={tool.id} />
                  </TableCell>
                  <TableCell className="font-semibold align-middle py-4">
                    <label htmlFor={tool.id} className="cursor-pointer block">
                      {tool.name}
                    </label>
                  </TableCell>
                  <TableCell className={`align-middle py-4 ${isSelected ? '' : 'text-muted-foreground'}`}>
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