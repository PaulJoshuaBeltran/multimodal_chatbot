// src/components/MessageBubble.tsx
'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css' // Required for math equations to render correctly

// Define a structural interface for HTML AST (HAST) nodes to achieve full type safety
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: {
    style?: string;
    className?: string[] | string;
    [key: string]: unknown;
  };
  children?: HastNode[];
}

// Strictly-typed custom inline rehype plugin
function rehypeHighlightQuery({ query }: { query?: string }) {
  return (tree: HastNode): void => {
    if (!query || !query.trim()) return

    // Capture the narrowed type into an immutable local string for the inner closure
    const activeQuery: string = query

    function walk(node: HastNode): void {
      if (!node.children) return

      // Protect code blocks and KaTeX math nodes from being mangled by the highlighter
      const classes = node.properties?.className;
      const isProtected = node.tagName === 'code' || node.tagName === 'pre' || 
        (Array.isArray(classes) 
          ? classes.some(c => typeof c === 'string' && (c.includes('math') || c.includes('katex'))) 
          : typeof classes === 'string' && (classes.includes('math') || classes.includes('katex')));

      if (isProtected) return;

      const nextChildren: HastNode[] = []

      for (const child of node.children) {
        if (child.type === 'text') {
          const text = child.value || ''
          const escapedKeyword = activeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'))

          for (const part of parts) {
            if (part.toLowerCase() === activeQuery.toLowerCase()) {
              nextChildren.push({
                type: 'element',
                tagName: 'mark',
                properties: {
                  style: 'background-color: #ffeb3b; padding: 0 2px; border-radius: 2px; color: #000;'
                },
                children: [{ type: 'text', value: part }]
              })
            } else if (part) {
              nextChildren.push({ type: 'text', value: part })
            }
          }
        } else {
          walk(child)
          nextChildren.push(child)
        }
      }

      node.children = nextChildren
    }

    walk(tree)
  }
}

export default function MessageBubble({ role, id, content, streaming, onEdit, onDelete, highlightQuery }:
  { role: 'user' | 'assistant';
    id?: string;
    content: string;
    streaming?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    highlightQuery?: string }) {
  
  const [menuOpen, setMenuOpen] = useState(false)
  const isUser = role === 'user'

  // Helper utility to safely inject highlight markings on matched live search text
  function highlightLiveText(text: string, keyword?: string): React.JSX.Element {
    if (!keyword || !keyword.trim()) return <>{text}</>
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'))
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <mark
              key={i}
              style={{
                backgroundColor: '#ffeb3b',
                padding: '0 2px',
                borderRadius: 2,
                color: '#000',
              }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  return (
    <div 
      id={id ? `msg-${id}` : undefined}
      className="message-bubble-row"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        position: 'relative',
        marginBottom: 8,
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .message-bubble-row .settings-menu-trigger { opacity: 0; transition: opacity 0.15s ease-in-out; }
        .message-bubble-row:hover .settings-menu-trigger { opacity: 1; }
        
        /* Markdown / Documentation Styles for Assistant Bubble */
        .markdown-content p { margin: 0 0 10px 0; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .markdown-content ul, .markdown-content ol { margin: 0 0 10px 0; padding-left: 20px; }
        .markdown-content li { margin-bottom: 4px; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { margin: 14px 0 6px 0; font-weight: 600; line-height: 1.3; }
        .markdown-content h1 { font-size: 1.4rem; }
        .markdown-content h2 { font-size: 1.2rem; }
        .markdown-content h3 { font-size: 1.05rem; }
        
        /* Code blocks */
        .markdown-content code { background: rgba(0, 0, 0, 0.06); padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .markdown-content pre { background: #2d2d2d; color: #f8f8f2; padding: 14px; border-radius: 8px; overflow-x: auto; margin: 10px 0; }
        .markdown-content pre code { background: none; padding: 0; color: inherit; font-size: 13px; }
        
        /* Tables */
        .markdown-content table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 14px; }
        .markdown-content th, .markdown-content td { border: 1px solid #dcdcdc; padding: 8px 12px; text-align: left; }
        .markdown-content th { background-color: rgba(0, 0, 0, 0.04); font-weight: 600; }
      `}} />

      <div style={{
        background: isUser ? '#1a1a1a' : '#f1f1f1',
        color: isUser ? '#fff' : '#111',
        padding: '10px 16px',
        borderRadius: 16,
        borderBottomRightRadius: isUser ? 4 : 16,
        borderBottomLeftRadius: !isUser ? 4 : 16,
        whiteSpace: isUser ? 'pre-wrap' : 'normal',
        lineHeight: 1.6,
        fontSize: 15,
        position: 'relative',
        overflowX: 'auto', // Ensures wide math blocks don't break the bubble
      }}>
        
        {isUser ? (
          /* User Message: Regular plain text highlighter */
          <div>{highlightLiveText(content, highlightQuery)}</div>
        ) : (
          /* Assistant Message: Documentation & Markdown Formatter */
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[
                rehypeKatex, // katex transforms math before custom highlight check applies
                [rehypeHighlightQuery, { query: highlightQuery }]
              ]}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {isUser && (onEdit || onDelete) && (
          <div className="settings-menu-trigger" style={{
            position: 'absolute', top: '50%', left: '-34px', transform: 'translateY(-50%)', zIndex: 5
          }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{
                background: '#fff', border: '1px solid #ddd', borderRadius: '50%',
                width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 'bold', color: '#333', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              ⋮
            </button>

            {menuOpen && (
              <div 
                onMouseLeave={() => setMenuOpen(false)}
                style={{
                  position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff',
                  border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex', flexDirection: 'column', minWidth: 80, overflow: 'hidden'
                }}
              >
                {onEdit && (
                  <button onClick={() => { setMenuOpen(false); onEdit(); }} style={{ padding: '6px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#333' }}>
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => { setMenuOpen(false); onDelete(); }} style={{ padding: '6px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#dc3545' }}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {streaming && !isUser && (
        <span style={{ marginTop: 4, marginLeft: 4, fontSize: 12, color: '#888' }}>• thinking…</span>
      )}
    </div>
  )
}