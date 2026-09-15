// src/components/main/knowledgeList.tsx
'use client'

import { useState } from 'react'
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
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react'

export const MOCK_KNOWLEDGE = [
  { id: 'knowledge-1', name: 'Web Search',         description: 'Queries search engines for live web information.',                  category: 'Information', createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-2', name: 'Python Sandbox',     description: 'Executes untrusted mathematical and algorithmic scripts securely.', category: 'Runtime'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-3', name: 'Document Parser',    description: 'Extracts structural semantics from text, PDF, and CSV payloads.',   category: 'Data'       , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-4', name: 'Image Vectorizer',   description: 'Translates pixel layouts into relational coordinate systems.',      category: 'Vision'     , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-5', name: 'Time-Zone Engine',   description: 'Normalizes chronological structures across spatial zones.',         category: 'Utility'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
  { id: 'knowledge-6', name: 'Currency Evaluator', description: 'Fetches real-time financial conversions and spot prices.',          category: 'Finance'    , createdAt: '09/14/2026 4:43:00PM', updatedAt: '09/15/2026 4:43:00PM'},
]

const ROWS_PER_PAGE_OPTIONS = [4, 8, 10, 20]

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
  const [knowledgeS_PER_PAGE, setknowledgePerPage] = useState(4)

  const totalPages = Math.ceil(MOCK_KNOWLEDGE.length / knowledgeS_PER_PAGE)
  const paginatedknowledges = MOCK_KNOWLEDGE.slice(
    (knowledgePage - 1) * knowledgeS_PER_PAGE,
    knowledgePage * knowledgeS_PER_PAGE
  )

  const toggleknowledge = (knowledgeId: string) =>
    setSelectedknowledges((prev) => ({ ...prev, [knowledgeId]: !prev[knowledgeId] }))

  const handleRowsPerPageChange = (value: string) => {
    setknowledgePerPage(Number(value))
    setknowledgePage(1) // reset to first page so the view doesn't land out of bounds
  }

  const pageNumbers = getPageNumbers(knowledgePage, totalPages)

  return (
    <div className="flex-1 flex flex-col min-h-0 p-8 overflow-hidden max-w-5xl w-full mx-auto justify-start">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          RAG Data Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable certain knowledge for LLM RAG to recognize.
        </p>
      </div>

      {/* Table */}
      <ScrollArea type="auto" className="flex-1 min-h-0 border border-border rounded-xl bg-card">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[100px]">Active Status</TableHead>
              <TableHead className="w-[200px] font-medium">Knowledge Name</TableHead>
              <TableHead> Description</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[120px]">CreatedAt</TableHead>
              <TableHead className="w-[120px]">UpdatedAt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedknowledges.map((knowledge) => (
              <TableRow key={knowledge.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="align-middle py-4">
                  <Checkbox
                    id={knowledge.id}
                    checked={!!selectedknowledges[knowledge.id]}
                    onCheckedChange={() => toggleknowledge(knowledge.id)}
                  />
                </TableCell>
                <TableCell className="font-semibold text-foreground align-middle py-4">
                  <label htmlFor={knowledge.id} className="cursor-pointer block">
                    {knowledge.name}
                  </label>
                </TableCell>
                <TableCell className="text-muted-foreground align-middle py-4">
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
          Page <strong>{knowledgePage}</strong> of {totalPages} ({MOCK_KNOWLEDGE.length} elements
          total)
        </span>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => setknowledgePage((p) => Math.max(p - 1, 1))}
            disabled={knowledgePage === 1}
            style={{ backgroundColor: 'var(--gray3)' }}
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
                  variant={page === knowledgePage ? 'outline' : 'default'}
                  size="sm"
                  className="h-8 w-8"
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
            size="sm"
            onClick={() => setknowledgePage((p) => Math.min(p + 1, totalPages))}
            disabled={knowledgePage === totalPages}
            style={{ backgroundColor: 'var(--gray3)' }}
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
    </div>
  )
}
