// src/components/main/knowledgeList.tsx
'use client'

import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
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
  Brain,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCw,
  SquarePen,
  Trash,
} from 'lucide-react'
import { KnowledgeFormData } from '@/src/types/dialog'
import { AddEditKnowledgeDialog } from '../dialogs/OtherDialogs'
import { SortField } from '@/src/types/tabs'

export const MOCK_KNOWLEDGE = [
  { id: 'knowledge-1', description: 'Queries search engines for live web information.',                  category: 'Information', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-2', description: 'Executes untrusted mathematical and algorithmic scripts securely.', category: 'Runtime'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-3', description: 'Extracts structural semantics from text, PDF, and CSV payloads.',   category: 'Data'       , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-4', description: 'Translates pixel layouts into relational coordinate systems.',      category: 'Vision'     , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-5', description: 'Normalizes chronological structures across spatial zones.',         category: 'Utility'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-6', description: 'Fetches real-time financial conversions and spot prices.',          category: 'Finance'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-7', description: 'Queries search engines for live web information.',                  category: 'Information', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-8', description: 'Executes untrusted mathematical and algorithmic scripts securely.', category: 'Runtime'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-9', description: 'Extracts structural semantics from text, PDF, and CSV payloads.',   category: 'Data'       , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-10', description: 'Translates pixel layouts into relational coordinate systems.',      category: 'Vision'     , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-11', description: 'Normalizes chronological structures across spatial zones.',         category: 'Utility'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-12', description: 'Fetches real-time financial conversions and spot prices.',          category: 'Finance'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
]

const ROWS_PER_PAGE_OPTIONS = [4, 8, 10, 20]

const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'description', label: 'Description' },
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

export function RAGList() {
  const [selectedknowledges, setSelectedknowledges] = useState<Record<string, boolean>>({
    'knowledge-1': true,
    'knowledge-3': true,
  })
  const [knowledgePage, setknowledgePage] = useState(1)
  const [knowledgeS_PER_PAGE, setknowledgePerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('description')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [dialogInitialData, setDialogInitialData] = useState<KnowledgeFormData | undefined>(undefined)

  const openAddDialog = () => {
    setDialogMode('add')
    setDialogInitialData(undefined)
    setDialogOpen(true)
  }

  const openEditDialog = () => {
    const selectedIds = Object.entries(selectedknowledges)
      .filter(([, v]) => v)
      .map(([id]) => id)
    const target = MOCK_KNOWLEDGE.find((k) => k.id === selectedIds[0])
    if (!target) return
    setDialogMode('edit')
    setDialogInitialData({
      id: target.id,
      description: target.description,
      category: target.category,
    })
    setDialogOpen(true)
  }

  const hasSelection = Object.values(selectedknowledges).some(Boolean)

  const sortedKnowledge = useMemo(() => {
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

  const totalPages = Math.ceil(sortedKnowledge.length / knowledgeS_PER_PAGE)
  const paginatedknowledges = sortedKnowledge.slice(
    (knowledgePage - 1) * knowledgeS_PER_PAGE,
    knowledgePage * knowledgeS_PER_PAGE
  )

  const toggleknowledge = (knowledgeId: string) =>
    setSelectedknowledges((prev) => ({ ...prev, [knowledgeId]: !prev[knowledgeId] }))

  const handleRowsPerPageChange = (value: string) => {
    setknowledgePerPage(Number(value))
    setknowledgePage(1) // reset to first page so the view doesn't land out of bounds
  }

  const handleSortFieldChange = (value: string) => {
    setSortField(value as SortField)
    setknowledgePage(1)
  }

  const toggleSortDirection = () => {
    setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    setknowledgePage(1)
  }

  const pageNumbers = getPageNumbers(knowledgePage, totalPages)

  return (
    <div className="flex-1 flex flex-col min-h-0 p-8 overflow-hidden max-w-5xl w-full mx-auto justify-start">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        RAG Data Management
      </h1>

      {/* Menu Buttons */}
      <div
        className="flex items-center pt-4 mb-2"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <Button
          className="hover:border-white mr-1"
          size="sm"
          // onClick={() => setknowledgePage((p) => Math.max(p - 1, 1))}
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

        {hasSelection && (
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
              // onClick={() => setknowledgePage((p) => Math.max(p - 1, 1))}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--red2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--red3)')}
            >
              <Trash className="h-8 w-8 mr-1" />
              Delete Selected
            </Button>
          </>
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
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead> Knowledge Description</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[120px]">CreatedAt</TableHead>
              <TableHead className="w-[120px]">UpdatedAt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedknowledges.map((knowledge) => {
              const isSelected = !!selectedknowledges[knowledge.id]
              return (
                <TableRow
                  key={knowledge.id}
                  onClick={() => toggleknowledge(knowledge.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-white text-black hover:bg-white' : 'hover:bg-muted/40'
                  }`}
                >
                  <TableCell className="align-middle py-4">
                    {knowledge.id}
                  </TableCell>
                  <TableCell className={`align-middle py-4 ${isSelected ? '' : 'text-muted-foreground'}`}>
                    {knowledge.description}
                  </TableCell>
                  <TableCell className="align-middle py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                      {knowledge.category}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle py-4">
                    {knowledge.createdAt}
                  </TableCell>
                  <TableCell className="align-middle py-4">
                    {knowledge.updatedAt}
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
          Page <strong>{knowledgePage}</strong> of {totalPages} ({sortedKnowledge.length} elements
          total)
        </span>

        <div className="flex items-center space-x-2">
          <Button
            className="hover:border-white"
            size="sm"
            onClick={() => setknowledgePage((p) => Math.max(p - 1, 1))}
            disabled={knowledgePage === 1}
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
                  onClick={() => setknowledgePage(page)}
                  style={page === knowledgePage ? undefined : { backgroundColor: 'var(--gray3)' }}
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
            onClick={() => setknowledgePage((p) => Math.min(p + 1, totalPages))}
            disabled={knowledgePage === totalPages}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
          >
            Next
            <ChevronRight className="h-8 w-8 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Select value={String(knowledgeS_PER_PAGE)} onValueChange={handleRowsPerPageChange}>
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

      <AddEditKnowledgeDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={dialogInitialData}
        onOpenChange={setDialogOpen}
        onSave={(data) => {
          // Deliberately not applied to MOCK_KNOWLEDGE/table state per spec.
          console.log('knowledge saved (not persisted):', data)
        }}
      />
    </div>
  )
}
