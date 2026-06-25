// src/types/hast_nodes.ts
// HAST node type for the custom rehype plugin
export interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: {
    style?: string
    className?: string[] | string
    [key: string]: unknown
  }
  children?: HastNode[]
}