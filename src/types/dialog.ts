export type KnowledgeFormData = {
  id?: string
  name: string
  description: string
  category: string
}

export type ToolFormData = {
  id?: string
  name: string
  description: string
  category: string
}

export const KNOWLEDGE_CATEGORY_OPTIONS = [
  'Information',
  'Runtime',
  'Data',
  'Vision',
  'Utility',
  'Finance',
]