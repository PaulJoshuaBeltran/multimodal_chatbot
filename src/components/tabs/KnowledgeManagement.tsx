// src/components/main/KnowledgeManagement.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
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
  Eye,
  Plus,
  RotateCw,
  SquarePen,
  Trash,
} from 'lucide-react'
import { KnowledgeFormData } from '@/src/types/dialog'
import { KnowledgeDocument } from '@/src/types/knowledge'
import { SortField } from '@/src/types/tabs'
import { toast } from '@/src/components/ui/toast'
import {
  fetchKnowledgeDocuments,
  createKnowledgeDocument,
  updateKnowledgeDocument,
  deleteKnowledgeDocument,
} from '@/lib/pineconeMongo/knowledgeApi'
import { AddEditKnowledgeDialog, DeleteKnowledgeDialog, PreviewKnowledgeDialog } from '../dialogs/KnowledgeDialog'

const ROWS_PER_PAGE_OPTIONS = [4, 8, 10, 20]

const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'category', label: 'Category' },
  { value: 'createdAt', label: 'Created At' },
  { value: 'updatedAt', label: 'Updated At' },
]

function getSortValue(doc: KnowledgeDocument, field: SortField): string | number {
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

function statusClasses(status: string) {
  switch (status) {
    case 'ready':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'processing':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'failed':
      return 'bg-red-500/15 text-red-400 border-red-500/30'
    default:
      return 'bg-secondary text-secondary-foreground border-border'
  }
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  const delta = 1

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
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const [knowledgePage, setKnowledgePage] = useState(1)
  const [knowledgePerPage, setKnowledgePerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [dialogInitialData, setDialogInitialData] = useState<KnowledgeFormData | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const docs = await fetchKnowledgeDocuments()
      setDocuments(docs)
      setSelectedIds({})
    } catch (e) {
      toast.add({
        title: "ERROR",
        description: e instanceof Error ? e.message : 'Failed to load knowledge',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const docs = await fetchKnowledgeDocuments()
        if (cancelled) return
        setDocuments(docs)
      } catch (e) {
        if (cancelled) return
        toast.add({
          title: "ERROR",
          description: e instanceof Error ? e.message : 'Failed to load knowledge',
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  function openPreviewDialog(doc: KnowledgeDocument, e: React.MouseEvent) {
    e.stopPropagation() // don't trigger row selection
    setPreviewDoc(doc)
    setPreviewDialogOpen(true)
  }

  const openAddDialog = () => {
    setDialogMode('add')
    setDialogInitialData(undefined)
    setDialogOpen(true)
  }

  const openEditDialog = () => {
    const selectedIdList = Object.entries(selectedIds)
      .filter(([, v]) => v)
      .map(([id]) => id)
    const target = documents.find((d) => d.id === selectedIdList[0])
    if (!target) return
    setDialogMode('edit')
    setDialogInitialData({
      id: target.id,
      title: target.title,
      category: target.category,
      content: target.chunks
        .slice()
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .map((c) => c.preview)
        .join('\n\n'),
    })
    setDialogOpen(true)
  }

  async function handleDialogSave(data: KnowledgeFormData) {
    try {
      if (dialogMode === 'add') {
        await createKnowledgeDocument(data.title, data.content ?? '', data.category)
        toast.add({ title: "SUCCESS", description: `ADDED: ${data.title.slice(0, 20)}...` })
      } else if (data.id) {
        await updateKnowledgeDocument(data.id, data.title, data.content ?? '', data.category)
        toast.add({ title: "SUCCESS", description: `UPDATED: ${data.title.slice(0, 20)}...` })
      }
      await refresh()
    } catch (e) {
      toast.add({
        title: "ERROR",
        description: e instanceof Error ? e.message : 'Failed to save knowledge',
      })
      throw e // keeps the dialog open on failure
    }
  }

  function openDeleteDialog() {
    if (!hasSelection) return
    setDeleteDialogOpen(true)
  }

  async function confirmDeleteSelected() {
    const ids = Object.entries(selectedIds).filter(([, v]) => v).map(([id]) => id)
    if (ids.length === 0) {
      setDeleteDialogOpen(false)
      return
    }
    setDeleting(true)
    try {
      const results = await Promise.allSettled(ids.map((id) => deleteKnowledgeDocument(id)))
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed > 0) {
        toast.add({ title: "ERROR", description: `${failed} of ${ids.length} item(s) failed to delete` })
      } else {
        toast.add({ title: "SUCCESS", description: `Deleted ${ids.length} item(s)` })
      }
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      await refresh()
    }
  }

  const hasSelection = Object.values(selectedIds).some(Boolean)

  const sortedDocuments = useMemo(() => {
    const copy = [...documents]
    copy.sort((a, b) => {
      const av = getSortValue(a, sortField)
      const bv = getSortValue(b, sortField)
      const cmp =
        typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return copy
  }, [documents, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedDocuments.length / knowledgePerPage))

  const currentPage = Math.min(knowledgePage, totalPages)

  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * knowledgePerPage,
    currentPage * knowledgePerPage
  )

  const toggleDoc = (docId: string) =>
    setSelectedIds((prev) => ({ ...prev, [docId]: !prev[docId] }))

  const handleRowsPerPageChange = (value: string) => {
    setKnowledgePerPage(Number(value))
    setKnowledgePage(1)
  }

  const handleSortFieldChange = (value: string) => {
    setSortField(value as SortField)
    setKnowledgePage(1)
  }

  const toggleSortDirection = () => {
    setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    setKnowledgePage(1)
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div className="flex-1 flex flex-col min-h-0 p-8 overflow-hidden max-w-5xl w-full mx-auto justify-start">
      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        RAG Data Management
      </h1>

      <div
        className="flex items-center pt-4 mb-2"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <Button
          className="hover:border-white mr-1"
          size="sm"
          onClick={refresh}
          disabled={loading}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
        >
          <RotateCw className={`h-8 w-8 mr-1 ${loading ? 'animate-spin' : ''}`} />
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
              onClick={openDeleteDialog}
              disabled={deleting}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--red2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--red3)')}
            >
              <Trash className="h-8 w-8 mr-1" />
              {deleting ? 'Deleting…' : 'Delete Selected'}
            </Button>
          </>
        )}

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

      <ScrollArea type="auto" className="flex-1 min-h-0 border border-border rounded-xl bg-card">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[160px]">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[90px]">Preview</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[140px]">CreatedAt</TableHead>
              <TableHead className="w-[140px]">UpdatedAt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : paginatedDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No knowledge entries yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedDocuments.map((doc) => {
                const isSelected = !!selectedIds[doc.id]
                return (
                  <TableRow
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-white text-black hover:bg-white' : 'hover:bg-muted/40'
                    }`}
                  >
                    <TableCell className="align-middle py-4 font-mono text-xs">
                      {doc.id}
                    </TableCell>
                    <TableCell className={`align-middle py-4 ${isSelected ? '' : 'text-muted-foreground'}`}>
                      {doc.title}
                    </TableCell>
                    <TableCell className="align-middle py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => openPreviewDialog(doc, e)}
                        style={{ backgroundColor: 'var(--gray3)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="align-middle py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                        {doc.category}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusClasses(doc.status)}`}>
                        {doc.status}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle py-4">
                      {new Date(doc.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="align-middle py-4">
                      {new Date(doc.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <div
        className="flex items-center justify-between border-t border-border pt-4 mt-4"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <span className="text-sm text-muted-foreground">
          Page <strong>{currentPage}</strong> of {totalPages} ({sortedDocuments.length} elements
          total)
        </span>

        <Button
          className="hover:border-white"
          size="sm"
          onClick={() => setKnowledgePage((p) => Math.max(Math.min(p, totalPages) - 1, 1))}
          disabled={currentPage === 1}
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
                onClick={() => setKnowledgePage(page)}
                style={page === currentPage ? undefined : { backgroundColor: 'var(--gray3)' }}
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
          onClick={() => setKnowledgePage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
        >
          Next
          <ChevronRight className="h-8 w-8 ml-1" />
        </Button>

        <div className="flex items-center gap-1">
          <Select value={String(knowledgePerPage)} onValueChange={handleRowsPerPageChange}>
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

      <PreviewKnowledgeDialog
        open={previewDialogOpen}
        title={previewDoc?.title ?? ''}
        chunks={previewDoc?.chunks ?? []}
        onOpenChange={setPreviewDialogOpen}
      />

      <AddEditKnowledgeDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={dialogInitialData}
        onOpenChange={setDialogOpen}
        onSave={handleDialogSave}
      />

      <DeleteKnowledgeDialog
        count={Object.values(selectedIds).filter(Boolean).length}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteSelected}
        deleting={deleting}
      />
    </div>
  )
}
